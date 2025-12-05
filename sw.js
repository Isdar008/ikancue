// sw.js - Xtrimer Tunnel

const CACHE_NAME = "xtrimer-static-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/panel.html",
  "/style.css",
  "/script.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install: cache asset penting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: bersihin cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  clients.claim();
});

// Fetch: coba dari cache dulu, kalau ga ada baru ke network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          // fallback simple kalau offline
          cached || new Response("Offline", { status: 503, statusText: "Offline" })
        )
      );
    })
  );
});
