const CACHE_NAME = "presenziario-cache-v2"; // Cambia da v1 a v2
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/presenze.html",
  "/dashboard.html",
  "/calendario.html",
  "/esploratori.html",
  "/staff.html",
  "/audit-logs.html",
  "/shared.html",
  "/modals.html",
  "/style.css",
  "/shared.js",
  "/presenze.js",
  "/dashboard.js",
  "/calendario.js",
  "/esploratori.js",
  "/staff.js",
  "/audit-logs.js",
  "/manifest.json"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usa add() invece di addAll() per gestire errori individuali
      return Promise.all(
        URLS_TO_CACHE.map(url => 
          cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
            // Continua anche se un file fallisce
          })
        )
      );
    })
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
