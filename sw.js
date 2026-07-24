const CACHE_NAME = 'kotakengine-cache-v4';

// Používáme relativní cesty pro správné fungování na GitHub Pages
const urlsToCache = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './maintenance.json', 
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Firebase taháme vždy rovnou ze sítě, nic necachujeme
  if (requestUrl.hostname.includes('firebase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ÚDRŽBA: Systém Network-First, aby na pozadí stále tahal aktuální data, 
  // ale při výpadku vrátil offline zálohu.
  if (requestUrl.pathname.includes('maintenance.json')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./maintenance.json', responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          return caches.match('./maintenance.json');
        })
    );
    return;
  }

  // Ostatní soubory: Cache-First
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
