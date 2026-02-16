const CACHE_NAME = 'ruifang-app-v4'; // 更新版本號

// 嚴格列出檔案，將 app.js 納入快取
const urlsToCache = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 PWA 快取更新完成');
      return cache.addAll(urlsToCache);
    }).catch(err => console.error('快取失敗', err))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// 啟動時自動清除舊版快取，避免吃手機容量
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
