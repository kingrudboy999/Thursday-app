import {
  exportWorkspaceSnapshot,
  importWorkspaceSnapshot,
  STORAGE_PREFIX,
} from "./storage";

export const DEFAULT_RAILWAY_API_URL = "https://thursday-api-production.up.railway.app";

const env = (import.meta as unknown as { env?: Record<string, string> })
  .env || {};

/**
 * In `npm run dev` we talk to the local API through Vite's /api proxy, so the
 * app and server share an origin (and SSE/relative URLs behave like prod).
 * Production builds keep pointing at Railway.
 */
export const API_BASE_URL = (
  env.VITE_API_URL ||
  (env.DEV ? "" : DEFAULT_RAILWAY_API_URL)
).replace(/\/+$/, "");

const CLIENT_ID_KEY = `${STORAGE_PREFIX}sync_key`;
const LAST_SYNC_KEY = `${STORAGE_PREFIX}last_synced_at`;
const AUTH_TOKEN_KEY = `${STORAGE_PREFIX}auth_token`;
const AUTH_USER_KEY = `${STORAGE_PREFIX}auth_user`;

export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  profile: any;
  createdAt?: string;
}

function generateSyncKey(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `thu-${seg(4)}-${seg(4)}`;
}

export function getClientId(): string {
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing && existing.length >= 6 && existing.length <= 64) {
      return existing;
    }
    const created = generateSyncKey();
    window.localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return "thu-local-client";
  }
}

export function setClientId(nextKey: string): string {
  const cleaned = nextKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64);
  if (cleaned.length < 6) {
    throw new Error("Sync code must be at least 6 characters.");
  }
  try {
    window.localStorage.setItem(CLIENT_ID_KEY, cleaned);
  } catch {}
  return cleaned;
}

export function getAuthToken(): string {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: AuthUser): void {
  try {
    const prevId = window.localStorage.getItem(
      `${STORAGE_PREFIX}auth_user_id`,
    );
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.localStorage.setItem(`${STORAGE_PREFIX}auth_user_id`, user.id);
    if (prevId && prevId !== user.id) {
      // Workspace state is per-account; drop the previous account's cached feed.
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .filter(
          (key) =>
            !key.endsWith("auth_token") &&
            !key.endsWith("auth_user") &&
            !key.endsWith("auth_user_id") &&
            !key.endsWith("preferences"),
        )
        .forEach((key) => window.localStorage.removeItem(key));
    }
  } catch {}
}

export function clearAuthSession(): void {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem(`${STORAGE_PREFIX}auth_user_id`);
  } catch {}
}

export function getActiveUserId(): string {
  const stored = getStoredAuthUser();
  return stored?.id || "";
}

export function getLastSyncedAt(): string | null {
  try {
    return window.localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Thursday-Client-Id": getClientId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function apiAuthRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Thursday-Client-Id": getClientId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        status: res.status,
        data: json,
        error: json?.error || `Request failed (${res.status})`,
      };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: "Could not reach Thursday server. Check your connection and try again.",
    };
  }
}

