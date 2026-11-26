import cors from "cors";
import express, { type Request, type Response } from "express";
import {
  generateSessionToken,
  hashPassword,
  normalizeEmail,
  normalizeHandle,
  verifyPassword,
} from "./auth.js";
import {
  type AccountRecord,
  createAccount,
  createSession,
  deleteSession,
  deleteThreadForUser,
  findAccountByIdentifier,
  findOrCreateThread,
  formatThreadForUser,
  getAccountBySessionToken,
  getAllCollections,
  getCollection,
  getDbMode,
  getThreadById,
  getThreadsForUser,
  getUserState,
  getWorkspaceSnapshot,
  initDatabase,
  isHandleTaken,
  pushNotificationToUser,
  recordProfileVisit,
  saveThread,
  saveWorkspaceSnapshot,
  updateAccountProfile,
  updateCollection,
  updateUserState,
} from "./db.js";
import { aiGenerate, aiStatus, type AiTask } from "./ai.js";
import { INITIAL_SEED } from "./seed.js";

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Client-Id",
      "X-Thursday-Client-Id",
      "Last-Event-ID",
    ],
  }),
);
app.use(express.json({ limit: "30mb" }));

// ==================== REAL-TIME SSE BUS & PRESENCE ====================
interface SseClient {
  id: string;
  clientId: string;
  userId: string;
  res: Response;
}
const sseClients = new Map<string, SseClient>();
let eventSeq = 1;

function getOnlineUserIds(): string[] {
  // Pure real-time presence: only accounts with a live SSE connection count.
  const set = new Set<string>();
  for (const c of sseClients.values()) {
    if (c.userId) set.add(c.userId);
  }
  return Array.from(set);
}

function broadcast(
  event: string,
  payload: unknown,
  opts?: { targetUserIds?: string[]; excludeClientId?: string },
) {
  const id = String(eventSeq++);
  const frame = `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients.values()) {
    if (opts?.excludeClientId && client.id === opts.excludeClientId) continue;
    if (opts?.targetUserIds && !opts.targetUserIds.includes(client.userId)) continue;
    try {
      client.res.write(frame);
    } catch {
      sseClients.delete(client.id);
    }
  }
}

function broadcastPresence() {
  broadcast("presence:update", {
    onlineUserIds: getOnlineUserIds(),
    connectedCount: sseClients.size,
  });
}

setInterval(() => {
  for (const client of sseClients.values()) {
    try {
      client.res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      sseClients.delete(client.id);
    }
  }
}, 20_000);

function extractBearerToken(req: Request): string {
  const authHeader = String(req.header("authorization") || "");
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (typeof req.query.token === "string") {
    return req.query.token.trim();
  }
  return "";
}

async function resolveRequestActor(req: Request): Promise<{
  userId: string;
  account: AccountRecord | null;
  clientId: string;
}> {
  const token = extractBearerToken(req);
  const rawClientId = (
    req.header("x-thursday-client-id") ||
    req.header("x-client-id") ||
    (req.query.clientId as string) ||
    "default"
  ).slice(0, 80);

  if (token) {
    const account = await getAccountBySessionToken(token);
    if (account) {
      return { userId: account.id, account, clientId: rawClientId };
    }
  }
  return { userId: "me", account: null, clientId: rawClientId };
}

function nowClockLabel() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Project a post for a specific userId so liked/saved/poll voted are multi-user accurate
function projectPostForUser(post: any, userId: string) {
  const likedBy: string[] = Array.isArray(post.likedBy)
    ? post.likedBy
    : post.liked && userId === "me"
      ? ["me"]
      : [];
  const savedBy: string[] = Array.isArray(post.savedBy)
    ? post.savedBy
    : post.saved && userId === "me"
      ? ["me"]
      : [];
  const baseLikes =
    typeof post.baseLikes === "number"
      ? post.baseLikes
      : Math.max(0, Number(post.likes || 0) - (post.liked ? 1 : 0));

  let poll = post.poll;
  if (poll) {
    const votesByUser: Record<string, string> = poll.votesByUser || {};
    const votedOptionId =
      votesByUser[userId] || (userId === "me" ? poll.votedOptionId : undefined);
    poll = {
      ...poll,
      votedOptionId,
    };
  }

  return {
    ...post,
    liked: likedBy.includes(userId),
    saved: savedBy.includes(userId),
    likes: baseLikes + likedBy.length,
    poll,
  };
}

function projectReelForUser(reel: any, userId: string) {
  const likedBy: string[] = Array.isArray(reel.likedBy) ? reel.likedBy : [];
  const savedBy: string[] = Array.isArray(reel.savedBy) ? reel.savedBy : [];
  const baseLikes = Number(reel.baseLikes ?? reel.likes ?? 0);
  return {
    ...reel,
    liked: reel.liked && userId === "me" ? true : likedBy.includes(userId),
    saved: reel.saved && userId === "me" ? true : savedBy.includes(userId),
    likes: baseLikes + likedBy.length,
  };
}
function projectCircleForUser(circle: any, userId: string) {
  const joinedBy: string[] = Array.isArray(circle.joinedBy)
    ? circle.joinedBy
    : circle.joined
      ? ["me"]
      : [];
  return {
    ...circle,
    joined: joinedBy.includes(userId),
  };
}

function projectEventForUser(ev: any, userId: string) {
  const attendeeIds: string[] = Array.isArray(ev.attendeeIds) ? ev.attendeeIds : [];
  const rsvped = attendeeIds.includes(userId) || (userId === "me" && Boolean(ev.rsvped));
  return {
    ...ev,
    rsvped,
    attendeeIds,
  };
}

function sanitizeAccountPublic(account: AccountRecord) {
  return {
    id: account.id,
    email: account.email,
    handle: account.handle,
    profile: account.profile,
    createdAt: account.createdAt,
  };
}

// ==================== HEALTH & REAL-TIME STREAM ====================
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "thursday-railway-api",
    database: getDbMode(),
    connectedClients: sseClients.size,
    onlineUserIds: getOnlineUserIds(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/stream", async (req, res) => {
  const actor = await resolveRequestActor(req);
  const clientId = actor.clientId;
  const id = `${clientId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  sseClients.set(id, { id, clientId, userId: actor.userId, res });
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      connectionId: id,
      userId: actor.userId,
      onlineUserIds: getOnlineUserIds(),
      connectedClients: sseClients.size,
      database: getDbMode(),
    })}\n\n`,
  );
  broadcastPresence();

  req.on("close", () => {
    sseClients.delete(id);
    broadcastPresence();
  });
});

// ==================== AUTHENTICATION ====================
app.get("/api/auth/check-handle", async (req, res) => {
  try {
    const raw = String(req.query.handle || "");
    const clean = normalizeHandle(raw);
    if (clean.length < 2) {
      return res.json({ ok: true, available: false, handle: clean, reason: "Too short" });
    }
    const taken = await isHandleTaken(clean);
    res.json({ ok: true, available: !taken, handle: clean });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Check failed" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const rawHandle = String(req.body?.handle || "");
    const rawEmail = String(req.body?.email || "");
    const password = String(req.body?.password || "");
    const bio = String(
      req.body?.bio || "Sharing unhurried notes and moments on Thursday.",
    ).trim();
    const location = String(req.body?.location || "Somewhere quiet").trim();
    const avatar =
      String(req.body?.avatar || "").trim() ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop&crop=faces`;

    const handle = normalizeHandle(rawHandle || name);
    const email = normalizeEmail(rawEmail);

    if (!name || name.length < 2) {
      return res.status(400).json({ ok: false, error: "Please enter your name." });
    }
    if (!handle || handle.length < 2) {
      return res
        .status(400)
        .json({ ok: false, error: "Choose a handle with at least 2 characters." });
    }
    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ ok: false, error: "Password must be at least 6 characters." });
    }

    const existingHandle = await findAccountByIdentifier(handle);
    if (existingHandle) {
      return res
        .status(409)
        .json({ ok: false, error: `@${handle} is already taken. Try another handle.` });
    }
    const existingEmail = await findAccountByIdentifier(email);
    if (existingEmail) {
      return res
        .status(409)
        .json({ ok: false, error: "An account with this email already exists. Sign in instead." });
    }

    const userId = `u_${handle}_${Date.now().toString(36).slice(-4)}`;
    const profile = {
      id: userId,
      name,
      handle,
      avatar,
      cover:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&h=480&fit=crop",
      bio,
      location,
      website: `${handle}.thursday.social`,
      followers: 1,
      following: 3,
      verified: false,
    };

    const account = await createAccount({
      id: userId,
      email,
      handle,
      passwordHash: hashPassword(password),
      profile,
      createdAt: new Date().toISOString(),
    });

    // Add to global people directory so all users see them live
    await updateCollection("people", (list) => {
      if (list.some((p: any) => p.id === userId)) return list;
      return [profile, ...list];
    });

    // Seed initial user state + warm welcome DM thread from Maya
    await getUserState(userId, profile);
    const welcomeThread = await findOrCreateThread(userId, "maya");
    if (welcomeThread.messages.length === 0) {
      welcomeThread.messages.push({
        id: `msg_welcome_${Date.now()}`,
        from: "them",
        senderId: "maya",
        text: `Welcome to Thursday, ${name.split(" ")[0]}! Pull up a chair — this is our quieter corner for studios, recipes, walks, and small circles.`,
        time: nowClockLabel(),
        seen: false,
      });
      welcomeThread.meta[userId] = { ...(welcomeThread.meta[userId] || {}), unread: 1 };
      await saveThread(welcomeThread);
    }

    const token = generateSessionToken();
    await createSession(token, userId);

    broadcast("person:joined", profile);
    res.status(201).json({
      ok: true,
      token,
      user: sanitizeAccountPublic(account),
    });
  } catch (err: any) {
    console.error("signup error:", err);
    res.status(500).json({ ok: false, error: err?.message || "Sign up failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const identifier = String(req.body?.identifier || req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Enter your email or @handle and password." });
    }
    const account = await findAccountByIdentifier(identifier);
    if (!account || !verifyPassword(password, account.passwordHash)) {
      return res
        .status(401)
        .json({ ok: false, error: "Invalid email/@handle or password." });
    }
    const token = generateSessionToken();
    await createSession(token, account.id);
    res.json({
      ok: true,
      token,
      user: sanitizeAccountPublic(account),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Login failed" });
  }
});

