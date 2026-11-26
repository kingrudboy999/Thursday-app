import { useEffect, useRef, useState } from "react";

export const STORAGE_PREFIX = "thursday.v2.";
export function useStoredState(c?: any, u?: any) {
  const m = `${STORAGE_PREFIX}${c}`,
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
