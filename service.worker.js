const CACHE_NAME = "xtrimer-cache-v1";
const URLS_TO_CACHE = [
  "/",
  "/panel.html",
  "/style.css",
  "/script.js",
  "/manifest.json"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// FETCH
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() =>
          caches.match("/panel.html")
        )
      );
    })
  );
});