app.post("/api/auth/demo", async (req, res) => {
  try {
    const target = String(req.body?.accountId || "me").trim();
    const account =
      (await findAccountByIdentifier(target)) || (await findAccountByIdentifier("me"));
    if (!account) {
      return res.status(404).json({ ok: false, error: "Demo account not found" });
    }
    const token = generateSessionToken();
    await createSession(token, account.id);
    res.json({
      ok: true,
      token,
      user: sanitizeAccountPublic(account),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Demo sign-in failed" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ ok: false, error: "Not signed in" });
    }
    const account = await getAccountBySessionToken(token);
    if (!account) {
      return res.status(401).json({ ok: false, error: "Session expired" });
    }
    res.json({ ok: true, user: sanitizeAccountPublic(account) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Auth check failed" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = extractBearerToken(req);
    if (token) await deleteSession(token);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Logout failed" });
  }
});

// ==================== BOOTSTRAP ====================
app.get("/api/bootstrap", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const onlineSet = new Set(getOnlineUserIds());

    const [collections, userState, userThreads] = await Promise.all([
      getAllCollections(),
      getUserState(userId, actor.account?.profile),
      getThreadsForUser(userId),
    ]);

    const meProfile = actor.account?.profile
      ? { ...userState.me, ...actor.account.profile, id: userId }
      : userState.me;

    const people = collections.people.some((p: any) => p.id === userId)
      ? collections.people.map((p: any) => (p.id === userId ? { ...p, ...meProfile } : p))
      : [meProfile, ...collections.people];

    const formattedConversations = userThreads.map((t) =>
      formatThreadForUser(t, userId, onlineSet),
    );

    res.json({
      ok: true,
      database: getDbMode(),
      authenticated: Boolean(actor.account),
      userId,
      onlineUserIds: Array.from(onlineSet),
      people,
      posts: collections.posts.map((p: any) => projectPostForUser(p, userId)),
      stories: collections.stories,
      highlights: collections.highlights,
      reels: collections.reels.map((r: any) => projectReelForUser(r, userId)),
      circles: collections.circles.map((c: any) => projectCircleForUser(c, userId)),
      events: collections.events.map((e: any) => projectEventForUser(e, userId)),
      prompts: collections.prompts,
      guides: collections.guides,
      me: meProfile,
      followingIds: userState.followingIds,
      // Only real threads are returned. Previously an empty thread table fell
      // back to seeded demo conversations, which is why the inbox showed fake
      // people with fake messages that could never receive a reply.
      conversations: formattedConversations,
      notifications: userState.notifications,
      drafts: userState.drafts,
      savedGuideIds: userState.savedGuideIds,
      guideSteps: userState.guideSteps,
      promptVotes: userState.promptVotes,
      preferences: userState.preferences,
      visitors: userState.visitors || [],
    });
  } catch (err: any) {
    console.error("Bootstrap error:", err);
    res.status(500).json({ ok: false, error: err?.message || "Bootstrap failed" });
  }
});

// ==================== PROFILE & FOLLOW & VISITORS ====================
/**
 * A profile photo is only worth storing if a browser can actually draw it.
 * The old client would fall back to the raw file when it could not decode one
 * (HEIC from an iPhone, a truncated JPEG), and the server happily saved it —
 * which is how a profile ends up "set" but completely blank.
 */
function validateProfileImage(value: unknown, label: string): string | null {
  if (value === undefined || value === null) return null;
  const raw = String(value);
  if (!raw) return null;
  if (!raw.startsWith("data:")) {
    // A normal URL is fine; leave it alone.
    return /^https?:\/\//i.test(raw) ? null : `${label} must be an image.`;
  }
  const match = /^data:([a-z0-9.+\/-]+);base64,/i.exec(raw);
  if (!match) return `${label} is not a valid image.`;
  const mime = match[1].toLowerCase();
  const renderable = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];
  if (!renderable.includes(mime)) {
    return `${label} is in a format browsers cannot display. Please use a JPEG or PNG.`;
  }
  if (raw.length > 8_000_000) {
    return `${label} is too large. Please choose a smaller photo.`;
  }
  return null;
}

