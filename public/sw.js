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
  '/index.html',
  '/favicon.ico',
  '/styles.css', // Add your actual CSS files
  '/bundle.js',  // Add your actual JS bundles
  // Add other static assets like images, fonts, etc.
];

// Helper function to determine if a request is for an audio track
const isAudioRequest = (url) => {
  return url.pathname.startsWith('/api/track/') && url.pathname.endsWith('.mp3');
};

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
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Exclude audio track requests from service worker handling
  if (isAudioRequest(url)) {
    console.log('[Service Worker] Bypassing cache for audio track:', url.href);
    return;
  }

  // Define different strategies based on request URL
  if (url.origin === self.location.origin) {
    // Static assets: Use Cache-First strategy
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            // Only cache valid responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Clone and store in cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[Service Worker] Fetch failed:', err);
            // Optionally return a fallback resource
            if (event.request.destination === 'document') {
              return caches.match('/offline.html'); // Ensure you have an offline.html
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
    );
  } else if (url.origin.startsWith('https://api.octave.gold')) {
    // API requests: Use Network-First strategy
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Optionally cache API responses
          return networkResponse;
        })
        .catch(() => {
          // Optionally serve from cache if available
          return caches.match(event.request);
        })
    );
  } else {
    // Other requests: Default to Network-First
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
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// MESSAGE
self.addEventListener('message', (event) => {
  // Example: Skip waiting when receiving a specific message
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
