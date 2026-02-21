// js/main.js (v607)
// 🌟 載入核心與原始模組
import { state } from './core/store.js?v=611';
import { initMap, toggleLayer } from './core/map.js?v=607';
import { fetchWeather } from './modules/weather.js?v=607';
import { initGPS } from './modules/gps.js?v=607';
import { initAnnouncer } from './modules/announcer.js?v=607';
import { initCardGestures, closeCard } from './modules/cards.js?v=607';
import { renderAllMarkers } from './modules/markers.js?v=607';
import { initSearch } from './modules/search.js?v=607';
import { initNavigation } from './modules/navigation.js?v=607';
import { initUI } from './modules/ui.js?v=607';
import { initFirebase } from './modules/firebase-sync.js?v=607';

// 🌟 載入全新拆分的 5 大模組
import { initTheme } from './modules/theme.js?v=607';
import { initPWA } from './modules/pwa.js?v=607';
import { initTour } from './modules/tour.js?v=607';
import { initFavorites } from './modules/favorites.js?v=607';
import { initCustomSpots } from './modules/customSpots.js?v=607';

// 將需要跨檔案呼叫的方法綁定到 window 上
window.toggleLayer = toggleLayer;
window.closeCard = closeCard;

// 保留您原本的開場動畫移除邏輯
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
                setTimeout(() => { splash.style.display = 'none'; if (state.mapInstance) state.mapInstance.invalidateSize(); }, 500); 
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

// 🌟 重新編排的最佳化啟動順序
function bootstrapApp() {
    // 第一階段：初始化與畫面無關的系統與基礎 UI
    safeInit(initTheme, '主題與語系');
    safeInit(initPWA, 'PWA 系統');
    safeInit(initTour, '導覽教學');
    safeInit(initFavorites, '收藏夾');
    safeInit(initUI, '基礎 UI 介面');
    safeInit(initFirebase, 'Firebase 雲端同步');

    // 第二階段：初始化地圖引擎 (這最重要)
    safeInit(initMap, '地圖引擎');

    // 第三階段：初始化依賴地圖的附屬功能
    safeInit(initGPS, 'GPS定位');
    safeInit(initAnnouncer, '報幕系統');
    safeInit(initCardGestures, '卡片手勢');
    safeInit(renderAllMarkers, '圖釘渲染');
    safeInit(initSearch, '搜尋系統');
    safeInit(initNavigation, '導航系統');
    safeInit(initCustomSpots, '自訂秘境'); // 確保地圖建立後再綁定長按事件
    
    // 獨立執行
    fetchWeather();
    removeSplashScreen();
}

// 🌟 解決重複執行的 Bug：只使用單一入口啟動
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
