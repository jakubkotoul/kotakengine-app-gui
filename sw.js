importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA6eh8N7PAe3nE7jCaJyO_g6JgihBLA-sw",
    authDomain: "kotakengine-apk-gui.firebaseapp.com",
    databaseURL: "https://kotakengine-apk-gui-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "kotakengine-apk-gui",
    storageBucket: "kotakengine-apk-gui.firebasestorage.app",
    messagingSenderId: "1022545988426",
    appId: "1:1022545988426:web:bc2f53f04066f306564fb3"
});

const messaging = firebase.messaging();

// Zpracování push zprávy na pozadí (když je aplikace zavřená / telefon zamknutý)
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification ? payload.notification.title : 'KotakEngine';
    const notificationOptions = {
        body: payload.notification ? payload.notification.body : 'Nové oznámení',
        icon: 'logo.png',
        badge: 'logo.png',
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Kliknutí na notifikaci otevře aplikaci
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('./index.html')
    );
});

const CACHE_NAME = 'kotakengine-v7';
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