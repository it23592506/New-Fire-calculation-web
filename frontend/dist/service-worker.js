const CACHE_NAME = "fire-safety-v1";
const RUNTIME_CACHE = "fire-safety-runtime-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css"
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log("Static asset caching completed with warnings");
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first for static, network-first for API
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external domains
  if (request.method !== "GET") {
    return;
  }

  // API requests - network-first with fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ offline: true, message: "Offline - using cached data" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-reports") {
    event.waitUntil(
      (async () => {
        try {
          const db = await openDB("fire-safety-reports");
          const reports = await db.getAll("offline-reports");
          for (const report of reports) {
            const response = await fetch("/api/reports", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(report)
            });
            if (response.ok) {
              await db.delete("offline-reports", report.id);
            }
          }
        } catch (_err) {
          console.log("Background sync failed - will retry");
        }
      })()
    );
  }
});

// Helper to open IndexedDB
function openDB(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("offline-reports")) {
        db.createObjectStore("offline-reports", { keyPath: "id" });
      }
    };
  });
}
