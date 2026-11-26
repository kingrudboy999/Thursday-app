export const DEFAULT_PREFERENCES = {
  theme: "light",
  reduceMotion: false,
  notifications: {
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    circles: true,
    gatherings: true,
    digest: false,
  },
  privacy: {
    privateAccount: false,
    messageRequests: true,
    readReceipts: true,
    showOnline: true,
    allowTags: true,
  },
};
export const NOTIFICATION_TOGGLES = [
  {
    key: "likes",
    title: "Likes and saves",
    description: "When someone reacts to a post or reel you shared.",
  },
  {
    key: "comments",
    title: "Comments and replies",
    description: "Thoughtful replies, mentions, and thread updates.",
  },
  {
    key: "follows",
    title: "New followers",
    description: "When someone chooses to follow you.",
  },
  {
    key: "messages",
    title: "Direct messages",
    description: "New messages and message requests from your circle.",
  },
  {
    key: "circles",
    title: "Circle activity",
    description: "Posts from the circles you have joined.",
  },
  {
    key: "gatherings",
    title: "Gatherings",
    description: "RSVP reminders and changes to something you're attending.",
  },
  {
    key: "digest",
    title: "Weekly letter",
    description: "A Sunday note with what your circle shared and what's ahead.",
  },
];
export const PRIVACY_TOGGLES = [
  {
    key: "privateAccount",
    title: "Private account",
    description: "Only people you approve can see your posts and reels.",
  },
  {
    key: "messageRequests",
    title: "Filter message requests",
    description: "People you don't follow land in Requests, not your inbox.",
  },
  {
    key: "readReceipts",
    title: "Send read receipts",
    description: "Let people know when you've read their message.",
  },
  {
    key: "showOnline",
    title: "Show online status",
    description: "Display an active dot when you're using Thursday.",
  },
  {
    key: "allowTags",
    title: "Allow tags and mentions",
    description: "Let people tag you in posts, reels, and comments.",
  },
];
