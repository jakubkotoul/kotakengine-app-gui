const CACHE_NAME = 'kotakengine-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './logo.png'
  // Přidej sem další klíčové statické soubory, pokud je potřebuješ
];

// Instalace Service Workeru a uložení základních souborů do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivace a smazání starých cache verzí
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategie: Network First (Sítě napřed, při offlinefallback do cache)
self.addEventListener('fetch', (event) => {
  // Ignorovat požadavky, které nejsou GET (např. rozšíření apod.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Pokud jsme online, odpovíme ze sítě a zároveň si aktualizujeme cache
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Pokud spadne internet, vytáhneme poslední známou verzi z cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback, pokud není k dispozici v cache ani v síti
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});