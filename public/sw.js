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
      // If cache.addAll fails here, it's because one of the CORE_ASSETS
      // could not be fetched (e.g., 404 Not Found, 500 Server Error, network issue).
      // Ensure '/' and '/sw.js' are served correctly by your web server.
      return cache.addAll(CORE_ASSETS);
    }).catch(error => {
      // Add specific error logging for debugging the addAll failure
      console.error('[Service Worker] Failed to cache core assets during install:', error);
      // Optionally prevent activation if core assets fail? Or try again?
      // For now, we let it fail, which prevents the SW from installing.
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

  if (url.origin === self.location.origin) {
    // 1) serve from cache first if it’s a static asset
    if (
      // Match common static asset extensions
      url.pathname.match(/\.(css|js|json|woff|woff2|png|jpg|jpeg|svg|gif|webp|ico)$/i) ||
      // Match specific static asset paths like /images/
      url.pathname.startsWith('/images/')
    ) {
      event.respondWith(cacheFirst(event.request));
    } else {
      // 2) fallback to a network-first approach for HTML pages or other dynamic local resources
      event.respondWith(networkFirst(event.request));
    }
  } else {
    // Handle external requests (like APIs)
    if (url.origin.includes('api.octave.gold')) {
      // Network-first is often suitable for APIs to get fresh data
      event.respondWith(networkFirst(event.request));
    } else {
      // For other external domains, you might just want to fetch directly
      // or apply a cache strategy if appropriate (e.g., caching external fonts/images)
      // Using networkFirst as a fallback here. Consider if cacheFirst makes sense for some.
      event.respondWith(networkFirst(event.request));
      // Alternatively, just fetch:
      // return fetch(event.request);
    }
  }
});

// Network-first strategy: Try network, cache result, fallback to cache on network failure.
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Check if the response is valid (e.g., not a 4xx or 5xx error that you don't want to cache)
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Cache a clone of the successful response
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache for:', request.url, error);
    // Network failed, try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }
    // Optional: If it's a navigation request and cache fails, serve an offline page
    if (request.mode === 'navigate') { // 'navigate' indicates a page request
        const offlinePage = await caches.match('/offline.html'); // Make sure '/offline.html' is in CORE_ASSETS if you use this
        if (offlinePage) return offlinePage;
    }
    // If nothing works, return a generic offline response
    console.error('[Service Worker] Network and cache failed for:', request.url);
    return new Response('Network error: You are offline', {
      status: 408, // Request Timeout
      statusText: 'Network error: You are offline',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Cache-first strategy: Serve from cache if available, otherwise fetch from network and cache.
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // console.log('[Service Worker] Serving static asset from cache:', request.url);
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    // Check if the response is valid before caching
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Failed to fetch static asset:', request.url, error);
    // Optionally return a placeholder or error response for failed static assets
    return new Response('Failed to load asset', {
        status: 500,
        statusText: 'Failed to load asset',
        headers: { 'Content-Type': 'text/plain' }
    });
  }
}


// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  if (event.data) {
    try {
        const payload = event.data.json();
        console.log('[Service Worker] Push data payload:', payload);
        const title = payload.title || 'New Notification';
        const options = {
          body: payload.body || '',
          icon: payload.icon || '/images/android-chrome-192x192.png', // Default icon
          badge: payload.badge || '/images/android-chrome-192x192.png', // Default badge
          data: payload.data || {}, // Ensure data exists
        };
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
        console.error('[Service Worker] Error processing push data:', e);
        // Fallback for non-JSON data or errors
        const title = 'New Notification';
        const options = {
            body: event.data.text(), // Show raw text if JSON fails
            icon: '/images/android-chrome-192x192.png',
            badge: '/images/android-chrome-192x192.png',
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
  } else {
    console.log('[Service Worker] Push event but no data');
  }
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  console.log('[Service Worker] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open at the target URL
      for (const client of clientList) {
        // Check URL and path carefully
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin); // Ensure targetUrl is absolute
        if (clientUrl.href === targetUrl.href && 'focus' in client) {
           console.log('[Service Worker] Found matching client, focusing.');
           return client.focus();
        }
      }
      // If no matching window found, open a new one
      if (clients.openWindow) {
        console.log('[Service Worker] No matching client found, opening new window.');
        return clients.openWindow(urlToOpen);
      } else {
        console.log('[Service Worker] clients.openWindow is not supported.');
      }
    })
  );
});

// FileSystem Access API (Simple example route you could adjust):
// Note: This won't run server code – the SW must rely on indexDB or Cache for offline.
// If you want to store on the actual disk, you’d do so in the client code with `window.showSaveFilePicker`.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SAVE_FILE') {
    console.log('[Service Worker] Received message (SAVE_FILE):', event.data.fileName);
    // Actual file saving logic needs to be triggered from the client page
    // using the File System Access API. The SW can't directly save to disk.
  }

  // Listener for SKIP_WAITING message from the page
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message, activating new SW.');
    self.skipWaiting();
  }
});