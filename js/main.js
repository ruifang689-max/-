// js/main.js (v662) - 終極效能打磨版
window.rfApp = {
    ui: {}, theme: {}, nav: {}, fav: {}, tour: {}, 
    map: {}, search: {}, custom: {}, pwa: {}, tts: {}
};

import { events } from './core/events.js?v=651'; // 🌟 引入事件匯流排
import { initErrorHandler, showToast } from './modules/toast.js?v=651';
import { state } from './core/store.js?v=651'; 
import { fetchSpotsFromSheet } from './data/spots.js?v=663';
import { initMap, toggleLayer } from './core/map.js?v=651'; 
import { fetchWeather } from './modules/weather.js?v=662'; // 更新 v662
import { initGPS } from './modules/gps.js?v=662'; // 更新 v662
import { initAnnouncer } from './modules/announcer.js?v=659'; 
import { initCardGestures, closeCard } from './modules/cards.js?v=661';
import { renderAllMarkers, filterSpots } from './modules/markers.js?v=651';
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

window.rfApp.map.toggleLayer = toggleLayer;
window.rfApp.ui.closeCard = closeCard;
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
                
                // 🌟 發送「App 已完全就緒」廣播
                events.emit('app_ready', null);
            }, 500); 
        }, 2000);
    } else {
        // 若沒有開場動畫，直接廣播
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

// 🌟 拔除 1500ms 的魔法數字，改用事件驅動！
// 🌟 整合 DeepLink 解析與「自動啟動 GPS」功能
// 🌟 整合 DeepLink 解析 (取消自動 GPS 定位)
function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const spotName = params.get('spot'); 
    
    // 監聽 App 就緒事件
    events.on('app_ready', () => {
        if (spotName) {
            // 如果網址有帶景點名稱，優先搜尋該景點並飛過去
            if (window.rfApp.search && typeof window.rfApp.search.triggerSearch === 'function') {
                window.rfApp.search.triggerSearch(spotName);
            }
        }
        // 🌟 已經將自動呼叫 window.goToUser() 的邏輯移除！
        // 現在地圖會乖乖停在預設的瑞芳火車站，直到使用者主動點擊右下角的「標靶」按鈕。
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

    // 🌟 先註冊 DeepLink 監聽器
    safeInit(handleDeepLink, 'URL路由解析');

    // 🌟 【新增】等待 Google Sheets 資料載入完成
    if (typeof showToast === 'function') showToast("🔄 同步雲端景點資料中...", "info");
    await fetchSpotsFromSheet();

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
    removeSplashScreen(); // 這裡執行完畢會觸發 app_ready
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
