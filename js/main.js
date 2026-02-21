// js/main.js (v620)
// 🌟 1. 建立企業級全域命名空間 (Namespace 工具箱)
window.rfApp = {
    ui: {},
    theme: {},
    nav: {},
    fav: {},
    tour: {},
    map: {},
    search: {},
    custom: {},
    pwa: {}
};

import { state } from './core/store.js?v=620'; 
import { initMap, toggleLayer } from './core/map.js?v=620'; 
import { fetchWeather } from './modules/weather.js?v=620';
import { initGPS } from './modules/gps.js?v=620';
import { initAnnouncer } from './modules/announcer.js?v=620'; 
import { initCardGestures, closeCard } from './modules/cards.js?v=620';
import { renderAllMarkers } from './modules/markers.js?v=620';
import { initSearch } from './modules/search.js?v=620';
import { initNavigation } from './modules/navigation.js?v=620';
import { initUI } from './modules/ui.js?v=620'; 
import { initFirebase } from './modules/firebase-sync.js?v=620';
import { initTheme } from './modules/theme.js?v=620'; 
import { initPWA } from './modules/pwa.js?v=620';
import { initTour } from './modules/tour.js?v=620';
import { initFavorites } from './modules/favorites.js?v=620';
import { initCustomSpots } from './modules/customSpots.js?v=620'; 

// 將核心方法收納進工具箱，並建立向下相容橋樑
window.rfApp.map.toggleLayer = toggleLayer;
window.rfApp.ui.closeCard = closeCard;
window.toggleLayer = window.rfApp.map.toggleLayer;
window.closeCard = window.rfApp.ui.closeCard;

// 🌟 開場動畫移除邏輯
function removeSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const welcome = document.getElementById('welcome-screen');
    const tutorial = document.getElementById('tutorial-overlay');
    const skipIntro = localStorage.getItem('ruifang_skip_intro') === 'true';

    const skipToggle = document.getElementById('skip-intro-toggle');
    if (skipToggle) skipToggle.checked = skipIntro;

    if (skipIntro) { 
        if (splash) splash.style.display = 'none'; 
        if (welcome) welcome.style.display = 'none'; 
        if (tutorial) tutorial.style.display = 'none';
        if (state.mapInstance) state.mapInstance.invalidateSize(); 
    } else {
        setTimeout(() => { 
            if (splash) { 
                splash.style.opacity = '0'; 
                setTimeout(() => { 
                    splash.style.display = 'none'; 
                    if (state.mapInstance) state.mapInstance.invalidateSize(); 
                }, 500); 
            } 
        }, 2000);
    }
}

// 🌟 核心防護罩：單一模組報錯，不會讓整個 App 癱瘓
function safeInit(fn, name) {
    try { 
        fn(); 
    } catch (e) { 
        console.error(`❌ [防護機制] 模組 ${name} 啟動失敗:`, e); 
    }
}

// 🌟 路由偵探 (Deep Linking)：處理 ?spot=名稱 邏輯
function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const spotName = params.get('spot'); 
    
    if (spotName) {
        console.log(`🔗 偵測到深層連結：${spotName}`);
        // 延遲執行，確保地圖與圖釘都渲染完成，且動畫已結束
        setTimeout(() => {
            if (window.rfApp.search && typeof window.rfApp.search.triggerSearch === 'function') {
                window.rfApp.search.triggerSearch(spotName);
            }
        }, 1500); 
    }
}

// 🌟 重新編排的最佳化啟動順序
function bootstrapApp() {
    // 第一階段：基礎系統
    safeInit(initTheme, '主題與語系');
    safeInit(initPWA, 'PWA 系統');
    safeInit(initTour, '導覽教學');
    safeInit(initFavorites, '收藏夾');
    safeInit(initUI, '基礎 UI 介面');
    safeInit(initFirebase, 'Firebase 雲端同步');

    // 第二階段：地圖載入 (非同步)
    initMap().then(() => {
        // 第三階段：地圖相關功能
        safeInit(initGPS, 'GPS定位');
        safeInit(initAnnouncer, '報幕系統');
        safeInit(initCardGestures, '卡片手勢');
        safeInit(renderAllMarkers, '圖釘渲染');
        safeInit(initSearch, '搜尋系統');
        safeInit(initNavigation, '導航系統');
        safeInit(initCustomSpots, '自訂秘境');
        
        // 🌟 最後：執行路由偵探，檢查是否有深層連結目的地
        safeInit(handleDeepLink, 'URL路由解析');
    }).catch(e => console.error("地圖啟動失敗", e));
    
    // 獨立執行
    fetchWeather();
    removeSplashScreen();
}

// 單一入口啟動
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
