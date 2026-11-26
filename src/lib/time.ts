/**
 * Human time, the way a chat app means it.
 *
 * Timestamps used to be stored as pre-formatted clock strings ("3:51 PM"),
 * which lose the day entirely — a message from three days ago looked like it
 * arrived this afternoon. Everything here works from an absolute ISO time and
 * degrades to the raw string when an older record has nothing better.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function parse(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const raw = String(input).trim();
  if (!raw) return null;
  const asDate = new Date(raw);
  return Number.isNaN(asDate.getTime()) ? null : asDate;
}

/** The clock part alone: "3:51 PM". */
export function clockTime(input: unknown, fallback = ""): string {
  const date = parse(input);
  if (!date) return fallback;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Calendar day label: "Today", "Yesterday", "12 Nov", "12 Nov 2024". */
export function dayLabel(input: unknown, fallback = ""): string {
  const date = parse(input);
  if (!date) return fallback;
  const now = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Short relative age: "now", "4m", "3h", "2d", then a date. */
export function relativeTime(input: unknown, fallback = ""): string {
  const date = parse(input);
  if (!date) return fallback;
  const delta = Date.now() - date.getTime();
  if (delta < 45 * 1000) return "now";
  if (delta < HOUR) return `${Math.round(delta / MINUTE)}m`;
  if (delta < DAY) return `${Math.round(delta / HOUR)}h`;
  if (delta < 7 * DAY) return `${Math.round(delta / DAY)}d`;
  return dayLabel(date, fallback);
}

/** "Today at 3:51 PM" — the full, unambiguous form used on hover and detail. */
export function fullTimestamp(input: unknown, fallback = ""): string {
  const date = parse(input);
  if (!date) return fallback;
  return `${dayLabel(date)} at ${clockTime(date)}`;
}

/**
 * Message stamps in a thread: today shows the clock alone, anything older
 * leads with the day so the year never blurs together.
 */
export function messageStamp(time: unknown, createdAt: unknown, fallback = ""): string {
  const date = parse(createdAt) ?? parse(time);
  if (!date) return fallback || (typeof time === "string" ? time : "");
  const label = dayLabel(date);
  if (label === "Today") return clockTime(date);
  return `${label}, ${clockTime(date)}`;
}
