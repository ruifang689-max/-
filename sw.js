// 🌟 升級版本號到 v5，觸發舊快取刪除機制
const CACHE_NAME = 'ruifang-app-v5'; 

// 🌟 更新快取名單，補上 ?v=2
const urlsToCache = [
  './index.html',
  'style.css?v=2',
  'app.js?v=2',
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

// 啟動時自動清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 清除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
