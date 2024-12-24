/* eslint-disable no-restricted-globals */
/* 
   Example advanced service worker supporting:
   - Offline caching
   - Basic push notifications
   - 'Cache-first' or 'network-first' strategies
   - Enhanced for offline playback
   - PWA install prompt bridging
   - Additional logging
*/

/* Cache version naming */
const CACHE_VERSION = 1;
const CACHE_NAME = `octave-cache-v${CACHE_VERSION}`;

/*
   List core assets you want cached at install time.
   e.g. '/', '/index.html', '/favicon.ico', etc.
*/
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  // Additional static files (CSS, JS bundles, icons, etc.)
];

// INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // cleanup old caches
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
      // claim all current clients
      clients.claim();
    })()
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  // example only handling GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Implement custom logic or detect data-saver
  // Basic "cache-first" approach:
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache
        return cachedResponse;
      }
      // Otherwise fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // optionally cache the new resource
          if (!networkResponse || !networkResponse.ok) {
            return networkResponse;
          }
          // clone response
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch((err) => {
          // fallback if offline for non-cached request
          console.warn('SW Fetch failed; returning offline fallback.', err);
          // fallback can be a custom offline page if wanted
          return new Response('Offline or fetch error.', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    const title = payload.title || 'New Notification';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-512.png',
      data: payload.data || {},
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // try focusing an existing window
      const client = clientList.find((c) => c.url === urlToOpen && 'focus' in c);
      if (client) return client.focus();
      // otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// MESSAGE
self.addEventListener('message', (event) => {
  // e.g. if we want to skip waiting from client
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
