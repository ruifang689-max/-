// js/main.js - 系統總司令 (v400)

import { state } from './core/store.js';
import { initMap } from './core/map.js';
import { fetchWeather } from './modules/weather.js';
import { initGPS } from './modules/gps.js';
import { initAnnouncer } from './modules/announcer.js';
import { initCardGestures, closeCard } from './modules/cards.js';
import { renderAllMarkers } from './modules/markers.js';
import { initSearch } from './modules/search.js';
import { initNavigation } from './modules/navigation.js';
import { initUI } from './modules/ui.js';

// 🌟 1. 絕對執行：開場動畫解除邏輯
function removeSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const welcome = document.getElementById('welcome-screen');
    const tutorial = document.getElementById('tutorial-overlay');
    const skipIntro = localStorage.getItem('ruifang_skip_intro') === 'true';

    // 檢查略過開關狀態
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
        }, 2000); // 2秒後自動淡出
    }
}

// 🌟 2. 系統啟動主程式
function bootstrapApp() {
    try {
        // 依序啟動所有模組
        initMap();
        initGPS();
        initAnnouncer();
        initCardGestures();
        renderAllMarkers();
        initSearch();
        initNavigation();
        initUI();
        fetchWeather();
        
        // 確保模組載入完畢後移除開場動畫
        removeSplashScreen();
    } catch (error) {
        console.error("❌ 系統啟動失敗，請檢查模組：", error);
        // 就算報錯，也要把開場動畫拿掉，才看得到哪裡壞了
        removeSplashScreen(); 
    }
}

// 🌟 3. 解決 ES6 模組時機問題
// 如果網頁已經載入完畢，直接執行；如果還沒，就等 DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}

// 🌟 4. 全域綁定區 (重要：讓 HTML 的 onclick 可以呼叫)
window.closeCard = closeCard;
// 如果您在 ui.js 等模組中有寫 window.openSettings = ...，它們會在這裡生效

// ... 放在 main.js 檔案最下方 ...
window.closeCard = closeCard;
window.closeCustomSpotModal = closeCustomSpotModal;
window.confirmCustomSpot = confirmCustomSpot;

// 🌟 新增這行：將清空按鈕功能綁定到全域
window.clearSearchInput = clearSearchInput;
