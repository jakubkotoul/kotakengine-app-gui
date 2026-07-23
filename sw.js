const CACHE_NAME = 'kotakengine-cache-v2';

// Soubory a externí knihovny pro offline chod
const urlsToCache = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
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

  // Maintenance a Firebase chceme tahat vždy ze sítě (network-first nebo network-only)
  if (requestUrl.pathname.includes('maintenance.json') || requestUrl.hostname.includes('firebase')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Cache-first pro zbytek aplikace (HTML, obrázky, JS knihovny)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Dynamické cachování dalších souborů, pokud jsou potřeba
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
