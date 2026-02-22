// js/main.js (v705) - 最終整合版
import { initMap } from './core/map.js';
import { initTheme } from './modules/theme.js';
import { initCardGestures } from './modules/cards.js';
import { state } from './core/store.js';

// 🌟 1. 定義進入地圖的函數
function enterMap() {
    const intro = document.getElementById('intro-screen');
    const app = document.getElementById('app');
    
    if (intro && app) {
        // 淡出動畫
        intro.style.opacity = '0';
        intro.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            intro.style.display = 'none';
            app.style.display = 'block';
            
            // 修正地圖尺寸 (防止破圖)
            if (state.mapInstance) {
                state.mapInstance.invalidateSize();
            }
        }, 500);
    } else {
        console.error("找不到 intro-screen 或 app 元素，請檢查 HTML ID");
    }
}

// 🌟 2. 應用程式初始化
async function initApp() {
    console.log("🚀 應用程式啟動中...");
    
    // 初始化主題與翻譯 (必須最先執行)
    initTheme();
    
    // 初始化地圖
    await initMap();
    
    // 初始化卡片手勢 (拖曳關閉)
    initCardGestures();

    // 取得使用者位置 (選用功能)
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                console.log("📍 已取得使用者位置");
            },
            (err) => console.log("無法取得位置", err),
            { enableHighAccuracy: true }
        );
    }
    
    // 移除載入動畫 (如果有的話)
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

// 🌟 3. 全域掛載 (解決 HTML onclick 找不到函數的問題)
window.enterMap = enterMap;
window.rfApp = window.rfApp || {}; // 確保全域物件存在

// 🌟 4. 啟動！
document.addEventListener('DOMContentLoaded', initApp);
