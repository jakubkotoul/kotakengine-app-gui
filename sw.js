// Kliknutí na notifikaci otevře aplikaci
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('./index.html')
    );
});

const CACHE_NAME = 'kotakengine-v8';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './balance.html',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('balance.html')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(`
        <html>
          <head><meta charset="UTF-8"><title>Offline</title></head>
          <body style="background:#090d16; color:#ef4444; font-family:sans-serif; text-align:center; padding-top:40vh; margin:0;">
            <h3 style="font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Chybí připojení k internetu</h3>
            <p style="font-size: 13px; color: #64748b; margin-top: 5px;">Tato sekce nelze v offline režimu načíst.</p>
          </body>
        </html>
      `, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then((res) => {
      return caches.open(CACHE_NAME).then((cache) => { cache.put(event.request, res.clone()); return res; });
    }).catch(() => caches.match(event.request))
  );
});