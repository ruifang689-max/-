const CACHE_NAME = 'ruifang-app-v594'; // 🌟 版本號更新

const urlsToCache = [
  './',
  'index.html',
  'style.css?v=400',
  'js/main.js?v=400', // 🌟 確認是抓 js 資料夾
  // ... 其他模組 js ...
  'manifest.json',
  'icon/icon-192.png', // 🌟 加上 icon/ 
  'icon/icon-512.png'  // 🌟 加上 icon/
];

// 🌟 sw.js - 終極快取清除版 (殺死所有舊快取)
self.addEventListener('install', (e) => { 
    self.skipWaiting(); // 強制立即接管
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            // 毫不留情地刪除所有快取
            return Promise.all(keyList.map((key) => caches.delete(key)));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // 永遠從網路抓取最新檔案，絕對不使用舊快取
    e.respondWith(fetch(e.request));
});
