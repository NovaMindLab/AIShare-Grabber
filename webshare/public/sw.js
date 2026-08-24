// ShareCLIP WebShare Service Worker
const CACHE_NAME = 'shareclip-webshare-v1.2.94';

// Install event: cache basic app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: network first, cache fallback for navigation and static assets
self.addEventListener('fetch', (event) => {
  // Do not intercept non-GET requests or WebSocket/WebRTC traffic
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip cross-origin or chunk requests
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses for offline support
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