// ==================== AUTHENTICATION ====================
export async function apiCheckHandle(handle: string): Promise<{
  available: boolean;
  handle: string;
}> {
  const res = await apiRequest(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`);
  return {
    available: Boolean(res?.available),
    handle: res?.handle || handle,
  };
}

export async function apiSignup(payload: {
  name: string;
  handle: string;
  email: string;
  password: string;
  bio?: string;
  location?: string;
  avatar?: string;
}) {
  const res = await apiAuthRequest<{ ok: true; token: string; user: AuthUser }>(
    "/api/auth/signup",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  if (res.ok && res.data?.token && res.data?.user) {
    saveAuthSession(res.data.token, res.data.user);
  }
  return res;
}

export async function apiLogin(payload: { identifier: string; password: string }) {
  const res = await apiAuthRequest<{ ok: true; token: string; user: AuthUser }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  if (res.ok && res.data?.token && res.data?.user) {
    saveAuthSession(res.data.token, res.data.user);
  }
  return res;
}

export async function apiDemoLogin(accountId = "me") {
  const res = await apiAuthRequest<{ ok: true; token: string; user: AuthUser }>(
    "/api/auth/demo",
    {
      method: "POST",
      body: JSON.stringify({ accountId }),
    },
  );
  if (res.ok && res.data?.token && res.data?.user) {
    saveAuthSession(res.data.token, res.data.user);
  }
  return res;
}

export async function apiGetAuthMe() {
  return apiAuthRequest<{ ok: true; user: AuthUser }>("/api/auth/me", { method: "GET" });
}

export async function apiLogout() {
  await apiRequest("/api/auth/logout", { method: "POST" });
  clearAuthSession();
}

// ==================== HEALTH & BOOTSTRAP ====================
export async function checkBackendHealth(): Promise<{
  ok: boolean;
  database?: string;
  connectedClients?: number;
  onlineUserIds?: string[];
  counts?: Record<string, number>;
}> {
  const res = await apiRequest("/api/health", { method: "GET" });
  return res?.ok ? res : { ok: false };
}

export async function fetchBootstrap() {
  return apiRequest("/api/bootstrap", { method: "GET" });
}

export async function apiResetBackend() {
  return apiRequest("/api/reset", { method: "POST" });
}

// ==================== POSTS ====================
export async function apiCreatePost(post: any, author?: any) {
  return apiRequest("/api/posts", {
    method: "POST",
    body: JSON.stringify({ ...post, author }),
  });
}

export async function apiEditPost(
  postId: string,
  updates: { text?: string; location?: string },
) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function apiDeletePost(postId: string) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });
}

export async function apiPostAction(
  postId: string,
  action: "like" | "save" | "repost" | "pin",
  body?: Record<string, any>,
) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}/${action}`, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiVotePoll(postId: string, optionId: string) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}/vote`, {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });
}

export async function apiAddComment(postId: string, comment: any) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    body: JSON.stringify(comment),
  });
}

export async function apiLikeComment(postId: string, commentId: string) {
  return apiRequest(
    `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/like`,
    { method: "POST" },
  );
}

// ==================== STORIES & HIGHLIGHTS ====================
export async function apiCreateStory(story: any) {
  return apiRequest("/api/stories", {
    method: "POST",
    body: JSON.stringify(story),
  });
}

export async function apiMarkStorySeen(storyId: string) {
  return apiRequest(`/api/stories/${encodeURIComponent(storyId)}/seen`, {
    method: "POST",
  });
}

export async function apiReplyStory(storyId: string, personId: string, text: string) {
  return apiRequest(`/api/stories/${encodeURIComponent(storyId)}/reply`, {
    method: "POST",
    body: JSON.stringify({ personId, text }),
  });
}

export async function apiCreateHighlight(highlight: any) {
  return apiRequest("/api/highlights", {
    method: "POST",
    body: JSON.stringify(highlight),
  });
}

export async function apiDeleteHighlight(highlightId: string) {
  return apiRequest(`/api/highlights/${encodeURIComponent(highlightId)}`, {
    method: "DELETE",
  });
}

// ==================== REELS ====================
export async function apiCreateReel(reel: any) {
  return apiRequest("/api/reels", {
    method: "POST",
    body: JSON.stringify(reel),
  });
}

export async function apiRecordReelView(reelId: string) {
  return apiRequest(`/api/reels/${encodeURIComponent(reelId)}/view`, {
    method: "POST",
  });
}

export async function apiReelAction(
  reelId: string,
  action: "like" | "save" | "comments",
  payload?: any,
) {
  return apiRequest(`/api/reels/${encodeURIComponent(reelId)}/${action}`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

// ==================== CIRCLES & GATHERINGS ====================
export async function apiCreateCircle(circle: any) {
  return apiRequest("/api/circles", {
    method: "POST",
    body: JSON.stringify(circle),
  });
}

export async function apiToggleCircle(circleId: string) {
  return apiRequest(`/api/circles/${encodeURIComponent(circleId)}/join`, {
    method: "POST",
  });
}

export async function apiCreateEvent(event: any) {
  return apiRequest("/api/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function apiToggleEventRsvp(eventId: string) {
  return apiRequest(`/api/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: "POST",
  });
}

// ==================== CONVERSATIONS, TYPING, READ RECEIPTS & CALLS ====================
export async function apiStartConversation(personId: string, id?: string) {
  return apiRequest("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ personId, id }),
  });
}

export async function apiUpdateConversation(convId: string, patch: Record<string, any>) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function apiDeleteConversation(convId: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}`, {
    method: "DELETE",
  });
}

export async function apiSendMessage(convId: string, message: any, personId?: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ ...message, personId }),
  });
}

export async function apiSendTyping(convId: string, typing: boolean) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}/typing`, {
    method: "POST",
    body: JSON.stringify({ typing }),
  });
}

export async function apiMarkThreadRead(convId: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}/read`, {
    method: "POST",
  });
}

export async function apiReactMessage(convId: string, messageId: string, emoji: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}/react`, {
    method: "POST",
    body: JSON.stringify({ messageId, emoji }),
  });
}

