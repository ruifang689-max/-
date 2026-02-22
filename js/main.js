// js/main.js (v660) - 企業級架構穩定版
// 🌟 1. 建立企業級全域命名空間 (工具箱)
window.rfApp = {
    ui: {},
    theme: {},
    nav: {},
    fav: {},
    tour: {},
    map: {},
    search: {},
    custom: {},
    pwa: {},
    tts: {}
};

import { initErrorHandler, showToast } from './modules/toast.js?v=660';
import { state } from './core/store.js?v=660'; 
import { initMap, toggleLayer } from './core/map.js?v=660'; 
import { fetchWeather } from './modules/weather.js?v=660';
import { initGPS } from './modules/gps.js?v=660';
import { initAnnouncer } from './modules/announcer.js?v=660'; 
import { initCardGestures, closeCard } from './modules/cards.js?v=660';
import { renderAllMarkers, filterSpots } from './modules/markers.js?v=660';
import { initSearch } from './modules/search.js?v=660';
import { initNavigation } from './modules/navigation.js?v=660';
import { initUI } from './modules/ui.js?v=660'; 
import { initFirebase } from './modules/firebase-sync.js?v=660';
import { initTheme } from './modules/theme.js?v=660'; 
import { initPWA } from './modules/pwa.js?v=660';
import { initTour } from './modules/tour.js?v=660';
import { initFavorites } from './modules/favorites.js?v=660';
import { initCustomSpots } from './modules/customSpots.js?v=660'; 
import { initTTS } from './modules/tts.js?v=660';
import { initNearby } from './modules/nearby.js?v=660';

// 🌟 2. 建立命名空間橋樑
window.rfApp.map.toggleLayer = toggleLayer;
window.rfApp.ui.closeCard = closeCard;
window.toggleLayer = window.rfApp.map.toggleLayer;
window.closeCard = window.rfApp.ui.closeCard;

// 🌟 3. UI 移除邏輯 (僅負責視覺效果)
function removeSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) { 
        setTimeout(() => { 
            splash.style.opacity = '0'; 
            setTimeout(() => { 
                splash.style.display = 'none'; 
                // 確保地圖尺寸在動畫結束後正確刷新
                if (state.mapInstance) state.mapInstance.invalidateSize(); 
            }, 500); 
        }, 2000);
    }
} // <--- 剛才這裡少了一個 }，現在已補上

// 🛡️ 核心防護機制
function safeInit(fn, name) {
    try { 
        fn(); 
    } catch (e) { 
        console.error(`❌ [防護機制] 模組 ${name} 啟動失敗:`, e);
        if (typeof showToast === 'function') {
            showToast(`模組 [${name}] 載入失敗 ⚠️`, 'error');
        }
    }
}

// 🔗 路由偵探：處理 ?spot=名稱 邏輯
function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const spotName = params.get('spot'); 
    if (spotName) {
        setTimeout(() => {
            if (window.rfApp.search && typeof window.rfApp.search.triggerSearch === 'function') {
                window.rfApp.search.triggerSearch(spotName);
            }
        }, 1500); 
    }
}

// 🚀 重新編排的啟動順序
function bootstrapApp() {
    // 第零階段：啟動全域報錯監聽
    initErrorHandler();
    
    // 🛡️ 第一階段：基礎系統與主題 (不依賴地圖)
    safeInit(initTheme, '主題與語系');
    safeInit(initPWA, 'PWA 系統');
    safeInit(initTour, '導覽教學');
    safeInit(initFavorites, '收藏夾');
    safeInit(initUI, '基礎 UI 介面');
    safeInit(initFirebase, 'Firebase 雲端同步');

    // 第二階段：地圖載入 (非同步)
    initMap().then(() => {
        // 第三階段：地圖相關增強功能
        safeInit(initGPS, 'GPS定位');
        safeInit(initAnnouncer, '報幕系統');
        safeInit(initCardGestures, '卡片手勢');
        safeInit(renderAllMarkers, '圖釘渲染');
        safeInit(initSearch, '搜尋系統');
        safeInit(initNavigation, '導航系統');
        safeInit(initCustomSpots, '自訂秘境');
        safeInit(initTTS, '語音導覽模組');
        safeInit(initNearby, '周邊雷達'); // 🌟 成功啟動事件監聽器
        
        // 最終階段：執行深層連結解析
        safeInit(handleDeepLink, 'URL路由解析');
    }).catch(e => {
        console.error("地圖啟動失敗", e);
        if (typeof showToast === 'function') showToast("地圖核心啟動失敗，請重新整理頁面", "error");
    });
    
    // 獨立 UI 任務
    fetchWeather();
    removeSplashScreen();
}

// 啟動入口
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
