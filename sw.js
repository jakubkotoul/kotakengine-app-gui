const CACHE_NAME = 'kotakengine-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './logo.png'
  // money.html záměrně vynecháváme, aby se necachoval
];

// Instalace Service Workeru
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivace a okamžité převzetí kontroly
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

// Strategie načítání
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // SPECIÁLNÍ PRAVIDLO PRO IFRAME S PENĚZI (zde zadej přesný název tvého souboru)
  if (url.pathname.endsWith('money.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Bez internetu vrátí tuto chybovou hlášku přímo do iframe
          return new Response(`
            <html>
              <head><meta charset="UTF-8"><title>Offline</title></head>
              <body style="background:#111; color:#ff5555; font-family:sans-serif; text-align:center; padding-top:40vh; margin:0;">
                <h3>Chybí připojení k internetu</h3>
                <p style="font-size: 14px; color: #888;">Tato sekce nelze v offline režimu zobrazit.</p>
              </body>
            </html>
          `, {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Zbytek aplikace funguje normálně (přes síť, s fallbackem do cache při offline)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});