const CACHE_NAME = 'ruifang-app-v3'; // 🌟 更新版本號，強迫瀏覽器抓取新版

// 🌟 嚴格列出要快取的檔案，移除容易報錯的 './'
const urlsToCache = [
  './index.html',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('開始快取檔案');
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

// 🌟 啟動時自動清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('清除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
        // 切換到第二步
        function nextTutorial() {
            document.getElementById('tut-step-1').style.display = 'none';
            document.getElementById('tut-step-2').style.display = 'block';
        }

        // 切換回第一步
        function prevTutorial() {
            document.getElementById('tut-step-2').style.display = 'none';
            document.getElementById('tut-step-1').style.display = 'block';
        }

        // 完成教學，關閉介面並正式進入主程式
        function finishTutorial() {
            const overlay = document.getElementById('tutorial-overlay');
            // 加入淡出效果
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                overlay.style.visibility = 'hidden';
                // 這裡可以加入儲存已觀看紀錄的邏輯，連結主程式：
                // localStorage.setItem('ruifang_welcomed', 'true');
                console.log("教學結束，開始使用地圖！");
            }, 400); // 配合 CSS 的 0.4s 過場動畫
        }
