const CACHE_NAME = 'kotakengine-cache-v1';

// Seznam všech souborů z tvého repozitáře, které chceme uložit pro offline použití
const urlsToCache = [
  '/',
  '/index.html',
  '/app.html',
  '/icon-512.png',
  '/logo.png',
  '/maintenance.json',
  '/manifest.json'
];

// Instalace Service Workeru a uložení souborů do cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Otevřena cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Zachytávání requestů - pokud je soubor v cache, načte se odtud, jinak z internetu
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Nalezeno v cache
        }
        return fetch(event.request); // Načtení ze sítě
      })
  );
});

// Aktualizace Service Workeru a smazání staré cache
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
