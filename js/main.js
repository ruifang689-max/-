// js/main.js (純淨無快取干擾版)
window.rfApp = {
    ui: {}, theme: {}, nav: {}, fav: {}, tour: {}, 
    map: {}, search: {}, custom: {}, pwa: {}, tts: {}
};

// 🌟 絕對不能加上任何 ?v=xxx，否則模組會互相衝突！
// (已移除舊的 contextEngine 匯入)
import { initRouteBuilder } from './modules/routeBuilder.js';
import { events } from './core/events.js'; 
import { initErrorHandler, showToast } from './modules/toast.js';
import { state } from './core/store.js'; 
import { fetchSpotsFromSheet } from './data/spots.js';
import { initMap, toggleLayer } from './core/map.js'; 
import { initDashboard } from './modules/hub/controller.js'; // 🌟 新總部
import { initGPS } from './modules/gps.js';
import { initAnnouncer } from './modules/announcer.js'; 
import { initCardGestures, showCard, closeCard, openCardByName } from './modules/cards.js';
import { renderAllMarkers, filterSpots } from './modules/markers.js';
import { initSearch } from './modules/search.js';
import { initNavigation } from './modules/navigation.js';
import { initUI } from './modules/ui.js'; 
import { initFirebase } from './modules/firebase-sync.js';
import { initTheme } from './modules/theme.js'; 
import { initPWA } from './modules/pwa.js';
import { initTour } from './modules/tour.js';
import { initFavorites } from './modules/favorites.js';
import { initCustomSpots } from './modules/customSpots.js'; 
import { initTTS } from './modules/tts.js';
import { initNearby } from './modules/nearby.js';

window.rfApp.map.toggleLayer = toggleLayer;
window.rfApp.ui.closeCard = closeCard;
window.rfApp.ui.openCardByName = openCardByName;
window.toggleLayer = window.rfApp.map.toggleLayer;
window.closeCard = window.rfApp.ui.closeCard;

function removeSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) { 
        setTimeout(() => { 
            splash.style.opacity = '0'; 
            setTimeout(() => { 
                splash.style.display = 'none'; 
                if (state.mapInstance) state.mapInstance.invalidateSize(); 
                events.emit('app_ready', null);
            }, 500); 
        }, 2000);
    } else {
        events.emit('app_ready', null);
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
    events.on('app_ready', () => {
        if (spotName && window.rfApp.search && typeof window.rfApp.search.triggerSearch === 'function') {
            window.rfApp.search.triggerSearch(spotName);
        }
    });
}

async function bootstrapApp() {
    initErrorHandler();
    
    safeInit(initTheme, '主題與語系');
    safeInit(initPWA, 'PWA 系統');
    safeInit(initTour, '導覽教學');
    safeInit(initFavorites, '收藏夾');
    safeInit(initUI, '基礎 UI 介面');
    safeInit(initFirebase, 'Firebase 雲端同步');
    safeInit(handleDeepLink, 'URL路由解析');

    await fetchSpotsFromSheet();

    initMap().then(() => {
        safeInit(initGPS, 'GPS定位');
        safeInit(initAnnouncer, '報幕系統');
        safeInit(initCardGestures, '卡片手勢');
        safeInit(renderAllMarkers, '圖釘渲染');
        safeInit(initSearch, '搜尋系統');
        safeInit(initNavigation, '導航系統');
        safeInit(initRouteBuilder, '自訂路線規劃');
        safeInit(initCustomSpots, '自訂秘境');
        safeInit(initTTS, '語音導覽模組');
        safeInit(initNearby, '周邊雷達');
        
        // 🌟 舊的 initContextEngine 已經被移除
        // 🌟 啟動新的資訊中樞總部！
        safeInit(initDashboard, '資訊中樞模組');
        
    }).catch(e => {
        console.error("地圖啟動失敗", e);
        if (typeof showToast === 'function') showToast("地圖核心啟動失敗，請重新整理頁面", "error");
    });
    
    // 🌟 舊的 fetchWeather() 已經被移除，改由 Dashboard 內部自動處理
    removeSplashScreen(); 
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
