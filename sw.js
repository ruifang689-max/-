const CACHE_NAME = 'ruifang-app-v300'; // 🌟 版本號更新

const urlsToCache = [
  './',
  'index.html',
  'style.css?v=202', // 樣式表沿用之前的 v=202 即可
  'db_spots.js?v=300', // 🌟 新增
  'db_lang.js?v=300',  // 🌟 新增
  'app.js?v=300',      // 🌟 更新
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
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
