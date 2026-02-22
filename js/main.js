// js/main.js (加入搜尋與過濾功能版)
import { initMap } from './core/map.js';
import { initTheme } from './modules/theme.js';
import { initCardGestures } from './modules/cards.js';
import { initSearch } from './modules/search.js'; // 🌟 引入搜尋模組
import { state } from './core/store.js';

function enterMap() {
    const intro = document.getElementById('welcome-screen');
    const app = document.getElementById('app');
    
    if (intro && app) {
        intro.style.opacity = '0';
        intro.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            intro.style.display = 'none';
            app.style.display = 'block';
            if (state.mapInstance) state.mapInstance.invalidateSize();
        }, 500);
    } else {
        console.error("找不到 welcome-screen 或 app 元素");
    }
}

async function initApp() {
    console.log("🚀 應用程式啟動中...");
    
    initTheme();
    await initMap();
    initCardGestures();
    
    // 🌟 啟動搜尋功能
    initSearch();

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => { state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
            (err) => console.log("無法取得位置", err), { enableHighAccuracy: true }
        );
    }
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

// 🌟 全域：點擊標籤分類時觸發 (UI 切換 + 通知地圖過濾)
window.filterSpots = (category, btnElement) => {
    // 1. 切換按鈕的視覺狀態 (藍色背景)
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    } else {
        // 若沒有傳入按鈕，預設亮起「全部」
        const allChip = document.querySelector('#category-chips .chip[onclick*="all"]');
        if (allChip) allChip.classList.add('active');
    }

    // 2. 呼叫地圖模組進行標記過濾
    if (window.rfApp.map && typeof window.rfApp.map.filterMarkers === 'function') {
        window.rfApp.map.filterMarkers(category);
        // 過濾後自動關閉搜尋建議框
        if (typeof window.rfApp.search?.closeSuggest === 'function') {
            window.rfApp.search.closeSuggest();
        }
    }
};

window.enterMap = enterMap;
window.rfApp = window.rfApp || {};
document.addEventListener('DOMContentLoaded', initApp);
