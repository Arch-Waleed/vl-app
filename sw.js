const CACHE_NAME = 'german-app-v3';
const urlsToCache = [
  '/vl-app/',
  '/vl-app/index.html',
  '/vl-app/style.css',
  '/vl-app/app.js',
  '/vl-app/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
