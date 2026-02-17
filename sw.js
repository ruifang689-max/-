const CACHE_NAME = 'ruifang-app-v400'; // 🌟 版本號更新

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

// ... (下方的 install, activate, fetch 邏輯完全不用動) ...
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => { if(key !== CACHE_NAME) return caches.delete(key); }))));
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
