import { PHOTOS } from "./social";

export const INITIAL_CIRCLES: any[] = [];
export const INITIAL_EVENTS: any[] = [];
// Sample circle posts from invented people. Removed with the rest.
export const SPACE_POSTS: any[] = [];
export const WEEKLY_PROMPT_BANNER = {
  title: "What are you making this week?",
  body: "Share the unfinished version. The circle is here for the messy middle.",
};
export const ACCENT_BADGE_STYLES = {
  clay: {
    bg: "bg-clay-wash",
    text: "text-clay",
    ring: "ring-clay/20",
  },
  sand: {
    bg: "bg-sand-soft",
    text: "text-[#8a6c34]",
    ring: "ring-[#b28f54]/25",
  },
  sage: {
    bg: "bg-sage-soft",
    text: "text-[#5c7157]",
    ring: "ring-[#7f9479]/25",
  },
  forest: {
    bg: "bg-forest-wash",
    text: "text-forest",
    ring: "ring-forest/20",
  },
};
export const FEED_TABS = [
  {
    value: "for-you",
    label: "For you",
  },
  {
    value: "following",
    label: "Following",
  },
  {
    value: "photos",
    label: "Photos",
  },
  {
    value: "circles",
    label: "Circles",
  },
];
