const CACHE_NAME = 'ruifang-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
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