export async function apiSendCallSignal(payload: {
  targetUserId: string;
  type: "ring" | "accept" | "decline" | "end" | "offer" | "answer" | "ice";
  kind?: "audio" | "video";
  callId?: string;
  conversationId?: string;
  fromUserId?: string;
  sdp?: any;
  candidate?: any;
}) {
  return apiRequest("/api/calls/signal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ==================== PROFILE, FOLLOWS & VISITORS ====================
export async function apiUpdateMe(me: any) {
  return apiRequest("/api/me", {
    method: "PUT",
    body: JSON.stringify(me),
  });
}

export async function apiToggleFollow(personId: string) {
  return apiRequest(`/api/people/${encodeURIComponent(personId)}/follow`, {
    method: "POST",
  });
}

export async function apiRecordProfileVisit(personId: string) {
  return apiRequest(`/api/people/${encodeURIComponent(personId)}/visit`, {
    method: "POST",
  });
}

// ==================== DRAFTS, PROMPTS, GUIDES, NOTIFICATIONS & PREFS ====================
export async function apiSaveDraft(draft: any) {
  return apiRequest("/api/drafts", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function apiDeleteDraft(draftId: string) {
  return apiRequest(`/api/drafts/${encodeURIComponent(draftId)}`, {
    method: "DELETE",
  });
}

export async function apiVotePrompt(promptId: string, optionId: string) {
  return apiRequest(`/api/prompts/${encodeURIComponent(promptId)}/vote`, {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });
}

export async function apiSaveGuideProgress(
  guideId: string,
  payload: { saved?: boolean; completedSteps?: number[] },
) {
  return apiRequest(`/api/guides/${encodeURIComponent(guideId)}/progress`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiMarkNotificationsRead(id?: string) {
  return apiRequest("/api/notifications/read", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export async function apiUpdatePreferences(preferences: any) {
  return apiRequest("/api/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

// ==================== WORKSPACE CLOUD SYNC ====================
export async function pushWorkspaceToRailway(customKey?: string): Promise<{
  syncKey: string;
  updatedAt: string;
}> {
  const syncKey = customKey ? setClientId(customKey) : getClientId();
  const snapshot = JSON.parse(exportWorkspaceSnapshot());
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/workspace/${encodeURIComponent(syncKey)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Thursday-Client-Id": syncKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ snapshot }),
  });
  if (!res.ok) {
    throw new Error(`Railway sync failed (${res.status})`);
  }
  const data = await res.json();
  const updatedAt = data.updatedAt || new Date().toISOString();
  try {
    window.localStorage.setItem(LAST_SYNC_KEY, updatedAt);
  } catch {}
  return { syncKey, updatedAt };
}

export async function pullWorkspaceFromRailway(syncKeyInput: string): Promise<{
  syncKey: string;
  restoredKeys: number;
  updatedAt: string;
}> {
  const cleaned = syncKeyInput
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");
  if (cleaned.length < 6) {
    throw new Error("Enter a valid Thursday sync code (at least 6 characters).");
  }
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/workspace/${encodeURIComponent(cleaned)}`, {
    method: "GET",
    headers: {
      "X-Thursday-Client-Id": cleaned,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "No workspace found on Railway for that sync code yet."
        : `Could not reach Railway backend (${res.status}).`,
    );
  }
  const data = await res.json();
  const snapshotStr =
    typeof data.snapshot === "string" ? data.snapshot : JSON.stringify(data.snapshot);
  const restoredKeys = importWorkspaceSnapshot(snapshotStr);
  setClientId(cleaned);
  const updatedAt = data.updatedAt || new Date().toISOString();
  try {
    window.localStorage.setItem(LAST_SYNC_KEY, updatedAt);
  } catch {}
  return { syncKey: cleaned, restoredKeys, updatedAt };
}

// ==================== REAL-TIME SSE STREAM ====================
export interface RealtimeHandlers {
  onConnectionChange?: (status: {
    connected: boolean;
    onlineUserIds?: string[];
    connectedClients?: number;
  }) => void;
  onPresenceUpdate?: (payload: {
    onlineUserIds: string[];
    connectedCount: number;
  }) => void;
  onPersonJoined?: (person: any) => void;
  onPersonUpdated?: (person: any) => void;
  onProfileUpdated?: (profile: any) => void;
  onPostCreated?: (post: any) => void;
  onPostUpdated?: (post: any) => void;
  onPostDeleted?: (payload: { id?: string; postId?: string }) => void;
  onStoryCreated?: (story: any) => void;
  onHighlightCreated?: (highlight: any) => void;
  onHighlightDeleted?: (payload: { id: string }) => void;
  onReelCreated?: (reel: any) => void;
  onReelUpdated?: (reel: any) => void;
  onCircleCreated?: (circle: any) => void;
  onCircleUpdated?: (circle: any) => void;
  onEventCreated?: (event: any) => void;
  onEventUpdated?: (event: any) => void;
  onDmTyping?: (payload: {
    conversationId: string;
    userId?: string;
    personId?: string;
    typing: boolean;
  }) => void;
  onDmRead?: (payload: { conversationId: string; readerId: string; at: string }) => void;
  onDmMessage?: (payload: {
    conversationId: string;
    senderId?: string;
    conversation?: any;
    message: any;
  }) => void;
  onDmReaction?: (payload: {
    conversationId: string;
    messageId: string;
    emoji?: string;
    conversation?: any;
  }) => void;
  onNotificationCreated?: (payload: { targetUserId: string; notice: any }) => void;
  onVisitorRecorded?: (payload: {
    targetUserId: string;
    visitors: Array<{ personId: string; time: string }>;
  }) => void;
  onCallSignal?: (payload: {
    callId: string;
    type: "ring" | "accept" | "decline" | "end" | "offer" | "answer" | "ice";
    kind: "audio" | "video";
    fromUserId: string;
    targetUserId: string;
    conversationId?: string;
    sdp?: any;
    candidate?: any;
  }) => void;
  onPromptUpdated?: (prompt: any) => void;
}

export function connectRealtimeStream(handlers: RealtimeHandlers): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  let es: EventSource | null = null;
  let closed = false;
  let reconnectTimer = 0;
  let attempt = 0;
  let lastEventAt = Date.now();

  const connect = () => {
    if (closed) return;
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({ clientId: getClientId() });
      if (token) params.set("token", token);

      es = new EventSource(`${API_BASE_URL}/api/stream?${params.toString()}`);

      const bind = (event: string, fn?: (data: any) => void) => {
        if (!fn || !es) return;
        es.addEventListener(event, (ev: MessageEvent) => {
          try {
            fn(JSON.parse(ev.data));
          } catch {}
        });
      };

      bind("connected", (data) => {
        attempt = 0;
        lastEventAt = Date.now();
        handlers.onConnectionChange?.({
          connected: true,
          onlineUserIds: data?.onlineUserIds,
          connectedClients: data?.connectedClients,
        });
      });
      bind("presence:update", handlers.onPresenceUpdate);
      bind("person:joined", handlers.onPersonJoined);
      bind("person:updated", handlers.onPersonUpdated);
      bind("profile:updated", handlers.onProfileUpdated);
      bind("post:created", handlers.onPostCreated);
      bind("post:updated", handlers.onPostUpdated);
      bind("post:deleted", handlers.onPostDeleted);
      bind("story:created", handlers.onStoryCreated);
      bind("highlight:created", handlers.onHighlightCreated);
      bind("highlight:deleted", handlers.onHighlightDeleted);
      bind("reel:created", handlers.onReelCreated);
      bind("reel:updated", handlers.onReelUpdated);
      bind("circle:created", handlers.onCircleCreated);
      bind("circle:updated", handlers.onCircleUpdated);
      bind("event:created", handlers.onEventCreated);
      bind("event:updated", handlers.onEventUpdated);
      bind("dm:typing", handlers.onDmTyping);
      bind("dm:read", handlers.onDmRead);
      bind("dm:message", handlers.onDmMessage);
      bind("dm:reaction", handlers.onDmReaction);
      bind("notification:created", handlers.onNotificationCreated);
      bind("visitor:recorded", handlers.onVisitorRecorded);
      bind("call:signal", handlers.onCallSignal);
      bind("prompt:updated", handlers.onPromptUpdated);

      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;

        // A stream that has been delivering events for a while and then drops
        // is a blip. Only surface "reconnecting" once we are genuinely offline,
        // so one lazy tab or a wifi handover does not paint the app as broken.
        const healthyFor = Date.now() - lastEventAt;
        attempt += 1;
        if (healthyFor > 15_000 || attempt >= 2) {
          handlers.onConnectionChange?.({ connected: false });
        }

        // Exponential backoff with jitter: 1s, 2s, 4s, 8s… capped at 30s.
        const base = Math.min(30_000, 1000 * 2 ** (attempt - 1));
        const wait = base + Math.random() * 400;
        reconnectTimer = window.setTimeout(connect, wait);
      };
    } catch {}
  };

  // Phones suspend background tabs; when we come back we want the stream
  // re-established immediately rather than waiting out the backoff timer.
  const wake = () => {
    if (closed) return;
    if (es && es.readyState === EventSource.OPEN) return;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    attempt = 0;
    connect();
  };
  window.addEventListener("online", wake);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") wake();
  });

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    window.removeEventListener("online", wake);
    es?.close();
  };
}
