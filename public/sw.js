const CACHE_NAME = "thursday-pwa-v3";
const CORE_ASSETS = ["/", "/index.html", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Never intercept the API or the realtime stream.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api")) {
    return;
  }

  const isDocument =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  // Network-first for the app shell: a new deploy is always picked up, and the
  // cache is only a fallback when the network genuinely fails. Serving a stale
  // index.html here used to strand clients on an old build pointing at an
  // outdated API, which looked like "Reconnecting…" forever.
  if (isDocument) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(req)
            .then((cached) => cached || caches.match("/index.html")),
        ),
    );
    return;
  }

  // Hashed build assets are immutable — cache-first is correct and fast.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        }),
    ),
  );
});
