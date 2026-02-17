const CACHE_NAME = 'ruifang-app-v103'; 

self.addEventListener('install', event => {
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
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

self.addEventListener('fetch', event => {
  // 🌟 關鍵修復：如果是外部 API (天氣、OpenStreetMap、維基百科)，直接放行，絕對不攔截！
  if (!event.request.url.startsWith(self.location.origin)) {
    return; 
  }

  // 內部檔案則採用「網路優先，失敗才讀快取」策略
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
