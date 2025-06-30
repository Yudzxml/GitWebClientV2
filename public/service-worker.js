const CACHE_NAME = 'yudzxml-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/cart.html',
  '/testimoni.html',
  '/promo.html',
  '/komentar.html',
  '/contact.html',
  '/visitor.html',
  '/donasi.html',
  '/tools.html',
  '/service.html',
  '/style.css',
  '/audio.css',
  '/main.js',
  '/audio.js',
  '/visitor.js',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/a8d49388.png',
  'https://raw.githubusercontent.com/Yudzxml/UploaderV2/refs/heads/main/tmp/6aadc292.png',
  'https://raw.githubusercontent.com/Yudzxml/UploaderV2/refs/heads/main/tmp/lagu.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});