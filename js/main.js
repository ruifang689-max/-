// js/main.js - 系統總司令 (v405)

import { state } from './core/store.js';
import { initMap, toggleLayer } from './core/map.js';
import { fetchWeather } from './modules/weather.js';
import { initGPS } from './modules/gps.js';
import { initAnnouncer } from './modules/announcer.js';
import { initCardGestures, closeCard } from './modules/cards.js';
import { renderAllMarkers } from './modules/markers.js';
import { initSearch } from './modules/search.js';
import { initNavigation } from './modules/navigation.js';
import { initUI } from './modules/ui.js';

// 🌟 全域綁定 (只綁定從模組明確 import 進來的核心功能)
window.toggleLayer = toggleLayer;
window.closeCard = closeCard;
// 注意：其他如 search, openSettings 等功能，皆已在各模組的 init() 中自動掛載，無須在此重複宣告。

// 開場動畫解除邏輯
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

// 系統啟動主程式 (加入防崩潰機制)
function bootstrapApp() {
    try {
        initMap();
        initGPS();
        initAnnouncer();
        initCardGestures();
        renderAllMarkers();
        initSearch();
        initNavigation();
        initUI();
        
        fetchWeather();
        removeSplashScreen();
    } catch (error) {
        console.error("❌ 系統啟動失敗，請檢查模組：", error);
        removeSplashScreen(); // 就算報錯也要關閉動畫，以利除錯
    }
}

// 解決 ES6 模組時機問題
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
