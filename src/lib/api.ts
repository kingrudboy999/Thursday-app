import {
  exportWorkspaceSnapshot,
  importWorkspaceSnapshot,
  STORAGE_PREFIX,
} from "./storage";

export const DEFAULT_RAILWAY_API_URL = "https://thursday-api-production.up.railway.app";

export const API_BASE_URL = (
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  DEFAULT_RAILWAY_API_URL
).replace(/\/+$/, "");

const CLIENT_ID_KEY = `${STORAGE_PREFIX}sync_key`;
const LAST_SYNC_KEY = `${STORAGE_PREFIX}last_synced_at`;

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
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Thursday-Client-Id": getClientId(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  database?: string;
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

// Posts
export async function apiCreatePost(post: any, author?: any) {
  return apiRequest("/api/posts", {
    method: "POST",
    body: JSON.stringify({ ...post, author }),
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
) {
  return apiRequest(`/api/posts/${encodeURIComponent(postId)}/${action}`, {
    method: "POST",
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

// Stories & Highlights
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

// Reels
export async function apiCreateReel(reel: any) {
  return apiRequest("/api/reels", {
    method: "POST",
    body: JSON.stringify(reel),
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

// Circles & Gatherings
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

// Conversations & DMs
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

export async function apiReactMessage(convId: string, messageId: string, emoji: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(convId)}/react`, {
    method: "POST",
    body: JSON.stringify({ messageId, emoji }),
  });
}

// Profile & Follows
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

// Drafts, Prompts, Guides, Notifications & Preferences
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

export async function apiVotePrompt(promptId: string, option: string) {
  return apiRequest(`/api/prompts/${encodeURIComponent(promptId)}/vote`, {
    method: "POST",
    body: JSON.stringify({ option }),
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
    body: JSON.stringify({ preferences }),
  });
}

// Cross-device Workspace Sync on Railway PostgreSQL
export async function pushWorkspaceToRailway(customKey?: string): Promise<{
  syncKey: string;
  updatedAt: string;
}> {
  const syncKey = customKey ? setClientId(customKey) : getClientId();
  const snapshot = JSON.parse(exportWorkspaceSnapshot());
  const res = await fetch(`${API_BASE_URL}/api/workspace/${encodeURIComponent(syncKey)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Thursday-Client-Id": syncKey,
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
  const res = await fetch(`${API_BASE_URL}/api/workspace/${encodeURIComponent(cleaned)}`, {
    method: "GET",
    headers: { "X-Thursday-Client-Id": cleaned },
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

export interface RealtimeHandlers {
  onPostCreated?: (payload: { post: any; author?: any }) => void;
  onPostUpdated?: (payload: { post: any }) => void;
  onPostDeleted?: (payload: { postId: string }) => void;
  onStoryCreated?: (payload: { story: any }) => void;
  onHighlightCreated?: (payload: { highlight: any }) => void;
  onReelCreated?: (payload: { reel: any }) => void;
  onReelUpdated?: (payload: { reel: any }) => void;
  onCircleCreated?: (payload: { circle: any }) => void;
  onCircleUpdated?: (payload: { circle: any }) => void;
  onEventCreated?: (payload: { event: any }) => void;
  onEventUpdated?: (payload: { event: any }) => void;
  onDmTyping?: (payload: { conversationId: string; personId: string; typing: boolean }) => void;
  onDmMessage?: (payload: { conversationId: string; personId: string; message: any }) => void;
  onPromptUpdated?: (payload: { prompt: any }) => void;
}

export function connectRealtimeStream(handlers: RealtimeHandlers): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  let es: EventSource | null = null;
  let closed = false;
  let reconnectTimer = 0;

  const connect = () => {
    if (closed) return;
    try {
      es = new EventSource(
        `${API_BASE_URL}/api/stream?clientId=${encodeURIComponent(getClientId())}`,
      );
      const bind = (event: string, fn?: (data: any) => void) => {
        if (!fn || !es) return;
        es.addEventListener(event, (ev: MessageEvent) => {
          try {
            fn(JSON.parse(ev.data));
          } catch {}
        });
      };
      bind("post:created", handlers.onPostCreated);
      bind("post:updated", handlers.onPostUpdated);
      bind("post:deleted", handlers.onPostDeleted);
      bind("story:created", handlers.onStoryCreated);
      bind("highlight:created", handlers.onHighlightCreated);
      bind("reel:created", handlers.onReelCreated);
      bind("reel:updated", handlers.onReelUpdated);
      bind("circle:created", handlers.onCircleCreated);
      bind("circle:updated", handlers.onCircleUpdated);
      bind("event:created", handlers.onEventCreated);
      bind("event:updated", handlers.onEventUpdated);
      bind("dm:typing", handlers.onDmTyping);
      bind("dm:message", handlers.onDmMessage);
      bind("prompt:updated", handlers.onPromptUpdated);

      es.onerror = () => {
        es?.close();
        es = null;
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 5000);
        }
      };
    } catch {}
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    es?.close();
  };
}
