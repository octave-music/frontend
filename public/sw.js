/* eslint-disable no-restricted-globals */
/* 
   Enhanced Service Worker supporting:
   - Offline caching with refined strategies
   - Exclusion of audio track requests to prevent conflicts with IndexedDB
   - Basic push notifications
   - 'Cache-first' for static assets and 'network-first' for API requests
   - PWA install prompt bridging
   - Additional logging
*/

// Cache version naming
const CACHE_VERSION = 2; // Increment to update the cache
const CACHE_NAME = `octave-cache-v${CACHE_VERSION}`;

// List core assets to cache at install time
const CORE_ASSETS = [
  '/',
  'workbox-4754cb34.js',
  'sw.js',
];

// INSTALL
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching Core Assets');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event');
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log(`[Service Worker] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      );
      await clients.claim();
      console.log('[Service Worker] Claiming Clients for Current Service Worker');
    })()
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  /* --- completely ignore Deezer-Worker requests ---------------- */
    if (url.hostname.includes('deezer-worker.justvinixy.workers.dev')) {
      // Let the network handle it (our front-end does its own caching / IDB)
      return;
    }


  // Exclude audio track requests from service worker handling
  if (url.pathname.startsWith('/api/track/') && url.pathname.endsWith('.mp3')) {
     console.log('[Service Worker] Bypassing cache for audio track:', url.href);
     return;
   }

  // Cache CSS, images, fonts dynamically
  if (url.origin === self.location.origin) {
    if (url.pathname === '/globals.css') {
      event.respondWith(cacheAsset(event, '/globals.css'));
      return;
    }

    if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/fonts/')) {
      event.respondWith(cacheAsset(event));
      return;
    }

    // For other static assets (HTML, etc.), use Cache-First strategy
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[Service Worker] Fetch failed:', err);
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
    );
  } else {
    // Handle API requests with Network-First strategy
    if (url.origin.startsWith('https://api.octave.gold')) {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch(() => {
            return caches.match(event.request);
          })
      );
    } else {
      // Default to Network-First for other requests
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch(() => {
            return caches.match(event.request);
          })
      );
    }
  }
});

// Cache static assets (images, fonts, globals.css)
const cacheAsset = (event, asset = event.request.url) => {
  return caches.match(asset).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }
    return fetch(event.request).then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return networkResponse;
      }
      const responseToCache = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(asset, responseToCache);
      });
      return networkResponse;
    });
  });
};

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
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// MESSAGE
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
