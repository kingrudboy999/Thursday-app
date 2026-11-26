/**
 * Thursday starts empty.
 *
 * This file used to hold a full demo world: nine invented people (Nora, Maya,
 * Priya, Jonah, Theo, Lena, Sam, Amara, Ravi) plus their posts, stories,
 * reels, circles, highlights and gatherings. Because DEFAULT_COLLECTIONS is
 * cloned whenever a collection has no row, deleting them from the database was
 * never enough — they came straight back on the next boot. And they were not
 * passive: DMing a seeded account triggered a canned auto-reply, so the app
 * manufactured conversations that looked human.
 *
 * The collections, guides and prompt copy below are genuine product furniture
 * (a prompt to answer, a guide to read). No accounts, no posts, no people.
 */
export const INITIAL_SEED: any = {
  people: [],
  posts: [],
  stories: [],
  highlights: [],
  reels: [],
  circles: [],
  events: [],
  prompts: [],
  guides: [],
  notifications: [],
  drafts: [],
  followingIds: [],
  preferences: {},
  me: null,
};
