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
    } catch {}
  }, [m, d]);
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
  const c = {};
  try {
    Object.keys(window.localStorage)
      .filter((u?: any) => u.startsWith(STORAGE_PREFIX))
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
