// sw.js (v641) - 企業級動態快取引擎

const CACHE_VERSION = 'v641';
const STATIC_CACHE = `rf-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `rf-dynamic-${CACHE_VERSION}`;
const MAP_CACHE = `rf-map-${CACHE_VERSION}`;

// 核心啟動檔案 (預先快取)
const CORE_ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './js/main.js'
];

// 安裝階段：立刻接管並寫入核心檔案
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS))
    );
});

// 啟動階段：自動清除舊版快取，不留垃圾
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (![STATIC_CACHE, DYNAMIC_CACHE, MAP_CACHE].includes(key)) {
                        console.log('🗑️ 清除舊快取:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 攔截請求階段：智慧分流策略
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // 🗺️ 策略 1：地圖圖磚 (Map Tiles) -> Cache First (快取優先)
    // 效果：只要使用者看過該區域的地圖，就會存起來。下次就算沒網路也能顯示地圖！
    if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('basemaps.cartocdn.com')) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                return cached || fetch(e.request).then(res => {
                    const resClone = res.clone();
                    caches.open(MAP_CACHE).then(cache => cache.put(e.request, resClone));
                    return res;
                });
            })
        );
        return;
    }

    // 📡 策略 2：外部 API (天氣、地址、導航) -> Network First (網路優先)
    // 效果：有網路時永遠抓最新天氣；沒網路時，退回顯示上一次抓取的天氣或地址資料。
    if (url.hostname.includes('openweathermap.org') || url.hostname.includes('bigdatacloud.net') || url.hostname.includes('project-osrm.org')) {
        e.respondWith(
            fetch(e.request).then(res => {
                const resClone = res.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(e.request, resClone));
                return res;
            }).catch(() => {
                // 斷網時，嘗試從快取拿舊資料
                return caches.match(e.request);
            })
        );
        return;
    }

    // 💻 策略 3：本地靜態檔案 (HTML, CSS, JS, 圖片) -> Stale-While-Revalidate (背景更新)
    // 效果：秒速開啟 App (用快取)；同時在背景偷偷下載新版 JS/CSS。下次開啟時自動套用新版！
    if (url.origin === location.origin) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                const fetchPromise = fetch(e.request).then(res => {
                    caches.open(STATIC_CACHE).then(cache => cache.put(e.request, res.clone()));
                    return res;
                }).catch(() => {}); // 離線時忽略錯誤
                
                return cached || fetchPromise; // 有快取先給快取，沒快取才等下載
            })
        );
        return;
    }
});
