/* eslint-disable no-restricted-globals */
/* 
   Enhanced Service Worker:
   - Offline caching with refined strategies
   - Additional FileSystem Access sample route
   - Basic push notifications
   - 'Cache-first' for static assets, 'network-first' for API
   - Caching audio files
   - Additional logging
*/

// Cache version naming
const CACHE_VERSION = 3; // increment to update the cache
const CACHE_NAME = `octave-cache-v${CACHE_VERSION}`;

// List core assets to cache at install time
const CORE_ASSETS = [
  '/',
  '/sw.js', 
  // If you have an offline fallback page, add it:
  // '/offline.html'
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

  // e.g. if you want to store audio in the SW, remove these lines:
  // but if you want to skip SW for audio, uncomment:
  // if (url.pathname.startsWith('/api/track/')) {
  //   console.log('[Service Worker] Bypassing cache for audio track:', url.href);
  //   return;
  // }

  if (url.origin === self.location.origin) {
    // 1) serve from cache first if it’s a static asset 
    if (
      url.pathname.startsWith('/images/') ||
      url.pathname.match(/\.(css|js|json|woff|woff2|png|jpg|jpeg|svg|gif|webp)$/)
    ) {
      event.respondWith(cacheFirst(event.request));
    } else {
      // 2) fallback to a network-first approach
      event.respondWith(networkFirst(event.request));
    }
  } else {
    // external APIs
    if (url.origin.includes('api.octave.gold')) {
      // Could do a networkFirst approach for API
      event.respondWith(networkFirst(event.request));
    } else {
      // fallback
      event.respondWith(networkFirst(event.request));
    }
  }
});

// networkFirst for dynamic requests
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Cache a copy
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    // If offline, attempt cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    // optionally return offline.html if it’s a doc request
    if (request.destination === 'document') {
      // return await caches.match('/offline.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// cacheFirst for static 
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  const response = await fetch(request);
  // store in cache
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    const title = payload.title || 'New Notification';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/images/android-chrome-192x192.png',
      badge: payload.badge || '/images/android-chrome-192x192.png',
      data: payload.data || {},
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
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

// FileSystem Access API (Simple example route you could adjust):
// Note: This won't run server code – the SW must rely on indexDB or Cache for offline.
// If you want to store on the actual disk, you’d do so in the client code with `window.showSaveFilePicker`.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SAVE_FILE') {
    console.log('[Service Worker] Received file save request:', event.data.fileName);
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});