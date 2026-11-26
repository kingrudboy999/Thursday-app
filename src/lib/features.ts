import { PHOTOS } from "./social";

export const INITIAL_DRAFTS = [
  {
    id: "draft_1",
    text: "Notes from the wheel: the smaller the cup, the harder it is to centre. I keep forgetting that.",
    image: PHOTOS.potteryHands,
    savedAt: "Yesterday, 6:42 PM",
  },
  {
    id: "draft_2",
    text: "A short list of the things I want to make before the end of the summer.",
    savedAt: "Tuesday, 9:15 AM",
  },
];
export const STORY_HIGHLIGHTS = [
  {
    id: "h1",
    title: "Studio",
    image: PHOTOS.potteryWindow,
    count: 8,
  },
  {
    id: "h2",
    title: "Trail days",
    image: PHOTOS.trail,
    count: 5,
  },
  {
    id: "h3",
    title: "Sunday table",
    image: PHOTOS.picnic,
    count: 11,
  },
  {
    id: "h4",
    title: "Print room",
    image: PHOTOS.studioDesk,
    count: 4,
  },
];
export const AUDIO_TRACKS = [
  {
    id: "a1",
    title: "Neighbourhood",
    artist: "Kite Season",
    uses: 12400,
    tone: "Quiet indie",
  },
  {
    id: "a2",
    title: "Long Way Down",
    artist: "North Ridges",
    uses: 8200,
    tone: "Field recording",
  },
  {
    id: "a3",
    title: "Soft Static",
    artist: "Fields",
    uses: 21100,
    tone: "Ambient",
  },
  {
    id: "a4",
    title: "Clay & Kettle",
    artist: "Studio Hours",
    uses: 5400,
    tone: "Acoustic",
  },
];
export const THURSDAY_PROMPTS = [
  {
    id: "pr1",
    question: "What are you making this week?",
    options: [
      "Something small",
      "Something unfinished",
      "A mess",
      "Something for someone",
    ],
    votes: 284,
    closes: "2 days",
  },
  {
    id: "pr2",
    question: "Best way to spend a Thursday evening?",
    options: [
      "Long walk",
      "Studio time",
      "Dinner with friends",
      "Absolutely nothing",
    ],
    votes: 431,
    closes: "5 hours",
  },
];
export const CIRCLE_GUIDES = [
  {
    id: "g1",
    title: "A quieter phone",
    summary:
      "Five small changes that made social media feel like a garden instead of a shopping centre.",
    image: PHOTOS.coffee,
    steps: 5,
    authorId: "theo",
  },
  {
    id: "g2",
    title: "Your first glaze",
    summary: "Everything Priya tells first-time potters, without the jargon.",
    image: PHOTOS.ceramicMolds,
    steps: 7,
    authorId: "priya",
  },
  {
    id: "g3",
    title: "Walk slowly on purpose",
    summary: "Jonah's notes on three short trails you can do before lunch.",
    image: PHOTOS.pines,
    steps: 3,
    authorId: "jonah",
  },
];
export const CLOSE_FRIEND_IDS = ["maya", "priya", "theo"];
export const RECENT_VISITORS = [
  {
    personId: "jonah",
    time: "12m",
  },
  {
    personId: "lena",
    time: "1h",
  },
  {
    personId: "sam",
    time: "3h",
  },
  {
    personId: "theo",
    time: "Yesterday",
  },
  {
    personId: "maya",
    time: "Yesterday",
  },
  {
    personId: "priya",
    time: "2d",
  },
];
