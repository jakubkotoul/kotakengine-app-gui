const CACHE_NAME = 'kotakengine-cache-v1';
const ASSETS = [
  'index.html',
  'app.html',
  'logo.png',
  'manifest.json'
];

// Instalace Service Workeru a uložení statických souborů do cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Aktivace a vyčištění staré cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
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
});

// Síťové požadavky
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Pokud se jedná o kontrolu údržby, VŽDY taháme data přímo ze sítě (ne z cache)
  if (url.pathname.includes('maintenance.json')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Pro ostatní věci (styly, loga, html) použijeme cache, pokud jsme offline
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
