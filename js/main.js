// js/main.js (v410)
import { initFirebase } from './modules/firebase-sync.js';// 我們剛剛新增的雲端模組
import { state } from './core/store.js';
import { initMap, toggleLayer } from './core/map.js?v=593';
import { fetchWeather } from './modules/weather.js';
import { initGPS } from './modules/gps.js?v=593';
import { initAnnouncer } from './modules/announcer.js?v=593';
import { initCardGestures, closeCard } from './modules/cards.js';
import { renderAllMarkers } from './modules/markers.js';
import { initSearch } from './modules/search.js?v=593';
import { initNavigation } from './modules/navigation.js';
import { initUI } from './modules/ui.js?v=593';

window.toggleLayer = toggleLayer;
window.closeCard = closeCard;

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
    try { fn(); } catch (e) { console.error(`❌ [防護機制] 模組 ${name} 啟動失敗:`, e); }
}

function bootstrapApp() {
    safeInit(initMap, '地圖引擎');
    safeInit(initGPS, 'GPS定位');
    safeInit(initAnnouncer, '報幕系統');
    safeInit(initCardGestures, '卡片手勢');
    safeInit(renderAllMarkers, '圖釘渲染');
    safeInit(initSearch, '搜尋系統');
    safeInit(initNavigation, '導航系統');
    safeInit(initUI, 'UI介面與設定');
    
    // 獨立執行，保證天氣一定會被呼叫
    fetchWeather();
    removeSplashScreen();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderAllMarkers(); // 呼叫正確的名稱
    initUI();
    
    // 🌟 啟動 Firebase 雲端模組
    initFirebase();
});
