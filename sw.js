/* HSK Master service worker: offline app shell, cached pages and stroke data. */
const VERSION = "v3";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const HANZI = `hanzi-${VERSION}`;
// "" at the site root, "/hsk-master" when served from a sub-folder such as GitHub Pages.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Build assets and stroke data never change at a given URL: cache first.
  if (url.pathname.startsWith(`${BASE}/_next/static/`) || url.pathname.startsWith(`${BASE}/hanzi/`)) {
    const cacheName = url.pathname.startsWith(`${BASE}/hanzi/`) ? HANZI : STATIC;
    event.respondWith(
      caches.open(cacheName).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Pages: network first, fall back to the last copy when offline.
  if (req.mode === "navigate" || req.headers.get("RSC") === "1" || url.pathname.startsWith(`${BASE}/data/`)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(`${BASE}/`)) || Response.error()),
    );
  }
});
