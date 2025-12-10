//   Service Worker for YOLMOV PWA
// ⚠️ CACHE_VERSION: Manuel olarak güncelle (sadece önemli değişikliklerde)
const CACHE_VERSION = 'v1.0.9';
const CACHE_NAME = `yolmov-cache-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// URLs that should NEVER be cached (always fetch from network)
const NO_CACHE_PATTERNS = [
  'supabase.co',          // Supabase API - auth, database, etc.
  '/auth/',               // Auth endpoints
  '/rest/v1/',            // REST API endpoints
  '/realtime/',           // Realtime WebSocket
  'googleapis.com',       // Google APIs
  '/api/',                // Any API endpoints
  'ipify.org',            // IP detection service
  '/assets/index-',       // 🔥 Main JS bundle - HİÇBİR ZAMAN CACHE'LEME!
  '/assets/',             // 🔥 Tüm assets klasörü - her build yeni hash'ler
  '.js'                   // 🔥 Tüm JavaScript dosyaları - network only!
];

// Pattern for assets that should use network-first strategy
const NETWORK_FIRST_PATTERNS = [
  '.html',                // HTML files
  '/'                     // Root path
];

// Assets to cache immediately on install
// Note: External CDN URLs should NOT be cached here (CORS issues)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 🔥 Message handler - SKIP_WAITING komutu
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] SKIP_WAITING received - activating immediately');
    self.skipWaiting();
  }
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome extensions
  if (url.startsWith('chrome-extension://')) return;

  // 🔥 NEVER cache API requests & JavaScript - always go to network
  const shouldSkipCache = NO_CACHE_PATTERNS.some(pattern => url.includes(pattern));
  
  if (shouldSkipCache) {
    // Network only - NO CACHING!
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.error('[Service Worker] Network request failed:', url, err);
        // JS dosyaları için offline page gösterme - hata mesajı ver
        if (url.includes('.js')) {
          return new Response('console.error("Failed to load module:", "' + url + '")', {
            status: 503,
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Network-first for critical assets (HTML only now - JS excluded)
  // Also include navigation requests (browser page loads)
  const useNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => url.includes(pattern)) || event.request.mode === 'navigate';
  
  if (useNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache if not valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone and cache HTML only
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Fallback to cache on network error
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] Network failed, serving cached HTML:', url);
              return cachedResponse;
            }
            // Show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache-first for other assets (images, fonts, CSS)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return a fallback response for other requests
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for offline requests (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  // This will be implemented when backend API is ready
  console.log('[Service Worker] Syncing pending requests...');
  return Promise.resolve();
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Yolmov Bildirimi';
  const options = {
    body: data.body || 'Yeni bir güncelleme var!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: false,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Message handler for cache updates from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
