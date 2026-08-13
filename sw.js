const CACHE_NAME = 'kotakengine-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './balance.html',
  './manifest.json',
  './logo.png'
  // balance.html záměrně necachujeme v assetech, aby se netahal ze staré cache
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

// --- PŘÍJEM A ZOBRAZENÍ PUSH NOTIFIKACÍ ---
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'KotakEngine', body: 'Nové oznámení' };
    
    const options = {
        body: data.body,
        icon: 'logo.png',
        badge: 'logo.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Kliknutí na notifikaci otevře aplikaci
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('./index.html')
    );
});

// Strategie načítání
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // SPECIÁLNÍ PRAVIDLO PRO IFRAME S BALANCE (balance.html)
  if (url.pathname.endsWith('balance.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Bez internetu vrátí tuto chybovou hlášku přímo do iframe
          return new Response(`
            <html>
              <head><meta charset="UTF-8"><title>Offline</title></head>
              <body style="background:#090d16; color:#ef4444; font-family:sans-serif; text-align:center; padding-top:40vh; margin:0;">
                <h3 style="font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Chybí připojení k internetu</h3>
                <p style="font-size: 13px; color: #64748b; margin-top: 5px;">Tato sekce nelze v offline režimu načíst.</p>
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

  // Zbytek aplikace (karty, PWA shell) funguje normálně s fallbackem do cache
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