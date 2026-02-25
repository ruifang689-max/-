// js/main.js (v724) - 終極按鈕修復版
window.rfApp = {
    ui: {}, theme: {}, nav: {}, fav: {}, tour: {}, 
    map: {}, search: {}, custom: {}, pwa: {}, tts: {}, weather: {}
};

import { events } from './core/events.js'; 
import { initErrorHandler, showToast } from './modules/toast.js';
import { state } from './core/store.js'; 
import { initMap } from './core/map.js'; 
import { initWeather } from './modules/weather.js'; 
import { initGPS } from './modules/gps.js'; 
import { initAnnouncer } from './modules/announcer.js'; 
import { initCardGestures, closeCard } from './modules/cards.js';
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

// ==========================================
// 🌟 1. 核心功能全域開放
// ==========================================
window.closeCard = closeCard;

// 🟢 切換底圖功能
let currentLayerIndex = 0;
const layerTypes = ['standard', 'satellite', 'topo', 'history'];
window.toggleLayer = function() {
    currentLayerIndex = (currentLayerIndex + 1) % layerTypes.length;
    const nextLayer = layerTypes[currentLayerIndex];
    
    if (window.rfApp.map && typeof window.rfApp.map.switchBaseLayer === 'function') {
        window.rfApp.map.switchBaseLayer(nextLayer);
        const layerNames = { 'standard': '標準地圖', 'satellite': '衛星影像', 'topo': '地形圖', 'history': '歷史濾鏡' };
        if (typeof showToast === 'function') showToast(`已切換至: ${layerNames[nextLayer]}`, 'info');
    } else {
        if (typeof showToast === 'function') showToast('地圖尚未準備好', 'warning');
    }
};

// 🟢 切換天氣中樞功能
window.toggleDashboard = function() {
    if (window.rfApp.weather && typeof window.rfApp.weather.toggleDashboard === 'function') {
        window.rfApp.weather.toggleDashboard();
    } else {
        if (typeof showToast === 'function') showToast('天氣模組連線中，請稍後', 'warning');
    }
};

// 🟢 景點分類過濾
window.filterSpots = (category, btnElement) => {
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    else {
        const allChip = document.querySelector('#category-chips .chip[onclick*="all"]');
        if (allChip) allChip.classList.add('active');
    }
    if (window.rfApp.map && window.rfApp.map.filterMarkers) {
        window.rfApp.map.filterMarkers(category);
    }
};

// 🟢 進入地圖
window.enterMap = function() {
    const intro = document.getElementById('welcome-screen');
    const app = document.getElementById('app');
    if (intro && app) {
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.style.display = 'none';
            app.style.display = 'block';
            if (state.mapInstance) state.mapInstance.invalidateSize();
            events.emit('app_ready', null);
        }, 500);
    }
};

// ==========================================
// 🌟 2. 強制綁定 HTML 按鈕 (無視 onclick 找不到的問題)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 綁定右上角天氣小方塊
    const weatherBtn = document.getElementById('weather-box');
    if (weatherBtn) {
        weatherBtn.style.cursor = 'pointer';
        weatherBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleDashboard();
        });
    }

    // 綁定右下角切換地圖按鈕
    const layerBtn = document.getElementById('layer-btn');
    if (layerBtn) {
        layerBtn.style.cursor = 'pointer';
        layerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.toggleLayer();
        });
    }
});

// ==========================================
// 🌟 3. 系統啟動流程
// ==========================================
function removeSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) { 
        setTimeout(() => { 
            splash.style.opacity = '0'; 
            setTimeout(() => { splash.style.display = 'none'; }, 500); 
        }, 2000);
    }
}

function safeInit(fn, name) {
    try { fn(); } catch (e) { console.error(`模組 ${name} 失敗:`, e); }
}

function bootstrapApp() {
    initErrorHandler();
    safeInit(initTheme, 'Theme');
    safeInit(initPWA, 'PWA');
    safeInit(initTour, 'Tour');
    safeInit(initFavorites, 'Fav');
    safeInit(initUI, 'UI');
    safeInit(initFirebase, 'Firebase');

    initMap().then(() => {
        safeInit(initGPS, 'GPS');
        safeInit(initAnnouncer, 'Announcer');
        safeInit(initCardGestures, 'Gestures');
        safeInit(initSearch, 'Search');
        safeInit(initNavigation, 'Nav');
        safeInit(initCustomSpots, 'CustomSpot');
        safeInit(initTTS, 'TTS');
        safeInit(initNearby, 'Nearby');
    });
    
    safeInit(initWeather, 'Weather');
    removeSplashScreen(); 
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
}
