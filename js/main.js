// js/main.js - 系統總司令 (v407)

import { state } from './core/store.js';
import { initMap, toggleLayer } from './core/map.js'; // 🌟 現在 map.js 已經有 export 了，這行不會報錯了！
import { fetchWeather } from './modules/weather.js';
import { initGPS } from './modules/gps.js';
import { initAnnouncer } from './modules/announcer.js';
import { initCardGestures, closeCard } from './modules/cards.js';
import { renderAllMarkers } from './modules/markers.js';
import { initSearch } from './modules/search.js';
import { initNavigation } from './modules/navigation.js';
import { initUI } from './modules/ui.js';

// 全域綁定給 HTML onClick 使用
window.toggleLayer = toggleLayer;
window.closeCard = closeCard;

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

// 系統啟動主程式
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
        removeSplashScreen(); 
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
