const CACHE_NAME = 'ruifang-app-v1';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

// 安裝時快取檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 攔截請求，若斷網則提供快取
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
