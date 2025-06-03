const CACHE_NAME = 'volunteerhub-pwa-v1';
const urlsToCache = [
  '/',
  '/login.mobile.html',
  '/signup.mobile.html',
  '/dashboard.mobile.html',
  '/community.mobile.html',
  '/print.mobile.html',
  '/settings.mobile.html',
  '/dashboard-theme.css',
  '/dashboard-theme.js',
  '/logo192.png',
  '/logo512.png'
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
