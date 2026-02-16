const CACHE_NAME = 'ruifang-app-v6'; // 🌟 版本號大升級，強制洗牌

// 🌟 乾淨路徑，包含 ?v=3
const urlsToCache = [
  './',
  'index.html',
  'style.css?v=3',
  'app.js?v=3',
  'manifest.json'
];

self.addEventListener('install', event => {
  // 強制讓新的 SW 立即接管
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  // 啟動時立刻接管所有頁面，並刪除不是 v6 的舊快取
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 網路優先，若斷網才讀快取 (確保隨時抓到最新版)
      return fetch(event.request).catch(() => response);
    })
  );
});
