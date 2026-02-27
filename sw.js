// sw.js (v663) - 修復異步 Clone 錯誤版

const CACHE_VERSION = 'v663';
const STATIC_CACHE = `rf-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `rf-dynamic-${CACHE_VERSION}`;
const MAP_CACHE = `rf-map-${CACHE_VERSION}`;

const CORE_ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './js/main.js'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS))
    );
});

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

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // 🗺️ 策略 1：地圖圖磚 -> Cache First
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

    // 📡 策略 2：外部 API -> Network First
    if (url.hostname.includes('openweathermap.org') || url.hostname.includes('bigdatacloud.net') || url.hostname.includes('project-osrm.org')) {
        e.respondWith(
            fetch(e.request).then(res => {
                const resClone = res.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(e.request, resClone));
                return res;
            }).catch(() => {
                return caches.match(e.request);
            })
        );
        return;
    }

    // 💻 策略 3：本地靜態檔案 -> Stale-While-Revalidate
    if (url.origin === location.origin) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                const fetchPromise = fetch(e.request).then(res => {
                    // 🌟 關鍵修復：必須在呼叫 caches.open 之前，立即同步 Clone！
                    const resClone = res.clone(); 
                    caches.open(STATIC_CACHE).then(cache => cache.put(e.request, resClone));
                    return res;
                }).catch(() => {});
                
                return cached || fetchPromise; 
            })
        );
        return;
    }
});
