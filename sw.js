const CACHE_NAME = "presenziario-cache-v3"; // bump cache
const RUNTIME_CACHE = "presenziario-runtime-v1";
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
  const { request } = event;
  // Solo GET e stessa origine
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Stale-While-Revalidate per asset statici e HTML
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await caches.match(request);
    const fetchPromise = fetch(request)
      .then(async (networkResponse) => {
        // Clona e metti in cache se ok
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          try { await cache.put(request, networkResponse.clone()); } catch (e) {}
        }
        return networkResponse;
      })
      .catch(() => cached);

    // Rispondi subito con cache se presente, altrimenti vai in rete
    return cached || fetchPromise;
  })());
});