app.put("/api/me", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const updates = req.body || {};

    for (const [field, label] of [
      ["avatar", "That profile photo"],
      ["cover", "That cover photo"],
    ] as const) {
      const problem = validateProfileImage(updates[field], label);
      if (problem) {
        return res.status(400).json({ ok: false, error: problem });
      }
    }

    const nextState = await updateUserState(userId, (curr) => ({
      ...curr,
      me: { ...curr.me, ...updates, id: userId },
    }));

    if (actor.account) {
      await updateAccountProfile(userId, nextState.me);
    }

    await updateCollection("people", (people) => {
      const exists = people.some((p: any) => p.id === userId);
      if (!exists) return [nextState.me, ...people];
      return people.map((p: any) => (p.id === userId ? { ...p, ...nextState.me } : p));
    });

    broadcast("profile:updated", nextState.me);
    res.json({ ok: true, me: nextState.me });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/people/:id/follow", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const targetId = req.params.id;
    let isNowFollowing = false;

    const nextState = await updateUserState(userId, (curr) => {
      const exists = curr.followingIds.includes(targetId);
      isNowFollowing = !exists;
      return {
        ...curr,
        followingIds: exists
          ? curr.followingIds.filter((x) => x !== targetId)
          : [...curr.followingIds, targetId],
      };
    });

    const updatedPeople = await updateCollection("people", (people) =>
      people.map((p: any) => {
        if (p.id === targetId) {
          return {
            ...p,
            followers: Math.max(0, (p.followers || 0) + (isNowFollowing ? 1 : -1)),
          };
        }
        if (p.id === userId) {
          return {
            ...p,
            following: Math.max(0, nextState.followingIds.length),
          };
        }
        return p;
      }),
    );

    if (isNowFollowing && targetId !== userId) {
      const notice = await pushNotificationToUser(targetId, {
        type: "follow",
        actorId: userId,
        text: "started following your notes.",
      });
      if (notice) {
        broadcast("notification:created", { targetUserId: targetId, notice }, {
          targetUserIds: [targetId],
        });
      }
    }

    const updatedTarget = updatedPeople.find((p: any) => p.id === targetId);
    broadcast("person:updated", updatedTarget);
    res.json({
      ok: true,
      followingIds: nextState.followingIds,
      following: isNowFollowing,
      person: updatedTarget,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/people/:id/visit", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const targetId = req.params.id;
    if (targetId && targetId !== actor.userId) {
      const visitors = await recordProfileVisit(targetId, actor.userId);
      broadcast(
        "visitor:recorded",
        { targetUserId: targetId, visitors },
        { targetUserIds: [targetId] },
      );
      return res.json({ ok: true, visitors });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== POSTS (FEED + CIRCLES + COMMENTS + POLLS) ====================
app.get("/api/posts", async (req, res) => {
  const actor = await resolveRequestActor(req);
  const posts = await getCollection("posts");
  res.json({ ok: true, posts: posts.map((p: any) => projectPostForUser(p, actor.userId)) });
});

app.post("/api/posts", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const body = req.body || {};
    const newPost = {
      id: body.id || `post_${Date.now()}`,
      authorId: actor.userId,
      time: "Just now",
      createdAt: new Date().toISOString(),
      text: String(body.text || ""),
      images: Array.isArray(body.images) ? body.images : undefined,
      aspect: body.aspect,
      location: body.location,
      likes: 0,
      baseLikes: 0,
      likedBy: [],
      savedBy: [],
      liked: false,
      saved: false,
      reposts: 0,
      comments: [],
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      poll: body.poll ? { ...body.poll, votesByUser: {} } : undefined,
      voice: body.voice,
      feeling: body.feeling,
      circleId: body.circleId,
      pinned: Boolean(body.pinned),
      repostOf: body.repostOf,
    };

    await updateCollection("posts", (posts) => [newPost, ...posts]);

    if (newPost.circleId) {
      await updateCollection("circles", (circles) =>
        circles.map((c: any) =>
          c.id === newPost.circleId
            ? { ...c, posts: (c.posts || 0) + 1, activity: "Active just now" }
            : c,
        ),
      );
    }

    // Notify mentioned @handles in post text
    const mentionMatches = Array.from(newPost.text.matchAll(/@([a-zA-Z0-9_]+)/g)).map(
      (m) => m[1].toLowerCase(),
    );
    if (mentionMatches.length > 0) {
      const people = await getCollection("people");
      for (const handle of mentionMatches) {
        const mentioned = people.find((p: any) => String(p.handle || "").toLowerCase() === handle);
        if (mentioned && mentioned.id !== actor.userId) {
          const notice = await pushNotificationToUser(mentioned.id, {
            type: "mention",
            actorId: actor.userId,
            text: "mentioned you in a note.",
            postId: newPost.id,
            postImage: newPost.images?.[0],
          });
          if (notice) {
            broadcast("notification:created", { targetUserId: mentioned.id, notice }, {
              targetUserIds: [mentioned.id],
            });
          }
        }
      }
    }

    broadcast("post:created", newPost);
    res.status(201).json({ ok: true, post: projectPostForUser(newPost, actor.userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.patch("/api/posts/:id", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const postId = req.params.id;
    let updated: any = null;
    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId) return p;
        if (p.authorId !== actor.userId && actor.userId !== "me") return p;
        updated = {
          ...p,
          text: typeof req.body?.text === "string" ? req.body.text : p.text,
          location:
            typeof req.body?.location === "string" ? req.body.location : p.location,
          editedAt: new Date().toISOString(),
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Post not found" });
    broadcast("post:updated", updated);
    res.json({ ok: true, post: projectPostForUser(updated, actor.userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.delete("/api/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    await updateCollection("posts", (posts) => posts.filter((p: any) => p.id !== postId));
    broadcast("post:deleted", { id: postId });
    res.json({ ok: true, id: postId });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const postId = req.params.id;
    let updated: any = null;
    let didLike = false;

    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId) return p;
        const baseLikes =
          typeof p.baseLikes === "number"
            ? p.baseLikes
            : Math.max(0, Number(p.likes || 0) - (p.liked ? 1 : 0));
        const likedBy: string[] = Array.isArray(p.likedBy)
          ? [...p.likedBy]
          : p.liked
            ? ["me"]
            : [];
        const has = likedBy.includes(userId);
        didLike = !has;
        const nextLikedBy = has ? likedBy.filter((x) => x !== userId) : [...likedBy, userId];
        updated = {
          ...p,
          baseLikes,
          likedBy: nextLikedBy,
          likes: baseLikes + nextLikedBy.length,
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Post not found" });

    if (didLike && updated.authorId && updated.authorId !== userId) {
      const notice = await pushNotificationToUser(updated.authorId, {
        type: "like",
        actorId: userId,
        text: "liked your note.",
        postId: updated.id,
        postImage: updated.images?.[0],
      });
      if (notice) {
        broadcast("notification:created", { targetUserId: updated.authorId, notice }, {
          targetUserIds: [updated.authorId],
        });
      }
    }

    broadcast("post:updated", updated);
    res.json({ ok: true, post: projectPostForUser(updated, userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/posts/:id/save", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const postId = req.params.id;
    let updated: any = null;
    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId) return p;
        const savedBy: string[] = Array.isArray(p.savedBy)
          ? [...p.savedBy]
          : p.saved
            ? ["me"]
            : [];
        const has = savedBy.includes(userId);
        const nextSavedBy = has ? savedBy.filter((x) => x !== userId) : [...savedBy, userId];
        updated = { ...p, savedBy: nextSavedBy };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Post not found" });
    res.json({ ok: true, post: projectPostForUser(updated, userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/posts/:id/pin", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const postId = req.params.id;
    let updated: any = null;
    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId) return p;
        updated = { ...p, pinned: !p.pinned };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Post not found" });
    broadcast("post:updated", updated);
    res.json({ ok: true, post: projectPostForUser(updated, actor.userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/posts/:id/repost", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const postId = req.params.id;
    const note = String(req.body?.note || "").trim();
    const posts = await getCollection<any>("posts");
    const source = posts.find((p) => p.id === postId);
    if (!source) return res.status(404).json({ ok: false, error: "Post not found" });

    const repost = {
      id: `repost_${Date.now()}`,
      authorId: userId,
      time: "Just now",
      createdAt: new Date().toISOString(),
      text: note,
      likes: 0,
      baseLikes: 0,
      likedBy: [],
      savedBy: [],
      liked: false,
      saved: false,
      reposts: 0,
      comments: [],
      repostOf: {
        postId: source.id,
        authorId: source.authorId,
        text: source.text,
        image: source.images?.[0],
      },
    };

    let updatedSource: any = null;
    await updateCollection("posts", (curr) => [
      repost,
      ...curr.map((p: any) => {
        if (p.id !== postId) return p;
        updatedSource = { ...p, reposts: (p.reposts || 0) + 1 };
        return updatedSource;
      }),
    ]);

    if (source.authorId && source.authorId !== userId) {
      const notice = await pushNotificationToUser(source.authorId, {
        type: "mention",
        actorId: userId,
        text: "reposted your note to their circle.",
        postId: source.id,
        postImage: source.images?.[0],
      });
      if (notice) {
        broadcast("notification:created", { targetUserId: source.authorId, notice }, {
          targetUserIds: [source.authorId],
        });
      }
    }

    broadcast("post:updated", updatedSource);
    broadcast("post:created", repost);
    res.status(201).json({
      ok: true,
      repost: projectPostForUser(repost, userId),
      source: projectPostForUser(updatedSource, userId),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const postId = req.params.id;
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ ok: false, error: "Comment text required" });

    const comment = {
      id: req.body?.id || `c_${Date.now()}`,
      authorId: userId,
      text,
      time: "Just now",
      likes: 0,
      liked: false,
    };

    let updated: any = null;
    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId) return p;
        updated = { ...p, comments: [...(p.comments || []), comment] };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Post not found" });

    if (updated.authorId && updated.authorId !== userId) {
      const snippet = text.length > 56 ? `${text.slice(0, 56)}…` : text;
      const notice = await pushNotificationToUser(updated.authorId, {
        type: "comment",
        actorId: userId,
        text: `replied: "${snippet}"`,
        postId: updated.id,
        postImage: updated.images?.[0],
      });
      if (notice) {
        broadcast("notification:created", { targetUserId: updated.authorId, notice }, {
          targetUserIds: [updated.authorId],
        });
      }
    }

    broadcast("post:updated", updated);
    res.status(201).json({
      ok: true,
      comment,
      post: projectPostForUser(updated, userId),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/posts/:id/comments/:commentId/like", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const { id: postId, commentId } = req.params;
    let updated: any = null;
    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId) return p;
        updated = {
          ...p,
          comments: (p.comments || []).map((c: any) => {
            if (c.id !== commentId) return c;
            const liked = !c.liked;
            return { ...c, liked, likes: Math.max(0, (c.likes || 0) + (liked ? 1 : -1)) };
          }),
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Post not found" });
    broadcast("post:updated", updated);
    res.json({ ok: true, post: projectPostForUser(updated, actor.userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post(["/api/posts/:id/poll/vote", "/api/posts/:id/vote"], async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const postId = req.params.id;
    const optionId = String(req.body?.optionId || "");
    let updated: any = null;
    await updateCollection("posts", (posts) =>
      posts.map((p: any) => {
        if (p.id !== postId || !p.poll) return p;
        const votesByUser: Record<string, string> = { ...(p.poll.votesByUser || {}) };
        const prev = votesByUser[userId] || (userId === "me" ? p.poll.votedOptionId : undefined);
        if (prev === optionId) return p;
        votesByUser[userId] = optionId;
        updated = {
          ...p,
          poll: {
            ...p.poll,
            votesByUser,
            totalVotes: prev ? p.poll.totalVotes : (p.poll.totalVotes || 0) + 1,
            options: (p.poll.options || []).map((opt: any) => {
              if (opt.id === optionId) return { ...opt, votes: (opt.votes || 0) + 1 };
              if (opt.id === prev) return { ...opt, votes: Math.max(0, (opt.votes || 0) - 1) };
              return opt;
            }),
          },
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Poll not found" });
    broadcast("post:updated", updated);
    res.json({ ok: true, post: projectPostForUser(updated, userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== STORIES & HIGHLIGHTS ====================
app.post("/api/stories", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const body = req.body || {};
    const story = {
      id: body.id || `story_${Date.now()}`,
      personId: actor.userId,
      image: body.image,
      caption: body.caption || "",
      time: "Just now",
      seen: false,
      sticker: body.sticker,
      filter: body.filter,
    };
    await updateCollection("stories", (stories) => [story, ...stories]);
    broadcast("story:created", story);
    res.status(201).json({ ok: true, story });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/stories/:id/seen", async (req, res) => {
  try {
    const storyId = req.params.id;
    let updated: any = null;
    await updateCollection("stories", (stories) =>
      stories.map((s: any) => {
        if (s.id !== storyId) return s;
        updated = { ...s, seen: true };
        return updated;
      }),
    );
    res.json({ ok: true, story: updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/highlights", async (req, res) => {
  try {
    const body = req.body || {};
    const highlight = {
      id: body.id || `hl_${Date.now()}`,
      title: String(body.title || "Moments"),
      cover: body.cover,
      frames: Array.isArray(body.frames) ? body.frames : [],
    };
    await updateCollection("highlights", (items) => [...items, highlight]);
    broadcast("highlight:created", highlight);
    res.status(201).json({ ok: true, highlight });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.delete("/api/highlights/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await updateCollection("highlights", (items) => items.filter((h: any) => h.id !== id));
    broadcast("highlight:deleted", { id });
    res.json({ ok: true, id });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== REELS ====================
app.post("/api/reels", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const body = req.body || {};
    const reel = {
      id: body.id || `reel_${Date.now()}`,
      authorId: actor.userId,
      video: body.video,
      poster: body.poster,
      caption: String(body.caption || ""),
      audio: String(body.audio || "Original studio sound"),
      location: body.location,
      duration: body.duration || "0:15",
      likes: 0,
      liked: false,
      saved: false,
      shares: 0,
      views: "1",
      viewCount: 1,
      comments: [],
    };
    await updateCollection("reels", (reels) => [reel, ...reels]);
    broadcast("reel:created", reel);
    res.status(201).json({ ok: true, reel });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/reels/:id/view", async (req, res) => {
  try {
    const id = req.params.id;
    let updated: any = null;
    await updateCollection("reels", (reels) =>
      reels.map((r: any) => {
        if (r.id !== id) return r;
        const parsed =
          typeof r.viewCount === "number"
            ? r.viewCount
            : Number(r.views) ||
              (String(r.views || "").toLowerCase().endsWith("k")
                ? Math.round(parseFloat(r.views) * 1000)
                : Number(String(r.views || "1").replace(/[^0-9]/g, "")) || 1);
        const nextCount = parsed + 1;
        // Keep counts numeric so the client can format consistently live.
        updated = { ...r, viewCount: nextCount, views: nextCount };
        return updated;
      }),
    );
    if (updated) broadcast("reel:updated", updated);
    res.json({ ok: true, reel: updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/reels/:id/like", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const id = req.params.id;
    let updated: any = null;
    await updateCollection("reels", (reels) =>
      reels.map((r: any) => {
        if (r.id !== id) return r;
        const likedBy: string[] = Array.isArray(r.likedBy) ? r.likedBy : [];
        const has = likedBy.includes(actor.userId);
        const nextLikedBy = has
          ? likedBy.filter((u) => u !== actor.userId)
          : [...likedBy, actor.userId];
        updated = {
          ...r,
          likedBy: nextLikedBy,
          baseLikes: r.baseLikes ?? r.likes ?? 0,
          likes: Math.max(0, (r.baseLikes ?? r.likes ?? 0) + nextLikedBy.length),
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Reel not found" });
    broadcast("reel:updated", updated);
    res.json({ ok: true, reel: updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/reels/:id/save", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const id = req.params.id;
    let updated: any = null;
    await updateCollection("reels", (reels) =>
      reels.map((r: any) => {
        if (r.id !== id) return r;
        const savedBy: string[] = Array.isArray(r.savedBy) ? r.savedBy : [];
        const nextSavedBy = savedBy.includes(actor.userId)
          ? savedBy.filter((u) => u !== actor.userId)
          : [...savedBy, actor.userId];
        updated = { ...r, savedBy: nextSavedBy };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Reel not found" });
    broadcast("reel:updated", updated);
    res.json({ ok: true, reel: updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/reels/:id/comments", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const id = req.params.id;
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ ok: false, error: "Comment text required" });
    const comment = {
      id: `rc_${Date.now()}`,
      authorId: actor.userId,
      text,
      time: "Just now",
      likes: 0,
    };
    let updated: any = null;
    await updateCollection("reels", (reels) =>
      reels.map((r: any) => {
        if (r.id !== id) return r;
        updated = { ...r, comments: [...(r.comments || []), comment] };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Reel not found" });
    broadcast("reel:updated", updated);
    res.status(201).json({ ok: true, reel: updated, comment });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== CIRCLES & GATHERINGS ====================
app.post("/api/circles", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const body = req.body || {};
    const circle = {
      id: body.id || `circle_${Date.now()}`,
      name: String(body.name || "Untitled Circle"),
      tagline: String(body.tagline || ""),
      description: String(body.description || ""),
      category: body.category || "Craft",
      image: body.image,
      members: 1,
      posts: 0,
      joinedBy: [actor.userId],
      joined: true,
      moderatorIds: [actor.userId],
      activity: "Created just now",
    };
    await updateCollection("circles", (items) => [circle, ...items]);
    broadcast("circle:created", circle);
    res.status(201).json({ ok: true, circle: projectCircleForUser(circle, actor.userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post(["/api/circles/:id/toggle", "/api/circles/:id/join"], async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const id = req.params.id;
    let updated: any = null;
    await updateCollection("circles", (items) =>
      items.map((c: any) => {
        if (c.id !== id) return c;
        const joinedBy: string[] = Array.isArray(c.joinedBy)
          ? [...c.joinedBy]
          : c.joined
            ? ["me"]
            : [];
        const has = joinedBy.includes(userId);
        const nextJoinedBy = has ? joinedBy.filter((x) => x !== userId) : [...joinedBy, userId];
        updated = {
          ...c,
          joinedBy: nextJoinedBy,
          members: Math.max(0, (c.members || 0) + (has ? -1 : 1)),
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Circle not found" });
    broadcast("circle:updated", updated);
    res.json({ ok: true, circle: projectCircleForUser(updated, userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const body = req.body || {};
    const ev = {
      id: body.id || `event_${Date.now()}`,
      title: String(body.title || "Gathering"),
      hostId: actor.userId,
      circleId: body.circleId,
      date: body.date || "Soon",
      day: body.day || "28",
      month: body.month || "NOV",
      weekday: body.weekday || "THU",
      time: body.time || "6:30 PM",
      location: body.location || "TBD",
      mode: body.mode || "In person",
      image: body.image,
      attendees: 1,
      spots: Number(body.spots || 16),
      rsvped: true,
      attendeeIds: [actor.userId],
      description: String(body.description || ""),
    };
    await updateCollection("events", (items) => [ev, ...items]);
    broadcast("event:created", ev);
    res.status(201).json({ ok: true, event: projectEventForUser(ev, actor.userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/events/:id/rsvp", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const id = req.params.id;
    let updated: any = null;
    await updateCollection("events", (items) =>
      items.map((ev: any) => {
        if (ev.id !== id) return ev;
        const currentIds: string[] = Array.isArray(ev.attendeeIds) ? [...ev.attendeeIds] : [];
        const has = currentIds.includes(userId);
        const attendeeIds = has
          ? currentIds.filter((x) => x !== userId)
          : [...currentIds, userId];
        updated = {
          ...ev,
          attendees: Math.max(0, (ev.attendees || 0) + (has ? -1 : 1)),
          attendeeIds,
        };
        return updated;
      }),
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Event not found" });
    broadcast("event:updated", updated);
    res.json({ ok: true, event: projectEventForUser(updated, userId) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== REAL-TIME MULTI-USER DIRECT MESSAGES & CALL SIGNALING ====================
const AUTO_REPLIES: Record<string, string[]> = {
  maya: [
    "Just pulled the last tray from the kiln — saving a warm mug for you on Thursday.",
    "Love that. Let's bring the sketches to studio hour this week.",
  ],
  priya: [
    "Simmering tamarind broth right now — bring bread if you swing by!",
    "Adding this to the Sunday supper menu notes.",
  ],
  jonah: [
    "Morning light on the trail was unreal today. Let's walk the ridge Saturday.",
    "Count me in — bringing thermos coffee.",
  ],
  default: [
    "That sounds wonderful — let's catch up properly soon.",
    "Noted! Looking forward to seeing how it turns out.",
  ],
};

app.post("/api/conversations", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const personId = String(req.body?.personId || "");
    if (!personId) return res.status(400).json({ ok: false, error: "personId required" });

    const thread = await findOrCreateThread(actor.userId, personId);
    const onlineSet = new Set(getOnlineUserIds());
    res.json({
      ok: true,
      conversation: formatThreadForUser(thread, actor.userId, onlineSet),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/conversations/:id/typing", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const convId = req.params.id;
    const isTyping = Boolean(req.body?.typing ?? true);
    const thread = await getThreadById(convId);
    if (thread) {
      const recipients = thread.participantIds.filter((id) => id !== actor.userId);
      broadcast(
        "dm:typing",
        { conversationId: convId, userId: actor.userId, typing: isTyping },
        { targetUserIds: recipients },
      );
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/conversations/:id/read", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const convId = req.params.id;
    const thread = await getThreadById(convId);
    if (thread) {
      thread.meta[actor.userId] = {
        ...(thread.meta[actor.userId] || {}),
        unread: 0,
        lastReadAt: new Date().toISOString(),
      };
      thread.messages = (thread.messages || []).map((m: any) =>
        m.senderId && m.senderId !== actor.userId ? { ...m, seen: true } : m,
      );
      await saveThread(thread);
      const recipients = thread.participantIds.filter((id) => id !== actor.userId);
      broadcast(
        "dm:read",
        { conversationId: convId, readerId: actor.userId, at: new Date().toISOString() },
        { targetUserIds: recipients },
      );
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/conversations/:id/messages", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const convId = req.params.id;
    const body = req.body || {};

    let thread = await getThreadById(convId);
    if (!thread && body.personId) {
      thread = await findOrCreateThread(userId, String(body.personId), convId);
    }
    if (!thread) {
      return res.status(404).json({ ok: false, error: "Conversation not found" });
    }

    // The composer sends rich media as `attachment` (voice notes, photos,
    // location…). It has to be persisted verbatim and echoed to the recipient,
    // otherwise a voice note arrives as an empty bubble that cannot be played.
    const attachment = body.attachment || (body.voice ? { type: "voice", ...body.voice } : undefined);

    const msg = {
      id: body.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: userId,
      from: "me" as const,
      text: String(body.text || ""),
      time: nowClockLabel(),
      createdAt: new Date().toISOString(),
      seen: false,
      image: body.image,
      voice: body.voice,
      attachment,
      replyTo: body.replyTo,
    };

    const otherId = thread.participantIds.find((id) => id !== userId) || body.personId;
    thread.messages = [...(thread.messages || []), msg];
    thread.meta[userId] = { ...(thread.meta[userId] || {}), unread: 0, archived: false };
    if (otherId) {
      const prevUnread = Number(thread.meta[otherId]?.unread || 0);
      thread.meta[otherId] = {
        ...(thread.meta[otherId] || {}),
        unread: prevUnread + 1,
        archived: false,
      };
    }
    await saveThread(thread);

    const onlineSet = new Set(getOnlineUserIds());
    // Push real-time message directly to both sender (multi-tab) & recipient!
    for (const pid of thread.participantIds) {
      broadcast(
        "dm:message",
        {
          conversationId: thread.id,
          senderId: userId,
          conversation: formatThreadForUser(thread, pid, onlineSet),
          message: {
            ...msg,
            from: pid === userId ? "me" : "them",
          },
        },
        { targetUserIds: [pid] },
      );
    }

    // Check if otherId has a live human SSE connection right now; if not and it's a seeded companion, send contextual reply
    const hasHumanRecipientConnected = Array.from(sseClients.values()).some(
      (c) => c.userId === otherId,
    );
    const isSeededCompanion = ["maya", "priya", "jonah", "theo", "lin", "sara", "devon", "elena"].includes(
      String(otherId || ""),
    );

    if (otherId && !hasHumanRecipientConnected && isSeededCompanion && body.autoReply !== false) {
      // Emit brief typing indicator then deliver reply
      setTimeout(() => {
        broadcast(
          "dm:typing",
          { conversationId: thread!.id, userId: otherId, typing: true },
          { targetUserIds: [userId] },
        );
      }, 450);

      setTimeout(async () => {
        try {
          const fresh = await getThreadById(thread!.id);
          if (!fresh) return;
          const poolReplies = AUTO_REPLIES[otherId] || AUTO_REPLIES.default;
          const replyText = poolReplies[Math.floor(Math.random() * poolReplies.length)];
          const replyMsg = {
            id: `msg_reply_${Date.now()}`,
            senderId: otherId,
            from: "them" as const,
            text: replyText,
            time: nowClockLabel(),
          };
          fresh.messages = [
            ...(fresh.messages || []).map((m: any) =>
              m.id === msg.id ? { ...m, seen: true } : m,
            ),
            replyMsg,
          ];
          fresh.meta[userId] = {
            ...(fresh.meta[userId] || {}),
            unread: Number(fresh.meta[userId]?.unread || 0) + 1,
          };
          await saveThread(fresh);

          broadcast(
            "dm:typing",
            { conversationId: fresh.id, userId: otherId, typing: false },
            { targetUserIds: [userId] },
          );
          const nowOnline = new Set(getOnlineUserIds());
          broadcast(
            "dm:message",
            {
              conversationId: fresh.id,
              senderId: otherId,
              conversation: formatThreadForUser(fresh, userId, nowOnline),
              message: { ...replyMsg, from: "them" },
            },
            { targetUserIds: [userId] },
          );
        } catch {}
      }, 1700);
    }

    res.status(201).json({
      ok: true,
      message: msg,
      conversation: formatThreadForUser(thread, userId, onlineSet),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post(
  ["/api/conversations/:id/messages/:messageId/react", "/api/conversations/:id/react"],
  async (req, res) => {
    try {
      const actor = await resolveRequestActor(req);
      const convId = req.params.id;
      const messageId = req.params.messageId || String(req.body?.messageId || "");
      const emoji = req.body?.emoji;
    const thread = await getThreadById(convId);
    if (!thread) return res.status(404).json({ ok: false, error: "Thread not found" });

    thread.messages = (thread.messages || []).map((m: any) =>
      m.id === messageId
        ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
        : m,
    );
    await saveThread(thread);

    const onlineSet = new Set(getOnlineUserIds());
    for (const pid of thread.participantIds) {
      broadcast(
        "dm:reaction",
        {
          conversationId: thread.id,
          messageId,
          emoji,
          conversation: formatThreadForUser(thread, pid, onlineSet),
        },
        { targetUserIds: [pid] },
      );
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.patch("/api/conversations/:id", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const userId = actor.userId;
    const convId = req.params.id;
    const patch = req.body || {};

    if (patch.deleted) {
      await deleteThreadForUser(convId, userId);
      const remaining = await getThreadsForUser(userId);
      const onlineSet = new Set(getOnlineUserIds());
      return res.json({
        ok: true,
        conversations: remaining.map((t) => formatThreadForUser(t, userId, onlineSet)),
      });
    }

    const thread = await getThreadById(convId);
    if (thread) {
      const currMeta = thread.meta[userId] || {};
      thread.meta[userId] = {
        ...currMeta,
        ...(typeof patch.unread === "number" ? { unread: patch.unread } : {}),
        ...(typeof patch.pinned === "boolean" ? { pinned: patch.pinned } : {}),
        ...(typeof patch.muted === "boolean" ? { muted: patch.muted } : {}),
        ...(typeof patch.archived === "boolean" ? { archived: patch.archived } : {}),
        ...(typeof patch.request === "boolean" ? { request: patch.request } : {}),
      };
      await saveThread(thread);
    }

    const allThreads = await getThreadsForUser(userId);
    const onlineSet = new Set(getOnlineUserIds());
    res.json({
      ok: true,
      conversations: allThreads.map((t) => formatThreadForUser(t, userId, onlineSet)),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// Real-time Voice/Video Call Signaling Relay
app.post("/api/calls/signal", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const targetUserId = String(req.body?.targetUserId || "");
    const type = String(req.body?.type || "ring"); // ring | accept | decline | end | offer | answer | ice
    const callKind = String(req.body?.kind || "audio");
    const callId = String(req.body?.callId || `call_${Date.now()}`);

    if (!targetUserId) {
      return res.status(400).json({ ok: false, error: "targetUserId required" });
    }

    const targetOnline = Array.from(sseClients.values()).some(
      (c) => c.userId === targetUserId,
    );

    broadcast(
      "call:signal",
      {
        callId,
        type,
        kind: callKind,
        fromUserId: actor.userId,
        targetUserId,
        sdp: req.body?.sdp,
        candidate: req.body?.candidate,
        at: new Date().toISOString(),
      },
      { targetUserIds: [targetUserId] },
    );

    res.json({ ok: true, callId, targetOnline });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== THURSDAY AI (OPENROUTER · ROTATING KEYS + MODELS) ====================
const AI_TASKS = new Set<AiTask>([
  "chat",
  "captions",
  "summarize",
  "rewrite",
  "titles",
  "thread",
  "bio",
  "reply",
  "alt",
]);

app.get("/api/ai/status", (_req, res) => {
  const status = aiStatus();
  res.json({
    ...status,
    // Never expose the raw credentials — labels only.
    keys: status.keys.map((k: any) => ({ ...k })),
  });
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const body = req.body || {};
    const task = String(body.task || "chat") as AiTask;
    if (!AI_TASKS.has(task)) {
      return res.status(400).json({ ok: false, error: "Unknown AI task." });
    }
    const messages = Array.isArray(body.messages)
      ? body.messages
      : typeof body.prompt === "string"
        ? [{ role: "user", content: body.prompt }]
        : [];
    if (!messages.length) {
      return res.status(400).json({ ok: false, error: "Nothing to send to the AI." });
    }

    const result = await aiGenerate({
      task,
      messages,
      maxTokens: Number.isFinite(body.maxTokens) ? Number(body.maxTokens) : undefined,
      temperature: Number.isFinite(body.temperature)
        ? Number(body.temperature)
        : undefined,
    });

    // Keep a lightweight, per-account AI history so threads survive reloads.
    if (result.ok && actor.userId) {
      try {
        const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
        await updateUserState(actor.userId, (curr) => ({
          ...curr,
          aiHistory: [
            { role: "user", text: String(lastUser?.content ?? "").slice(0, 4000), at: new Date().toISOString() },
            { role: "assistant", text: String(result.text ?? "").slice(0, 4000), at: new Date().toISOString() },
            ...(curr as any).aiHistory ?? [],
          ].slice(0, 40),
        } as any));
      } catch {}
    }

    if (!result.ok) {
      return res.status(503).json({
        ok: false,
        error: result.error || "The AI is resting. Try again shortly.",
        attempts: result.attempts,
      });
    }
    res.json({
      ok: true,
      text: result.text,
      model: result.model,
      modelLabel: result.modelLabel,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "AI request failed" });
  }
});

// ==================== NOTIFICATIONS, DRAFTS, GUIDES, PROMPTS, PREFERENCES ====================
app.post("/api/notifications/read-all", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      notifications: (curr.notifications || []).map((n: any) => ({ ...n, unread: false })),
    }));
    res.json({ ok: true, notifications: nextState.notifications });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/notifications/:id/read", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const id = req.params.id;
    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      notifications: (curr.notifications || []).map((n: any) =>
        n.id === id ? { ...n, unread: false } : n,
      ),
    }));
    res.json({ ok: true, notifications: nextState.notifications });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.put("/api/drafts", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const drafts = Array.isArray(req.body?.drafts) ? req.body.drafts : [];
    const nextState = await updateUserState(actor.userId, (curr) => ({ ...curr, drafts }));
    res.json({ ok: true, drafts: nextState.drafts });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/guides/:id/save", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const guideId = req.params.id;
    const nextState = await updateUserState(actor.userId, (curr) => {
      const exists = curr.savedGuideIds.includes(guideId);
      return {
        ...curr,
        savedGuideIds: exists
          ? curr.savedGuideIds.filter((x) => x !== guideId)
          : [...curr.savedGuideIds, guideId],
      };
    });
    res.json({ ok: true, savedGuideIds: nextState.savedGuideIds });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/guides/:id/steps/:stepIdx", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const guideId = req.params.id;
    const stepIdx = Number(req.params.stepIdx);
    const nextState = await updateUserState(actor.userId, (curr) => {
      const existing = curr.guideSteps[guideId] || [];
      const next = existing.includes(stepIdx)
        ? existing.filter((x) => x !== stepIdx)
        : [...existing, stepIdx];
      return {
        ...curr,
        guideSteps: { ...curr.guideSteps, [guideId]: next },
      };
    });
    res.json({ ok: true, guideSteps: nextState.guideSteps });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/prompts/:id/vote", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const promptId = req.params.id;
    const optionId = String(req.body?.optionId || "");
    const stateBefore = await getUserState(actor.userId);
    const prevVote = stateBefore.promptVotes[promptId];

    let updatedPrompt: any = null;
    await updateCollection("prompts", (prompts) =>
      prompts.map((pr: any) => {
        if (pr.id !== promptId) return pr;
        updatedPrompt = {
          ...pr,
          options: (pr.options || []).map((opt: any) => {
            if (opt.id === optionId && prevVote !== optionId) {
              return { ...opt, votes: (opt.votes || 0) + 1 };
            }
            if (opt.id === prevVote && prevVote !== optionId) {
              return { ...opt, votes: Math.max(0, (opt.votes || 0) - 1) };
            }
            return opt;
          }),
        };
        return updatedPrompt;
      }),
    );

    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      promptVotes: { ...curr.promptVotes, [promptId]: optionId },
    }));

    if (updatedPrompt) broadcast("prompt:updated", updatedPrompt);
    res.json({ ok: true, prompt: updatedPrompt, promptVotes: nextState.promptVotes });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.put("/api/preferences", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const prefs = req.body || {};
    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      preferences: { ...curr.preferences, ...prefs },
    }));
    res.json({ ok: true, preferences: nextState.preferences });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// ==================== CLOUD WORKSPACE SYNC ====================
app.get(["/api/workspaces/:syncKey", "/api/workspace/:syncKey"], async (req, res) => {
  try {
    const data = await getWorkspaceSnapshot(req.params.syncKey);
    if (!data) return res.status(404).json({ ok: false, error: "Sync key not found" });
    res.json({ ok: true, ...data });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.put(["/api/workspaces/:syncKey", "/api/workspace/:syncKey"], async (req, res) => {
  try {
    const { handle = "member", displayName = "Thursday Member", snapshot = {} } = req.body || {};
    const saved = await saveWorkspaceSnapshot(req.params.syncKey, handle, displayName, snapshot);
    res.json({ ok: true, ...saved });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.delete("/api/conversations/:id", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    await deleteThreadForUser(req.params.id, actor.userId);
    const remaining = await getThreadsForUser(actor.userId);
    const onlineSet = new Set(getOnlineUserIds());
    res.json({
      ok: true,
      conversations: remaining.map((t) => formatThreadForUser(t, actor.userId, onlineSet)),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/notifications/read", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const id = req.body?.id;
    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      notifications: (curr.notifications || []).map((n: any) =>
        !id || n.id === id ? { ...n, unread: false } : n,
      ),
    }));
    res.json({ ok: true, notifications: nextState.notifications });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/drafts", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const draft = req.body || {};
    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      drafts: [draft, ...(curr.drafts || []).filter((d: any) => d.id !== draft.id)],
    }));
    res.json({ ok: true, drafts: nextState.drafts });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.delete("/api/drafts/:id", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const id = req.params.id;
    const nextState = await updateUserState(actor.userId, (curr) => ({
      ...curr,
      drafts: (curr.drafts || []).filter((d: any) => d.id !== id),
    }));
    res.json({ ok: true, drafts: nextState.drafts });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post("/api/guides/:id/progress", async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    const guideId = req.params.id;
    const { saved, completedSteps } = req.body || {};
    const nextState = await updateUserState(actor.userId, (curr) => {
      let savedGuideIds = curr.savedGuideIds || [];
      if (typeof saved === "boolean") {
        savedGuideIds = saved
          ? Array.from(new Set([...savedGuideIds, guideId]))
          : savedGuideIds.filter((x) => x !== guideId);
      }
      const guideSteps = Array.isArray(completedSteps)
        ? { ...curr.guideSteps, [guideId]: completedSteps }
        : curr.guideSteps;
      return { ...curr, savedGuideIds, guideSteps };
    });
    res.json({
      ok: true,
      savedGuideIds: nextState.savedGuideIds,
      guideSteps: nextState.guideSteps,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

app.post(["/api/admin/reset", "/api/reset"], async (req, res) => {
  try {
    const actor = await resolveRequestActor(req);
    await updateUserState(actor.userId, () => ({
      me: structuredClone(actor.account?.profile || INITIAL_SEED.me),
      followingIds: Array.isArray(INITIAL_SEED.followingIds)
        ? [...INITIAL_SEED.followingIds]
        : ["maya", "priya", "jonah"],
      // Resetting clears the inbox rather than restoring demo chats.
      conversations: [],
      notifications: structuredClone(INITIAL_SEED.notifications) as any[],
      drafts: structuredClone(INITIAL_SEED.drafts) as any[],
      savedGuideIds: INITIAL_SEED.guides.map((g: any) => g.id),
      guideSteps: {},
      promptVotes: {},
      preferences: structuredClone(INITIAL_SEED.preferences),
      visitors: [],
    }));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

initDatabase()
  .then(({ mode }) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Thursday API listening on 0.0.0.0:${PORT} (storage: ${mode})`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
