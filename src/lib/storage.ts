import { useEffect, useRef, useState } from "react";

export const STORAGE_PREFIX = "thursday.v2.";
function currentScopedKey(c?: any) {
  let scope = "";
  try {
    scope = window.localStorage.getItem(`${STORAGE_PREFIX}auth_user_id`) || "";
  } catch {}
  const base = `${STORAGE_PREFIX}${c}`;
  return scope ? `${base}@${scope}` : base;
}
export function resetStoredWorkspaceState() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .filter(
        (key) =>
          !key.endsWith("auth_token") &&
          !key.endsWith("auth_user") &&
          !key.endsWith("auth_user_id") &&
          !key.endsWith("preferences") &&
          !key.endsWith("sync_key"),
      )
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {}
}
/**
 * One-time sweep of everything the old seed left in localStorage.
 *
 * Bootstrap now replaces each collection wholesale, so this is belt and
 * braces for browsers that cached the demo world before that change: seeded
 * people, highlights, circles and gatherings are dropped by id so no stale
 * copy can flash on screen or survive an offline open.
 */
const SEEDED_PERSON_IDS = [
  "me", "maya", "priya", "jonah", "theo", "lena", "sam", "amara", "ravi",
];
let seededContentPurged = false;
export function purgeSeededContentOnce() {
  if (seededContentPurged) return;
  seededContentPurged = true;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith(STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      const kept = parsed.filter((item: any) => {
        if (!item) return false;
        const author = item.authorId ?? item.hostId ?? item.ownerId ?? item.personId;
        const ids = [item.id, author, ...(item.moderatorIds || [])].filter(Boolean);
        return !ids.some((id: string) => SEEDED_PERSON_IDS.includes(String(id)));
      });
      if (kept.length !== parsed.length) {
        window.localStorage.setItem(key, JSON.stringify(kept));
      }
    }
  } catch {}
}

/**
 * Earlier builds shipped a demo inbox (conv_maya, conv_priya, …) that was
 * cached in localStorage. Those conversations could never receive a reply,
 * because the people in them only ever existed as static copy. This drops
 * them once so an inbox that is genuinely empty looks empty.
 */
const DEMO_CONVERSATION_IDS = [
  "conv_maya",
  "conv_priya",
  "conv_theo",
  "conv_ravi",
  "conv_amara",
  "conv_sam",
  "conv_joint",
];
let demoConversationsPurged = false;
export function purgeDemoConversationsOnce() {
  if (demoConversationsPurged) return;
  demoConversationsPurged = true;
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX) && key.includes("conversations"))
      .forEach((key) => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return;
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return;
        }
        if (!Array.isArray(parsed)) return;
        const kept = parsed.filter(
          (conv: any) => !DEMO_CONVERSATION_IDS.includes(conv?.id),
        );
        if (kept.length !== parsed.length) {
          window.localStorage.setItem(key, JSON.stringify(kept));
        }
      });
  } catch {}
}

export function useStoredState(c?: any, u?: any) {
  const m = currentScopedKey(c),
    [d, x] = useState<any>(() => {
      try {
        const A = window.localStorage.getItem(m);
        if (A !== null) return JSON.parse(A);
      } catch {}
      return typeof u == "function" ? u() : u;
    }),
    w = useRef<any>(true);
  useEffect(() => {
    if (w.current) {
      w.current = false;
      return;
    }
    try {
      window.localStorage.setItem(m, JSON.stringify(d));
      window.dispatchEvent(new CustomEvent("thursday:workspace-updated", { detail: { key: c } }));
    } catch {}
  }, [m, d, c]);
  return [d, x];
}
export function clearWorkspaceStorage() {
  try {
    Object.keys(window.localStorage)
      .filter((c?: any) => c.startsWith(STORAGE_PREFIX))
      .forEach((c?: any) => window.localStorage.removeItem(c));
  } catch {}
}
export function exportWorkspaceSnapshot() {
  const c: Record<string, any> = {};
  try {
    Object.keys(window.localStorage)
      .filter((u?: any) => u.startsWith(STORAGE_PREFIX) && u !== `${STORAGE_PREFIX}sync_key`)
      .forEach((u?: any) => {
        const m = window.localStorage.getItem(u);
        if (m !== null)
          try {
            c[u.replace(STORAGE_PREFIX, "")] = JSON.parse(m);
          } catch {
            c[u.replace(STORAGE_PREFIX, "")] = m;
          }
      });
  } catch {}
  return JSON.stringify(
    {
      app: "Thursday",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: c,
    },
    null,
    2,
  );
}
export function importWorkspaceSnapshot(rawJson: string): number {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const data =
    parsed && typeof parsed === "object" && parsed.data && typeof parsed.data === "object"
      ? parsed.data
      : parsed && typeof parsed === "object"
        ? parsed
        : null;
  if (!data) {
    throw new Error("That file doesn't look like a Thursday workspace backup.");
  }
  let count = 0;
  Object.entries(data).forEach(([key, value]) => {
    if (!key || key === "sync_key") return;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      count += 1;
    } catch {}
  });
  if (count === 0) {
    throw new Error("No workspace data found inside that backup.");
  }
  return count;
}
export function downloadTextFile(c: any, u: any, m = "application/json") {
  const d = new Blob([u], {
      type: m,
    }),
    x = URL.createObjectURL(d),
    w = document.createElement("a");
  w.href = x;
  w.download = c;
  document.body.appendChild(w);
  w.click();
  document.body.removeChild(w);
  URL.revokeObjectURL(x);
}
export function downloadIcsEvent(event: {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  place?: string;
}) {
  const rawDate = (event.date || "2026-11-28").replace(/-/g, "");
  const timeMatch = (event.time || "10:00 – 12:00").match(/(\d{1,2}):(\d{2})/g) || [
    "10:00",
    "12:00",
  ];
  const formatHm = (hm: string) => {
    const [h = "10", m = "00"] = hm.split(":");
    return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  };
  const start = `${rawDate}T${formatHm(timeMatch[0] || "10:00")}`;
  const end = `${rawDate}T${formatHm(timeMatch[1] || "12:00")}`;
  const escapeIcs = (txt: string) =>
    txt.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thursday//Gatherings//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id || `event_${Date.now()}`}@thursday.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description || "A Thursday circle gathering.")}`,
    `LOCATION:${escapeIcs(event.place || "Thursday Circle")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  downloadTextFile(`${slug || "thursday-gathering"}.ics`, ics, "text/calendar;charset=utf-8");
}
