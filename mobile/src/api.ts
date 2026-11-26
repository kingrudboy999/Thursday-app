export const MOBILE_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://thursday-api-production.up.railway.app";

const CLIENT_ID = "thursday-mobile-client";

let authToken: string | null = null;
let authUser: any = null;

export function getMobileAuthToken() {
  return authToken;
}
export function getMobileAuthUser() {
  return authUser;
}
export function setMobileAuthSession(token: string, user: any) {
  authToken = token;
  authUser = user;
}
export function clearMobileAuthSession() {
  authToken = null;
  authUser = null;
}

async function mobileFetch<T = any>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Thursday-Client-Id": CLIENT_ID,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const mobileApi = {
  // ==================== LIVE ACCOUNTS (PostgreSQL) ====================
  login: async (identifier: string, password: string) => {
    const res = await mobileFetch<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (res?.ok && res?.token && res?.user) setMobileAuthSession(res.token, res.user);
    return res;
  },
  signup: async (payload: {
    name: string;
    handle: string;
    email: string;
    password: string;
    bio?: string;
    location?: string;
    avatar?: string;
  }) => {
    const res = await mobileFetch<any>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res?.ok && res?.token && res?.user) setMobileAuthSession(res.token, res.user);
    return res;
  },
  demoLogin: async (accountId = "me") => {
    const res = await mobileFetch<any>("/api/auth/demo", {
      method: "POST",
      body: JSON.stringify({ accountId }),
    });
    if (res?.ok && res?.token && res?.user) setMobileAuthSession(res.token, res.user);
    return res;
  },
  me: () => mobileFetch("/api/auth/me"),
  logout: async () => {
    await mobileFetch("/api/auth/logout", { method: "POST" });
    clearMobileAuthSession();
  },
  checkHandle: (handle: string) =>
    mobileFetch(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`),
  sendTyping: (convId: string, typing: boolean) =>
    mobileFetch(`/api/conversations/${encodeURIComponent(convId)}/typing`, {
      method: "POST",
      body: JSON.stringify({ typing }),
    }),
  markThreadRead: (convId: string) =>
    mobileFetch(`/api/conversations/${encodeURIComponent(convId)}/read`, { method: "POST" }),
  recordReelView: (reelId: string) =>
    mobileFetch(`/api/reels/${encodeURIComponent(reelId)}/view`, { method: "POST" }),
  recordProfileVisit: (personId: string) =>
    mobileFetch(`/api/people/${encodeURIComponent(personId)}/visit`, { method: "POST" }),
  sendCallSignal: (payload: any) =>
    mobileFetch("/api/calls/signal", { method: "POST", body: JSON.stringify(payload) }),
  editPost: (postId: string, patch: any) =>
    mobileFetch(`/api/posts/${encodeURIComponent(postId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deletePost: (postId: string) =>
    mobileFetch(`/api/posts/${encodeURIComponent(postId)}`, { method: "DELETE" }),
  bootstrap: () => mobileFetch("/api/bootstrap"),
  createPost: (post: any, author?: any) =>
    mobileFetch("/api/posts", { method: "POST", body: JSON.stringify({ ...post, author }) }),
  postAction: (postId: string, action: "like" | "save") =>
    mobileFetch(`/api/posts/${encodeURIComponent(postId)}/${action}`, { method: "POST" }),
  votePoll: (postId: string, optionId: string) =>
    mobileFetch(`/api/posts/${encodeURIComponent(postId)}/vote`, {
      method: "POST",
      body: JSON.stringify({ optionId }),
    }),
  addComment: (postId: string, comment: any) =>
    mobileFetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: "POST",
      body: JSON.stringify(comment),
    }),
  reelAction: (reelId: string, action: "like" | "save") =>
    mobileFetch(`/api/reels/${encodeURIComponent(reelId)}/${action}`, { method: "POST" }),
  toggleCircle: (circleId: string) =>
    mobileFetch(`/api/circles/${encodeURIComponent(circleId)}/join`, { method: "POST" }),
  toggleEventRsvp: (eventId: string) =>
    mobileFetch(`/api/events/${encodeURIComponent(eventId)}/rsvp`, { method: "POST" }),
  sendMessage: (convId: string, message: any) =>
    mobileFetch(`/api/conversations/${encodeURIComponent(convId)}/messages`, {
      method: "POST",
      body: JSON.stringify(message),
    }),
  reactMessage: (convId: string, messageId: string, emoji: string) =>
    mobileFetch(`/api/conversations/${encodeURIComponent(convId)}/react`, {
      method: "POST",
      body: JSON.stringify({ messageId, emoji }),
    }),
  toggleFollow: (personId: string) =>
    mobileFetch(`/api/people/${encodeURIComponent(personId)}/follow`, { method: "POST" }),
  markNotificationsRead: () =>
    mobileFetch("/api/notifications/read", { method: "POST", body: JSON.stringify({}) }),
};
