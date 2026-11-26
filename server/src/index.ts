import http, { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  createDefaultUserState,
  getAllCollections,
  getCollection,
  getDbMode,
  getUserState,
  getWorkspaceSnapshot,
  initDatabase,
  saveWorkspaceSnapshot,
  updateCollection,
  updateUserState,
} from "./db.js";
import { INITIAL_SEED } from "./seed.js";

const PORT = Number(process.env.PORT || 8080);

interface SseClient {
  id: string;
  clientId: string;
  res: ServerResponse;
}

const sseClients = new Set<SseClient>();

function broadcast(event: string, payload: unknown, targetClientId?: string) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    if (targetClientId && client.clientId !== targetClientId) continue;
    try {
      client.res.write(frame);
    } catch {
      sseClients.delete(client);
    }
  }
}

function setCors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Thursday-Client-Id",
  );
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const maxBytes = 12 * 1024 * 1024;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function getClientId(req: IncomingMessage, url: URL): string {
  const header = req.headers["x-thursday-client-id"];
  const raw =
    (Array.isArray(header) ? header[0] : header) ||
    url.searchParams.get("clientId") ||
    "default";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "default";
}

function nowTimeString(): string {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

const CIRCLE_AUTO_REPLIES: Record<string, string[]> = {
  maya: [
    "Love that — save me a seat by the window if you get there first.",
    "Bringing fresh sourdough and olive oil for the table on Saturday.",
    "Honestly that sounds like the exact pace this week needed.",
  ],
  priya: [
    "The kiln opens at ten tomorrow morning — come by whenever you're awake.",
    "That glaze turned out warmer than we expected! Will send a photo soon.",
    "Kettle's on in the studio all afternoon if you want a quiet hour.",
  ],
  theo: [
    "Just developed the roll from Dolores — light came out really gentle.",
    "Count me in. Bringing the 35mm and no rush at all.",
    "Meet you at the corner café fifteen minutes before golden hour?",
  ],
  soren: [
    "Queued that record up for side B — fits the evening perfectly.",
    "Good catch. Quiet mornings always bring the best notes.",
    "Let's spin it properly at the next listening night.",
  ],
  elena: [
    "Marked the page with a cedar leaf — passing you the copy next week.",
    "Reading that chapter on the tram right now, so good.",
  ],
};

function pickContextualReply(
  personId: string,
  incomingText?: string,
  attachmentType?: string,
): string {
  if (attachmentType === "voice") {
    return "Just listened to your voice note — completely with you on that.";
  }
  if (attachmentType === "image") {
    return "Look at the light in that frame. Keeping this one.";
  }
  const text = (incomingText || "").toLowerCase();
  if (text.includes("coffee") || text.includes("tea") || text.includes("kettle")) {
    return "Kettle is practically already on — say when and I'll pour two.";
  }
  if (text.includes("saturday") || text.includes("sunday") || text.includes("weekend")) {
    return "This weekend works beautifully. Let's keep the afternoon unhurried.";
  }
  const pool = CIRCLE_AUTO_REPLIES[personId] || [
    "Got your note — really glad you shared this.",
    "Sounds lovely. Let's catch up properly soon.",
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildIcsString(event: any): string {
  const rawDate = String(event.date || "2026-11-28").replace(/-/g, "");
  const timeMatch = String(event.time || "10:00 – 12:00").match(/(\d{1,2}):(\d{2})/g) || [
    "10:00",
    "12:00",
  ];
  const fmt = (hm: string) => {
    const [h = "10", m = "00"] = hm.split(":");
    return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  };
  const esc = (s: string) =>
    String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thursday//Gatherings//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@thursday.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${rawDate}T${fmt(timeMatch[0] || "10:00")}`,
    `DTEND:${rawDate}T${fmt(timeMatch[1] || "12:00")}`,
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc(event.description)}`,
    `LOCATION:${esc(event.place)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method || "GET";
  const clientId = getClientId(req, url);

  // Root & Health
  if ((pathname === "/" || pathname === "/api/health") && method === "GET") {
    const collections = await getAllCollections();
    sendJson(res, 200, {
      ok: true,
      service: "thursday-railway-api",
      database: getDbMode(),
      timestamp: new Date().toISOString(),
      counts: {
        people: collections.people.length,
        posts: collections.posts.length,
        stories: collections.stories.length,
        highlights: collections.highlights.length,
        reels: collections.reels.length,
        circles: collections.circles.length,
        events: collections.events.length,
      },
    });
    return;
  }

  // Real-time Server-Sent Events stream
  if (pathname === "/api/stream" && method === "GET") {
    setCors(res);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, ts: Date.now() })}\n\n`);
    const client: SseClient = {
      id: `sse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientId,
      res,
    };
    sseClients.add(client);
    const keepAlive = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(client);
      }
    }, 20_000);
    req.on("close", () => {
      clearInterval(keepAlive);
      sseClients.delete(client);
    });
    return;
  }

  // Full bootstrap state
  if (pathname === "/api/bootstrap" && method === "GET") {
    const [collections, userState] = await Promise.all([
      getAllCollections(),
      getUserState(clientId),
    ]);
    const people = collections.people.some((p: any) => p.id === userState.me.id)
      ? collections.people.map((p: any) => (p.id === userState.me.id ? userState.me : p))
      : [userState.me, ...collections.people];

    sendJson(res, 200, {
      ok: true,
      me: userState.me,
      people,
      followingIds: userState.followingIds,
      posts: collections.posts,
      stories: collections.stories,
      highlights: collections.highlights,
      reels: collections.reels,
      circles: collections.circles,
      events: collections.events,
      prompts: collections.prompts,
      guides: collections.guides,
      audioTracks: INITIAL_SEED.audioTracks,
      conversations: userState.conversations,
      notifications: userState.notifications,
      drafts: userState.drafts,
      savedGuideIds: userState.savedGuideIds,
      guideSteps: userState.guideSteps,
      promptVotes: userState.promptVotes,
      preferences: userState.preferences,
    });
    return;
  }

  if (pathname === "/api/reset" && method === "POST") {
    const fresh = createDefaultUserState();
    await updateUserState(clientId, () => fresh);
    sendJson(res, 200, { ok: true, state: fresh });
    return;
  }

  // ==================== POSTS ====================
  if (pathname === "/api/posts" && method === "GET") {
    const posts = await getCollection("posts");
    sendJson(res, 200, { ok: true, posts });
    return;
  }

  if (pathname === "/api/posts" && method === "POST") {
    const body = await readBody(req);
    const userState = await getUserState(clientId);
    const author = body.author || userState.me;
    if (author?.id) {
      await updateCollection("people", (people) =>
        people.some((p: any) => p.id === author.id)
          ? people.map((p: any) => (p.id === author.id ? { ...p, ...author } : p))
          : [author, ...people],
      );
    }
    const images = Array.isArray(body.images)
      ? body.images
      : body.image
        ? [body.image]
        : [];
    const newPost = {
      id: body.id || `post_${Date.now()}`,
      authorId: author?.id || "me",
      time: body.time || "now",
      text: String(body.text || "").trim(),
      images,
      imageAlt: images.length ? "A moment shared with the Thursday circle" : undefined,
      place: body.place || undefined,
      topic: body.topic || "Circle",
      circleId: body.circleId || undefined,
      taggedIds: Array.isArray(body.taggedIds) && body.taggedIds.length ? body.taggedIds : undefined,
      poll: body.poll || undefined,
      music: body.music || undefined,
      pinned: Boolean(body.pinned ?? false),
      likes: Number(body.likes ?? 0),
      liked: Boolean(body.liked ?? false),
      saved: Boolean(body.saved ?? false),
      reposts: Number(body.reposts ?? 0),
      comments: Array.isArray(body.comments) ? body.comments : [],
    };
    await updateCollection("posts", (posts) => [
      newPost,
      ...posts.filter((p: any) => p.id !== newPost.id),
    ]);
    if (newPost.circleId) {
      await updateCollection("circles", (circles) =>
        circles.map((c: any) =>
          c.id === newPost.circleId
            ? {
                ...c,
                posts: Number(c.posts || 0) + 1,
                activity: `${author?.name?.split(" ")[0] || "Someone"} shared a new note`,
              }
            : c,
        ),
      );
    }
    broadcast("post:created", { post: newPost, author });
    sendJson(res, 201, { ok: true, post: newPost });
    return;
  }

  const postActionMatch = pathname.match(
    /^\/api\/posts\/([^/]+)(?:\/(like|save|repost|pin|vote|comments))?$/,
  );
  if (postActionMatch) {
    const postId = decodeURIComponent(postActionMatch[1]);
    const action = postActionMatch[2];

    if (!action && method === "DELETE") {
      await updateCollection("posts", (posts) => posts.filter((p: any) => p.id !== postId));
      broadcast("post:deleted", { postId });
      sendJson(res, 200, { ok: true, postId });
      return;
    }

    if (action === "like" && method === "POST") {
      let updated: any = null;
      await updateCollection("posts", (posts) =>
        posts.map((p: any) => {
          if (p.id !== postId) return p;
          const liked = !p.liked;
          updated = { ...p, liked, likes: Math.max(0, Number(p.likes || 0) + (liked ? 1 : -1)) };
          return updated;
        }),
      );
      if (updated) broadcast("post:updated", { post: updated });
      sendJson(res, 200, { ok: true, post: updated });
      return;
    }

    if (action === "save" && method === "POST") {
      let updated: any = null;
      await updateCollection("posts", (posts) =>
        posts.map((p: any) => {
          if (p.id !== postId) return p;
          updated = { ...p, saved: !p.saved };
          return updated;
        }),
      );
      sendJson(res, 200, { ok: true, post: updated });
      return;
    }

    if (action === "repost" && method === "POST") {
      let updated: any = null;
      await updateCollection("posts", (posts) =>
        posts.map((p: any) => {
          if (p.id !== postId) return p;
          updated = { ...p, reposts: Number(p.reposts || 0) + 1 };
          return updated;
        }),
      );
      if (updated) broadcast("post:updated", { post: updated });
      sendJson(res, 200, { ok: true, post: updated });
      return;
    }

    if (action === "pin" && method === "POST") {
      let updated: any = null;
      await updateCollection("posts", (posts) =>
        posts.map((p: any) => {
          if (p.id !== postId) return p;
          updated = { ...p, pinned: !p.pinned };
          return updated;
        }),
      );
      if (updated) broadcast("post:updated", { post: updated });
      sendJson(res, 200, { ok: true, post: updated });
      return;
    }

    if (action === "vote" && method === "POST") {
      const body = await readBody(req);
      const optionId = String(body.optionId || "");
      let updated: any = null;
      await updateCollection("posts", (posts) =>
        posts.map((p: any) => {
          if (p.id !== postId || !p.poll || p.poll.votedOptionId) return p;
          updated = {
            ...p,
            poll: {
              ...p.poll,
              votedOptionId: optionId,
              options: p.poll.options.map((opt: any) =>
                opt.id === optionId ? { ...opt, votes: Number(opt.votes || 0) + 1 } : opt,
              ),
            },
          };
          return updated;
        }),
      );
      if (updated) broadcast("post:updated", { post: updated });
      sendJson(res, 200, { ok: true, post: updated });
      return;
    }

    if (action === "comments" && method === "POST") {
      const body = await readBody(req);
      const comment = {
        id: body.id || `comment_${Date.now()}`,
        authorId: body.authorId || "me",
        text: String(body.text || "").trim(),
        time: body.time || "now",
        likes: 0,
      };
      let updated: any = null;
      await updateCollection("posts", (posts) =>
        posts.map((p: any) => {
          if (p.id !== postId) return p;
          updated = { ...p, comments: [...(p.comments || []), comment] };
          return updated;
        }),
      );
      if (updated) broadcast("post:updated", { post: updated });
      sendJson(res, 201, { ok: true, post: updated, comment });
      return;
    }
  }

  // ==================== STORIES & HIGHLIGHTS ====================
  if (pathname === "/api/stories" && method === "GET") {
    const stories = await getCollection("stories");
    sendJson(res, 200, { ok: true, stories });
    return;
  }

  if (pathname === "/api/stories" && method === "POST") {
    const body = await readBody(req);
    const story = {
      id: body.id || `story_${Date.now()}`,
      authorId: body.authorId || body.personId || "me",
      image: body.image,
      caption: body.caption || "",
      closeFriends: Boolean(body.closeFriends),
    };
    const stories = await updateCollection("stories", (curr) => [
      story,
      ...curr.filter((s: any) => s.id !== story.id),
    ]);
    broadcast("story:created", { story });
    sendJson(res, 201, { ok: true, story, stories });
    return;
  }

  const storyMatch = pathname.match(/^\/api\/stories\/([^/]+)\/(seen|reply)$/);
  if (storyMatch && method === "POST") {
    const storyId = decodeURIComponent(storyMatch[1]);
    const sub = storyMatch[2];
    if (sub === "seen") {
      sendJson(res, 200, { ok: true, storyId });
      return;
    }
    if (sub === "reply") {
      const body = await readBody(req);
      const stories = await getCollection("stories");
      const target = stories.find((s: any) => s.id === storyId);
      const personId = body.personId || target?.authorId;
      const text = String(body.text || "").trim();
      if (personId && personId !== "me" && text) {
        const msg = {
          id: `msg_${Date.now()}`,
          from: "me",
          text,
          time: nowTimeString(),
        };
        await updateUserState(clientId, (u) => {
          const exists = u.conversations.find((c: any) => c.personId === personId);
          const conversations = exists
            ? u.conversations.map((c: any) =>
                c.personId === personId
                  ? { ...c, request: false, archived: false, messages: [...c.messages, msg] }
                  : c,
              )
            : [
                {
                  id: `conv_${personId}_${Date.now()}`,
                  personId,
                  unread: 0,
                  online: true,
                  lastActive: "Active now",
                  messages: [msg],
                },
                ...u.conversations,
              ];
          return { ...u, conversations };
        });
      }
      sendJson(res, 200, { ok: true });
      return;
    }
  }

  if (pathname === "/api/highlights" && method === "GET") {
    const highlights = await getCollection("highlights");
    sendJson(res, 200, { ok: true, highlights });
    return;
  }

  if (pathname === "/api/highlights" && method === "POST") {
    const body = await readBody(req);
    const highlight = {
      id: body.id || `h_${Date.now()}`,
      title: String(body.title || "Moments").trim(),
      image: body.image || body.cover,
      count: Number(body.count || 1),
      caption: body.caption || String(body.title || "Moments").trim(),
    };
    const highlights = await updateCollection("highlights", (curr) => [
      ...curr.filter((h: any) => h.id !== highlight.id),
      highlight,
    ]);
    broadcast("highlight:created", { highlight });
    sendJson(res, 201, { ok: true, highlight, highlights });
    return;
  }

  // ==================== REELS ====================
  if (pathname === "/api/reels" && method === "GET") {
    const reels = await getCollection("reels");
    sendJson(res, 200, { ok: true, reels });
    return;
  }

  if (pathname === "/api/reels" && method === "POST") {
    const body = await readBody(req);
    const reel = {
      id: body.id || `reel_${Date.now()}`,
      authorId: body.authorId || "me",
      video: body.video || body.videoUrl,
      poster: body.poster,
      caption: String(body.caption || "").trim(),
      music: body.music || body.audio || "Original audio",
      location: body.location || body.place || undefined,
      duration: body.duration || "0:15",
      likes: Number(body.likes ?? 0),
      liked: Boolean(body.liked ?? false),
      saved: Boolean(body.saved ?? false),
      shares: Number(body.shares ?? 0),
      views: Number(body.views ?? 1),
      comments: Array.isArray(body.comments) ? body.comments : [],
    };
    await updateCollection("reels", (curr) => [reel, ...curr.filter((r: any) => r.id !== reel.id)]);
    broadcast("reel:created", { reel });
    sendJson(res, 201, { ok: true, reel });
    return;
  }

  const reelMatch = pathname.match(/^\/api\/reels\/([^/]+)\/(like|save|comments)$/);
  if (reelMatch && method === "POST") {
    const reelId = decodeURIComponent(reelMatch[1]);
    const action = reelMatch[2];
    const body = action === "comments" ? await readBody(req) : {};
    let updated: any = null;

    await updateCollection("reels", (curr) =>
      curr.map((r: any) => {
        if (r.id !== reelId) return r;
        if (action === "like") {
          const liked = !r.liked;
          updated = { ...r, liked, likes: Math.max(0, Number(r.likes || 0) + (liked ? 1 : -1)) };
        } else if (action === "save") {
          updated = { ...r, saved: !r.saved };
        } else if (action === "comments") {
          const comment = {
            id: body.id || `rc_${Date.now()}`,
            authorId: body.authorId || "me",
            text: String(body.text || "").trim(),
            time: "now",
            likes: 0,
          };
          updated = { ...r, comments: [...(r.comments || []), comment] };
        }
        return updated || r;
      }),
    );
    if (updated) broadcast("reel:updated", { reel: updated });
    sendJson(res, 200, { ok: true, reel: updated });
    return;
  }

  // ==================== CIRCLES & GATHERINGS ====================
  if (pathname === "/api/circles" && method === "GET") {
    const circles = await getCollection("circles");
    sendJson(res, 200, { ok: true, circles });
    return;
  }

  if (pathname === "/api/circles" && method === "POST") {
    const body = await readBody(req);
    const circle = {
      id: body.id || `circle_${Date.now()}`,
      name: String(body.name || "New Circle").trim(),
      tagline: String(body.tagline || "Small room, good company").trim(),
      description: String(body.description || "").trim(),
      image: body.image,
      members: Number(body.members ?? 1),
      posts: Number(body.posts ?? 0),
      category: body.category || "Making",
      accent: body.accent || "forest",
      joined: true,
      moderatorIds: Array.isArray(body.moderatorIds) ? body.moderatorIds : ["me"],
      activity: "Started just now",
      spots: body.spots || "Open to everyone",
    };
    await updateCollection("circles", (curr) => [
      circle,
      ...curr.filter((c: any) => c.id !== circle.id),
    ]);
    broadcast("circle:created", { circle });
    sendJson(res, 201, { ok: true, circle });
    return;
  }

  const circleJoinMatch = pathname.match(/^\/api\/circles\/([^/]+)\/join$/);
  if (circleJoinMatch && method === "POST") {
    const circleId = decodeURIComponent(circleJoinMatch[1]);
    let updated: any = null;
    await updateCollection("circles", (curr) =>
      curr.map((c: any) => {
        if (c.id !== circleId) return c;
        const joined = !c.joined;
        updated = {
          ...c,
          joined,
          members: Math.max(0, Number(c.members || 0) + (joined ? 1 : -1)),
        };
        return updated;
      }),
    );
    if (updated) broadcast("circle:updated", { circle: updated });
    sendJson(res, 200, { ok: true, circle: updated });
    return;
  }

  if (pathname === "/api/events" && method === "GET") {
    const events = await getCollection("events");
    sendJson(res, 200, { ok: true, events });
    return;
  }

  if (pathname === "/api/events" && method === "POST") {
    const body = await readBody(req);
    const dateStr = String(body.date || "2026-11-28");
    const parsedDate = new Date(`${dateStr}T12:00:00`);
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const event = {
      id: body.id || `event_${Date.now()}`,
      title: String(body.title || "Circle Gathering").trim(),
      description: String(body.description || "").trim(),
      date: dateStr,
      day: body.day || String(parsedDate.getDate() || 28).padStart(2, "0"),
      weekday: body.weekday || weekdays[parsedDate.getDay() || 6],
      time: String(body.time || "17:00 – 19:30").trim(),
      place: String(body.place || "Local studio").trim(),
      hostId: body.hostId || "me",
      circleId: body.circleId || "circle_making",
      attendees: Number(body.attendees ?? 1),
      image: body.image,
      cost: String(body.cost || "Free").trim(),
      spotsLeft: Number(body.spotsLeft ?? 12),
      joined: Boolean(body.joined ?? true),
    };
    await updateCollection("events", (curr) => [
      event,
      ...curr.filter((e: any) => e.id !== event.id),
    ]);
    broadcast("event:created", { event });
    sendJson(res, 201, { ok: true, event });
    return;
  }

  const eventMatch = pathname.match(/^\/api\/events\/([^/]+)\/(rsvp|ics)$/);
  if (eventMatch) {
    const eventId = decodeURIComponent(eventMatch[1]);
    const sub = eventMatch[2];
    if (sub === "ics" && method === "GET") {
      const events = await getCollection("events");
      const ev = events.find((e: any) => e.id === eventId);
      if (!ev) {
        sendJson(res, 404, { ok: false, error: "Event not found" });
        return;
      }
      setCors(res);
      res.writeHead(200, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${eventId}.ics"`,
      });
      res.end(buildIcsString(ev));
      return;
    }
    if (sub === "rsvp" && method === "POST") {
      let updated: any = null;
      await updateCollection("events", (curr) =>
        curr.map((e: any) => {
          if (e.id !== eventId) return e;
          const joined = !e.joined;
          updated = {
            ...e,
            joined,
            attendees: Math.max(0, Number(e.attendees || 0) + (joined ? 1 : -1)),
            spotsLeft: Math.max(0, Number(e.spotsLeft || 0) + (joined ? -1 : 1)),
          };
          return updated;
        }),
      );
      if (updated) broadcast("event:updated", { event: updated });
      sendJson(res, 200, { ok: true, event: updated });
      return;
    }
  }

  // ==================== CONVERSATIONS & VOICE NOTES ====================
  if (pathname === "/api/conversations" && method === "GET") {
    const u = await getUserState(clientId);
    sendJson(res, 200, { ok: true, conversations: u.conversations });
    return;
  }

  if (pathname === "/api/conversations" && method === "POST") {
    const body = await readBody(req);
    const personId = String(body.personId || "");
    let targetConv: any = null;
    await updateUserState(clientId, (u) => {
      const existing = u.conversations.find((c: any) => c.personId === personId);
      if (existing) {
        targetConv = { ...existing, archived: false, request: false };
        return {
          ...u,
          conversations: u.conversations.map((c: any) =>
            c.id === existing.id ? targetConv : c,
          ),
        };
      }
      targetConv = {
        id: body.id || `conv_${personId}_${Date.now()}`,
        personId,
        unread: 0,
        online: true,
        lastActive: "Active now",
        messages: [],
      };
      return { ...u, conversations: [targetConv, ...u.conversations] };
    });
    sendJson(res, 201, { ok: true, conversation: targetConv });
    return;
  }

  const convMatch = pathname.match(/^\/api\/conversations\/([^/]+)(?:\/(messages|react))?$/);
  if (convMatch) {
    const convId = decodeURIComponent(convMatch[1]);
    const sub = convMatch[2];

    if (!sub && method === "PATCH") {
      const body = await readBody(req);
      let updated: any = null;
      await updateUserState(clientId, (u) => ({
        ...u,
        conversations: u.conversations.map((c: any) => {
          if (c.id !== convId) return c;
          updated = { ...c, ...body };
          return updated;
        }),
      }));
      sendJson(res, 200, { ok: true, conversation: updated });
      return;
    }

    if (!sub && method === "DELETE") {
      await updateUserState(clientId, (u) => ({
        ...u,
        conversations: u.conversations.filter((c: any) => c.id !== convId),
      }));
      sendJson(res, 200, { ok: true });
      return;
    }

    if (sub === "messages" && method === "POST") {
      const body = await readBody(req);
      const message = {
        id: body.id || `msg_${Date.now()}`,
        from: body.from || "me",
        text: body.text ?? "",
        time: body.time || nowTimeString(),
        attachment: body.attachment || undefined,
        replyTo: body.replyTo || undefined,
        reactions: Array.isArray(body.reactions) ? body.reactions : undefined,
      };

      let personId = body.personId || "";
      let muted = false;
      await updateUserState(clientId, (u) => {
        const exists = u.conversations.some((c: any) => c.id === convId);
        const conversations = exists
          ? u.conversations.map((c: any) => {
              if (c.id !== convId) return c;
              personId = c.personId;
              muted = Boolean(c.muted);
              return {
                ...c,
                request: false,
                archived: false,
                unread: 0,
                messages: [...(c.messages || []), message],
              };
            })
          : personId
            ? [
                {
                  id: convId,
                  personId,
                  unread: 0,
                  online: true,
                  lastActive: "Active now",
                  messages: [message],
                },
                ...u.conversations,
              ]
            : u.conversations;
        return { ...u, conversations };
      });

      if (message.from === "me" && personId && body.autoReply !== false && !muted) {
        setTimeout(() => {
          broadcast("dm:typing", { conversationId: convId, personId, typing: true }, clientId);
        }, 900);

        setTimeout(async () => {
          const replyMsg = {
            id: `msg_reply_${Date.now()}`,
            from: "them",
            text: pickContextualReply(personId, message.text, message.attachment?.type),
            time: nowTimeString(),
          };
          await updateUserState(clientId, (u) => ({
            ...u,
            conversations: u.conversations.map((c: any) =>
              c.id === convId
                ? {
                    ...c,
                    typing: false,
                    messages: [...(c.messages || []), replyMsg],
                  }
                : c,
            ),
          }));
          broadcast(
            "dm:message",
            { conversationId: convId, personId, message: replyMsg },
            clientId,
          );
        }, 2500);
      }

      sendJson(res, 201, { ok: true, message });
      return;
    }

    if (sub === "react" && method === "POST") {
      const body = await readBody(req);
      const { messageId, emoji } = body;
      await updateUserState(clientId, (u) => ({
        ...u,
        conversations: u.conversations.map((c: any) =>
          c.id !== convId
            ? c
            : {
                ...c,
                messages: (c.messages || []).map((m: any) => {
                  if (m.id !== messageId) return m;
                  const prev: string[] = m.reactions ?? [];
                  return {
                    ...m,
                    reactions: prev.includes(emoji)
                      ? prev.filter((x) => x !== emoji)
                      : [...prev, emoji],
                  };
                }),
              },
        ),
      }));
      sendJson(res, 200, { ok: true });
      return;
    }
  }

  // ==================== PROFILE & PEOPLE ====================
  if (pathname === "/api/me" && method === "PUT") {
    const body = await readBody(req);
    let nextMe: any = null;
    await updateUserState(clientId, (u) => {
      nextMe = { ...u.me, ...body };
      return { ...u, me: nextMe };
    });
    if (nextMe?.id) {
      await updateCollection("people", (people) =>
        people.map((p: any) => (p.id === nextMe.id ? { ...p, ...nextMe } : p)),
      );
    }
    sendJson(res, 200, { ok: true, me: nextMe });
    return;
  }

  const followMatch = pathname.match(/^\/api\/people\/([^/]+)\/follow$/);
  if (followMatch && method === "POST") {
    const targetId = decodeURIComponent(followMatch[1]);
    let isFollowing = false;
    await updateUserState(clientId, (u) => {
      isFollowing = !u.followingIds.includes(targetId);
      const followingIds = isFollowing
        ? [...u.followingIds, targetId]
        : u.followingIds.filter((id) => id !== targetId);
      const me = {
        ...u.me,
        following: Math.max(0, Number(u.me.following || 0) + (isFollowing ? 1 : -1)),
      };
      return { ...u, followingIds, me };
    });
    await updateCollection("people", (people) =>
      people.map((p: any) =>
        p.id === targetId
          ? {
              ...p,
              followers: Math.max(0, Number(p.followers || 0) + (isFollowing ? 1 : -1)),
            }
          : p,
      ),
    );
    sendJson(res, 200, { ok: true, following: isFollowing });
    return;
  }

  // ==================== DRAFTS, PROMPTS, GUIDES, NOTIFICATIONS ====================
  if (pathname === "/api/drafts" && method === "GET") {
    const u = await getUserState(clientId);
    sendJson(res, 200, { ok: true, drafts: u.drafts });
    return;
  }

  if (pathname === "/api/drafts" && method === "POST") {
    const body = await readBody(req);
    const draft = {
      id: body.id || `draft_${Date.now()}`,
      text: String(body.text || "").trim(),
      image: body.image || undefined,
      savedAt: body.savedAt || "Just now",
      place: body.place || undefined,
      circleId: body.circleId || undefined,
    };
    const u = await updateUserState(clientId, (curr) => ({
      ...curr,
      drafts: [draft, ...curr.drafts.filter((d: any) => d.id !== draft.id)],
    }));
    sendJson(res, 201, { ok: true, draft, drafts: u.drafts });
    return;
  }

  const draftDeleteMatch = pathname.match(/^\/api\/drafts\/([^/]+)$/);
  if (draftDeleteMatch && method === "DELETE") {
    const draftId = decodeURIComponent(draftDeleteMatch[1]);
    const u = await updateUserState(clientId, (curr) => ({
      ...curr,
      drafts: curr.drafts.filter((d: any) => d.id !== draftId),
    }));
    sendJson(res, 200, { ok: true, drafts: u.drafts });
    return;
  }

  const promptVoteMatch = pathname.match(/^\/api\/prompts\/([^/]+)\/vote$/);
  if (promptVoteMatch && method === "POST") {
    const promptId = decodeURIComponent(promptVoteMatch[1]);
    const body = await readBody(req);
    const option = String(body.option || "");
    await updateUserState(clientId, (u) => ({
      ...u,
      promptVotes: { ...u.promptVotes, [promptId]: option },
    }));
    let updatedPrompt: any = null;
    await updateCollection("prompts", (prompts) =>
      prompts.map((p: any) => {
        if (p.id !== promptId) return p;
        updatedPrompt = { ...p, votes: Number(p.votes || 0) + 1 };
        return updatedPrompt;
      }),
    );
    if (updatedPrompt) broadcast("prompt:updated", { prompt: updatedPrompt });
    sendJson(res, 200, { ok: true, prompt: updatedPrompt, voted: option });
    return;
  }

  const guideMatch = pathname.match(/^\/api\/guides\/([^/]+)\/progress$/);
  if (guideMatch && method === "POST") {
    const guideId = decodeURIComponent(guideMatch[1]);
    const body = await readBody(req);
    const u = await updateUserState(clientId, (curr) => {
      const savedGuideIds =
        typeof body.saved === "boolean"
          ? body.saved
            ? Array.from(new Set([...curr.savedGuideIds, guideId]))
            : curr.savedGuideIds.filter((id) => id !== guideId)
          : curr.savedGuideIds;
      const guideSteps = Array.isArray(body.completedSteps)
        ? { ...curr.guideSteps, [guideId]: body.completedSteps }
        : curr.guideSteps;
      return { ...curr, savedGuideIds, guideSteps };
    });
    sendJson(res, 200, {
      ok: true,
      savedGuideIds: u.savedGuideIds,
      guideSteps: u.guideSteps,
    });
    return;
  }

  if (pathname === "/api/notifications/read" && method === "POST") {
    const body = await readBody(req);
    const u = await updateUserState(clientId, (curr) => ({
      ...curr,
      notifications: curr.notifications.map((n: any) =>
        !body.id || n.id === body.id ? { ...n, read: true } : n,
      ),
    }));
    sendJson(res, 200, { ok: true, notifications: u.notifications });
    return;
  }

  if (pathname === "/api/preferences" && method === "PUT") {
    const body = await readBody(req);
    const u = await updateUserState(clientId, (curr) => ({
      ...curr,
      preferences: body.preferences ?? body,
    }));
    sendJson(res, 200, { ok: true, preferences: u.preferences });
    return;
  }

  // ==================== CROSS-DEVICE WORKSPACE SYNC ====================
  const wsMatch = pathname.match(/^\/api\/workspace\/([^/]+)$/);
  if (wsMatch) {
    const syncKey = decodeURIComponent(wsMatch[1]);
    if (method === "GET") {
      const record = await getWorkspaceSnapshot(syncKey);
      if (!record) {
        sendJson(res, 404, { ok: false, error: "No workspace found for that sync code." });
        return;
      }
      sendJson(res, 200, { ok: true, ...record });
      return;
    }
    if (method === "PUT" || method === "POST") {
      const body = await readBody(req);
      const snapshot = body.snapshot ?? body;
      const me = snapshot?.data?.me ?? {};
      const saved = await saveWorkspaceSnapshot(
        syncKey,
        String(me.handle || "norabennett"),
        String(me.name || "Nora Bennett"),
        snapshot,
      );
      sendJson(res, 200, { ok: true, ...saved });
      return;
    }
  }

  sendJson(res, 404, { ok: false, error: `Route not found: ${method} ${pathname}` });
}

async function main() {
  const dbInfo = await initDatabase();
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error("API error:", err);
      if (!res.headersSent) {
        sendJson(res, 500, {
          ok: false,
          error: err instanceof Error ? err.message : "Internal server error",
        });
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[thursday-api] listening on http://0.0.0.0:${PORT} (storage: ${dbInfo.mode})`,
    );
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
