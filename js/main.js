// js/main.js (v692) - 命名空間安全初始化版
window.rfApp = window.rfApp || {};
const modules = ['ui', 'theme', 'nav', 'fav', 'tour', 'map', 'search', 'custom', 'pwa', 'tts', 'cards', 'dashboard'];
modules.forEach(key => {
    window.rfApp[key] = window.rfApp[key] || {};
});

import { events } from './core/events.js?v=651'; 
import { initErrorHandler, showToast } from './modules/toast.js?v=651';
import { state } from './core/store.js?v=651'; 
import { initMap } from './core/map.js?v=670'; 
import { fetchWeather } from './modules/weather.js?v=690'; 
import { initGPS } from './modules/gps.js?v=670'; 
import { initAnnouncer } from './modules/announcer.js?v=659'; 
import { initCardGestures, closeCard } from './modules/cards.js?v=683'; 
import { renderAllMarkers, filterSpots } from './modules/markers.js?v=672';
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

window.rfApp.map.switchBaseLayer('satellite');
window.rfApp.map.toggleTransitLayer(true);
window.rfApp.ui.closeCard = closeCard;
window.closeCard = window.rfApp.ui.closeCard;

// 確保函數是定義在最外層 (不要包在其他 function 裡面)
function enterMap() {
    const intro = document.getElementById('intro-screen');
    const app = document.getElementById('app');
    
    if (intro && app) {
        // 進入地圖的動畫邏輯
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.style.display = 'none';
            app.style.display = 'block';
            
            // 確保地圖尺寸正確 (避免破圖)
            if (state.mapInstance) {
                state.mapInstance.invalidateSize();
            }
        }, 500);
    }
}

// ✅ 【關鍵修正】把這個函數暴露給 HTML 使用
window.enterMap = enterMap;

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
        safeInit(renderAllMarkers, '圖釘渲染');
        safeInit(initSearch, '搜尋系統');
        safeInit(initNavigation, '導航系統');
        safeInit(initCustomSpots, '自訂秘境');
        safeInit(initTTS, '語音導覽模組');
        safeInit(initNearby, '周邊雷達');
    }).catch(e => {
        console.error("地圖啟動失敗", e);
        if (typeof showToast === 'function') showToast("地圖核心啟動失敗，請重新整理頁面", "error");
    });
    
    fetchWeather();
    removeSplashScreen();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
