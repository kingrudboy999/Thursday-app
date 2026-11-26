export type ThemeMode = "light" | "dark";

export type AppView =
  | "home"
  | "explore"
  | "reels"
  | "circles"
  | "events"
  | "messages"
  | "notifications"
  | "bookmarks"
  | "profile"
  | "settings";

export interface Person {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  verified?: boolean;
  location?: string;
  website?: string;
  joined?: string;
  cover?: string;
  online?: boolean;
  lastActive?: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  text: string;
  time: string;
  likes: number;
}

export interface PostPollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PostItem {
  id: string;
  authorId: string;
  time: string;
  text: string;
  image?: string;
  images?: string[];
  location?: string;
  topic?: string;
  circleId?: string;
  pinned?: boolean;
  likes: number;
  reposts: number;
  liked?: boolean;
  saved?: boolean;
  reposted?: boolean;
  poll?: {
    question: string;
    totalVotes: number;
    votedOptionId?: string;
    options: PostPollOption[];
  };
  nowPlaying?: {
    track: string;
    artist: string;
    albumArt?: string;
  };
  comments: PostComment[];
}

export interface StoryItem {
  id: string;
  authorId: string;
  image: string;
  caption: string;
  time: string;
  audience?: "everyone" | "close-friends";
}

export interface DirectMessage {
  id: string;
  fromId: string;
  text?: string;
  image?: string;
  voiceSeconds?: number;
  time: string;
  seen?: boolean;
  reactions?: string[];
  replyTo?: {
    id: string;
    authorName: string;
    preview: string;
  };
}

export interface Conversation {
  id: string;
  personId: string;
  unread: number;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
  request?: boolean;
  typing?: boolean;
  messages: DirectMessage[];
}

export interface ReelItem {
  id: string;
  authorId: string;
  video: string;
  poster: string;
  caption: string;
  audio: string;
  location?: string;
  likes: number;
  shares: number;
  views: number;
  liked?: boolean;
  saved?: boolean;
  comments: PostComment[];
}

export interface CircleSpace {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  members: number;
  posts: number;
  category: string;
  accent: "clay" | "sand" | "sage" | "forest";
  joined: boolean;
}

export interface GatheringEvent {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  dayLabel: string;
  time: string;
  venue: string;
  city: string;
  image: string;
  hostId: string;
  circleId?: string;
  entry: string;
  free?: boolean;
  thisWeek?: boolean;
  going: boolean;
  spots: number;
  attendeeIds: string[];
}
