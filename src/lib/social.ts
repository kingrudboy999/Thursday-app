export const pexelsPhoto = (c: any, u = 1200, m = 900) =>
  `https://images.pexels.com/photos/${c}/pexels-photo-${c}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${u}&h=${m}`;
export const pexelsAvatar = (c?: any) =>
  `https://images.pexels.com/photos/${c}/pexels-photo-${c}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=320&h=320`;
export const PHOTOS = {
  friendsMeadow: pexelsPhoto(14651520),
  potteryWindow: pexelsPhoto(29286725),
  mountains: pexelsPhoto(39957114),
  coffee: pexelsPhoto(832820),
  vinyl: pexelsPhoto(1181772),
  cafeFriends: pexelsPhoto(5047023),
  paintBrushes: pexelsPhoto(18142323),
  studioDesk: pexelsPhoto(15079477),
  ceramicMolds: pexelsPhoto(7221413),
  pampas: pexelsPhoto(8445576),
  trail: pexelsPhoto(37118644),
  pines: pexelsPhoto(37118655),
  vinylWoman: pexelsPhoto(6827288),
  latte: pexelsPhoto(38591675),
  greenCup: pexelsPhoto(2318033),
  vinylClose: pexelsPhoto(6827287),
  friendsSunset: pexelsPhoto(2962239),
  potteryTools: pexelsPhoto(9733303),
  womenLaugh: pexelsPhoto(15556769),
  potteryHands: pexelsPhoto(33912323),
  potteryClass: pexelsPhoto(37224733),
  picnic: pexelsPhoto(11749549),
  picnicSpread: pexelsPhoto(8121759),
  bookshop: pexelsPhoto(32517434),
  bookshopPerson: pexelsPhoto(6946037),
};
export const ME_ID = "me";
/**
 * The people directory starts empty and fills from the server.
 *
 * These constants used to hard-code nine invented residents — Nora, Maya,
 * Priya, Jonah, Theo, Lena, Sam, Amara and Ravi — complete with bios, follower
 * counts and cover photos. They were the client-side twin of the server seed,
 * so even after the database was cleaned the app could still paint fake faces
 * from its own bundle.
 */
export const PEOPLE: any[] = [];
// Invented content used to live here. The app now starts empty and fills from people who exist.
export const INITIAL_POSTS: any[] = [];
// Invented content used to live here. The app now starts empty and fills from people who exist.
export const INITIAL_STORIES: any[] = [];
// Invented content used to live here. The app now starts empty and fills from people who exist.
export const INITIAL_CONVERSATIONS: any[] = [];
export const INITIAL_REELS: any[] = [];
// Invented content used to live here. The app now starts empty and fills from people who exist.
export const INITIAL_NOTICES: any[] = [];
export const TOPICS = [
  {
    tag: "slowmornings",
    label: "Slow mornings",
    posts: "8.4k posts",
    blurb: "Coffee, quiet, and a little less hurry.",
    image: PHOTOS.coffee,
  },
  {
    tag: "madestuff",
    label: "Made by hand",
    posts: "12.1k posts",
    blurb: "Objects with fingerprints still on them.",
    image: PHOTOS.ceramicMolds,
  },
  {
    tag: "trailnotes",
    label: "Trail notes",
    posts: "4.2k posts",
    blurb: "Field notes from somewhere outside.",
    image: PHOTOS.mountains,
  },
  {
    tag: "crateculture",
    label: "Crate culture",
    posts: "3.6k posts",
    blurb: "Records found by accident, on purpose.",
    image: PHOTOS.vinyl,
  },
];
export const SUGGESTED_PERSON_IDS: string[] = [];
export const EXPLORE_ITEMS: any[] = [];
export function formatCount(c?: any) {
  return c >= 1e6
    ? `${(c / 1e6).toFixed(1).replace(".0", "")}m`
    : c >= 1e3
      ? `${(c / 1e3).toFixed(1).replace(".0", "")}k`
      : String(c);
}
