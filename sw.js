const CACHE_NAME = 'ruifang-app-v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  // 如果有自訂的圖片或外部 CSS/JS 也可以加在這裡
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
