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

// 🌟 暴露給 HTML onClick 使用
window.toggleLayer = toggleLayer;
window.closeCard = closeCard;

// 系統啟動
window.addEventListener('load', () => {
    initMap();
    initGPS();
    initAnnouncer();
    initCardGestures();
    renderAllMarkers();
    initSearch();
    initNavigation();
    initUI();
    
    fetchWeather();
    
    // (載入開場動畫關閉邏輯...)
    const splash = document.getElementById('splash-screen');
    setTimeout(() => { if(splash) { splash.style.opacity = '0'; setTimeout(() => { splash.style.display = 'none'; state.mapInstance.invalidateSize(); }, 500); } }, 2500);
});
