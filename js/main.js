// js/main.js (v713) - 旗艦融合版 (事件驅動 + 資訊中樞 + 浮水印地圖)
window.rfApp = {
    ui: {}, theme: {}, nav: {}, fav: {}, tour: {}, 
    map: {}, search: {}, custom: {}, pwa: {}, tts: {}, weather: {}
};

import { events } from './core/events.js?v=651'; // 🌟 引入事件匯流排
import { initErrorHandler, showToast } from './modules/toast.js?v=651';
import { state } from './core/store.js?v=651'; 
import { initMap } from './core/map.js?v=651'; 
import { initWeather } from './modules/weather.js?v=710'; // 🌟 更新為資訊中樞的 init
import { initGPS } from './modules/gps.js?v=662'; 
import { initAnnouncer } from './modules/announcer.js?v=659'; 
import { initCardGestures, closeCard } from './modules/cards.js?v=661';
import { initSearch } from './modules/search.js?v=661';
import { initNavigation } from './modules/navigation.js?v=651';
import { initUI } from './modules/ui.js?v=661'; 
import { initFirebase } from './modules/firebase-sync.js?v=651';
import { initTheme } from './modules/theme.js?v=656'; 
import { initPWA } from './modules/pwa.js?v=657';
import { initTour } from './modules/tour.js?v=651';
import { initFavorites } from './modules/favorites.js?v=657';
import { initCustomSpots } from './modules/customSpots.js?v=657'; 
import { initTTS } from './modules/tts.js?v=657';
import { initNearby } from './modules/nearby.js?v=651';
// 注意：移除了 markers.js 的依賴，因為圖釘渲染與過濾已完美整合進 map.js (v711)

// ==========================================
// 🌟 全域函數與 UI 綁定 (解決所有 undefined 錯誤)
// ==========================================
window.closeCard = closeCard;

// 1. 懸浮按鈕：循環切換底圖 (取代舊的 toggleLayer)
let currentLayerIndex = 0;
const layerTypes = ['standard', 'satellite', 'topo', 'history'];
window.toggleLayer = () => {
    currentLayerIndex = (currentLayerIndex + 1) % layerTypes.length;
    const nextLayer = layerTypes[currentLayerIndex];
    if (window.rfApp && window.rfApp.map && window.rfApp.map.switchBaseLayer) {
        window.rfApp.map.switchBaseLayer(nextLayer);
        if (typeof showToast === 'function') {
            const layerNames = { 'standard': '標準地圖', 'satellite': '衛星影像', 'topo': '地形圖', 'history': '歷史濾鏡' };
            showToast(`已切換至: ${layerNames[nextLayer]}`, 'info');
        }
    }
};

// 2. 標籤分類過濾 (點擊 美食、歷史 等按鈕)
window.filterSpots = (category, btnElement) => {
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    } else {
        const allChip = document.querySelector('#category-chips .chip[onclick*="all"]');
        if (allChip) allChip.classList.add('active');
    }
    if (window.rfApp.map && typeof window.rfApp.map.filterMarkers === 'function') {
        window.rfApp.map.filterMarkers(category);
        if (typeof window.rfApp.search?.closeSuggest === 'function') window.rfApp.search.closeSuggest();
    }
};

// 3. 進入地圖 (Welcome Screen 點擊觸發)
window.enterMap = function() {
    const intro = document.getElementById('welcome-screen');
    const app = document.getElementById('app');
    
    if (intro && app) {
        intro.style.opacity = '0';
        intro.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            intro.style.display = 'none';
            app.style.display = 'block';
            if (state.mapInstance) state.mapInstance.invalidateSize();
            // 🌟 進入地圖後發送就緒廣播
            events.emit('app_ready', null);
        }, 500);
    } else {
        events.emit('app_ready', null);
    }
};

// ==========================================
// 🌟 核心啟動流程
// ==========================================
function removeSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) { 
        setTimeout(() => { 
            splash.style.opacity = '0'; 
            setTimeout(() => { 
                splash.style.display = 'none'; 
                // 若設定跳過 Welcome，這裡也可以直接發送廣播
                if(document.getElementById('welcome-screen')?.style.display === 'none') {
                    events.emit('app_ready', null);
                }
            }, 500); 
        }, 2000);
    }
}

function safeInit(fn, name) {
    try { 
        fn(); 
    } catch (e) { 
        console.error(`❌ [防護機制] 模組 ${name} 啟動失敗:`, e);
        if (typeof showToast === 'function') { showToast(`模組 [${name}] 載入失敗 ⚠️`, 'error'); }
    }
}

function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const spotName = params.get('spot'); 
    
    if (spotName) {
        events.on('app_ready', () => {
            if (window.rfApp.search && typeof window.rfApp.search.triggerSearch === 'function') {
                window.rfApp.search.triggerSearch(spotName);
            }
        });
    }
}

function bootstrapApp() {
    initErrorHandler();
    
    safeInit(initTheme, '主題與語系');
    safeInit(initPWA, 'PWA 系統');
    safeInit(initTour, '導覽教學');
    safeInit(initFavorites, '收藏夾');
    safeInit(initUI, '基礎 UI 介面');
    safeInit(initFirebase, 'Firebase 雲端同步');

    safeInit(handleDeepLink, 'URL路由解析');

    initMap().then(() => {
        safeInit(initGPS, 'GPS定位');
        safeInit(initAnnouncer, '報幕系統');
        safeInit(initCardGestures, '卡片手勢');
        safeInit(initSearch, '搜尋系統');
        safeInit(initNavigation, '導航系統');
        safeInit(initCustomSpots, '自訂秘境');
        safeInit(initTTS, '語音導覽模組');
        safeInit(initNearby, '周邊雷達');
    }).catch(e => {
        console.error("地圖啟動失敗", e);
        if (typeof showToast === 'function') showToast("地圖核心啟動失敗，請重新整理頁面", "error");
    });
    
    safeInit(initWeather, '資訊中樞(天氣)'); // 啟動最新版的資訊看板
    removeSplashScreen(); 
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
