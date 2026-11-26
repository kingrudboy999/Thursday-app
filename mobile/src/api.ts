export const MOBILE_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://thursday-api-production.up.railway.app";

const CLIENT_ID = "thursday-mobile-client";

async function mobileFetch<T = any>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Thursday-Client-Id": CLIENT_ID,
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
