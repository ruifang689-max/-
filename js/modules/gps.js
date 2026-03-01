// js/modules/gps.js (v662) - 終極省電與效能優化版
import { state } from '../core/store.js';
import { events } from '../core/events.js?v=651'; 

let watchId = null;
let userMarker = null;
let compassCircle = null;
let currentHeading = 0; 
let lastRawHeading = 0;
let totalRotation = 0;
let isCompassActive = false;
let isFollowing = false; 

const injectCompassCSS = () => {
    if (document.getElementById('gps-compass-style')) return;
    const style = document.createElement('style');
    style.id = 'gps-compass-style';
    style.innerHTML = `
        .gps-marker-wrap { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        .gps-core { width: 16px; height: 16px; background-color: var(--primary); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px var(--primary); z-index: 3; position: relative; }
        .gps-radar { position: absolute; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
        .gps-radar::before, .gps-radar::after { content: ''; position: absolute; top: 50%; left: 50%; width: 20px; height: 20px; background-color: var(--primary); border-radius: 50%; transform: translate(-50%, -50%) scale(1); opacity: 0; animation: radar-wave 2.5s infinite linear; }
        .gps-radar::after { animation-delay: 1.25s; }
        @keyframes radar-wave { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; } 100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; } }
        .gps-arrow-container { position: absolute; top: 0; left: 0; width: 60px; height: 60px; z-index: 2; transition: transform 0.1s ease-out; }
        .gps-arrow-container::before { content: ''; position: absolute; bottom: 50%; left: 50%; transform: translateX(-50%); width: 58px; height: 58px; background: radial-gradient(circle at 50% 100%, var(--primary) 10%, transparent 85%); clip-path: polygon(50% 100%, 12% 0, 88% 0); opacity: 0.8; filter: drop-shadow(0 -2px 4px var(--primary)); animation: beam-breath 3s infinite ease-in-out; }
        @keyframes beam-breath { 0%, 100% { transform: translateX(-50%) scaleY(1); opacity: 0.7; } 50% { transform: translateX(-50%) scaleY(1.1); opacity: 0.9; } }
    `;
    document.head.appendChild(style);
};

const createCompassIcon = () => {
    return L.divIcon({ className: 'custom-compass-icon', html: `<div class="gps-marker-wrap"><div class="gps-radar"></div><div class="gps-arrow-container" id="real-time-arrow" style="transform: rotate(${currentHeading}deg);"></div><div class="gps-core"></div></div>`, iconSize: [60, 60], iconAnchor: [30, 30] });
};

// 🌟 將運算邏輯提升至模組層級，方便隨時註銷
const getScreenOrientation = () => window.orientation || screen.orientation?.angle || 0;
const handleOrientation = (e) => {
    let heading = 0; const screenOrient = getScreenOrientation();
    if (e.webkitCompassHeading !== undefined) { heading = e.webkitCompassHeading; } else if (e.alpha !== null) { heading = 360 - e.alpha; }
    let delta = heading - lastRawHeading;
    if (delta > 180) delta -= 360; else if (delta < -180) delta += 360; 
    totalRotation += delta; lastRawHeading = heading; currentHeading = totalRotation + screenOrient;
    const arrowEl = document.getElementById('real-time-arrow');
    if (arrowEl) { arrowEl.style.transform = `rotate(${currentHeading}deg)`; }
};

const startCompass = () => {
    if (isCompassActive) return;
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(p => { if (p === 'granted') { window.addEventListener('deviceorientation', handleOrientation, true); isCompassActive = true; } }).catch(err => console.log(err));
    } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true); window.addEventListener('deviceorientation', handleOrientation, true); isCompassActive = true;
    }
};

// 🌟 全新：徹底釋放陀螺儀資源的函數
const stopCompass = () => {
    if (!isCompassActive) return;
    window.removeEventListener('deviceorientation', handleOrientation, true);
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    isCompassActive = false;
};

export function initGPS() {
    injectCompassCSS();

    if (state.mapInstance) {
        state.mapInstance.on('dragstart', () => {
            if (isFollowing) {
                isFollowing = false;
                const gpsBtn = document.querySelector('.control-btn[onclick*="goToUser"]');
                if (gpsBtn) gpsBtn.classList.remove('active');
                
                // 🌟 當使用者手動滑動地圖時，停止背景陀螺儀運算 (省電！)
                stopCompass();

                if(typeof window.showToast === 'function') {
                    const msg = window.rfApp.t ? window.rfApp.t('toast_gps_follow_stop') : '已停止位置跟隨';
                    window.showToast(msg, 'info');
                }
            }
        });
    }

    // ========================================================
    // 🌟 核心修改 1：網頁一載入，就直接在背景要求 GPS 權限並默默監聽位置
    // ========================================================
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                state.userLocation = { lat, lng };

                const gpsValText = document.getElementById('gps-val-text');
                if (gpsValText) gpsValText.textContent = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

                if (!userMarker) {
                    // 建立自身位置圖釘，但因為 isFollowing 初始為 false，所以【不會】改變地圖視角
                    userMarker = L.marker([lat, lng], { icon: createCompassIcon(), zIndexOffset: 1000 }).addTo(state.mapInstance);
                    compassCircle = L.circle([lat, lng], { radius: accuracy, color: 'var(--primary)', opacity: 0.4, fillColor: 'var(--primary)', fillOpacity: 0.08, weight: 1 }).addTo(state.mapInstance);
                } else {
                    // 更新圖釘位置
                    userMarker.setLatLng([lat, lng]);
                    compassCircle.setLatLng([lat, lng]);
                    compassCircle.setRadius(accuracy);
                    
                    // 只有當使用者點擊過按鈕 (isFollowing = true) 時，才會讓地圖跟隨
                    if (isFollowing) { state.mapInstance.panTo([lat, lng]); }
                }
                
                // 停止按鈕的讀取動畫 (如果有的話)
                const gpsBtn = document.querySelector('.control-btn[onclick*="goToUser"]');
                const btnIcon = gpsBtn ? gpsBtn.querySelector('i') : null;
                if (btnIcon && btnIcon.classList.contains('fa-spin')) {
                    btnIcon.classList.remove('fa-spin');
                }

                events.emit('location_update', { lat, lng, accuracy, isFollowing, timestamp: Date.now() });
            },
            (err) => {
                console.warn("背景獲取 GPS 失敗或使用者未授權:", err);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 } 
        );
    }

    // ========================================================
    // 🌟 核心修改 2：點擊定位按鈕時，只需將畫面切換至已知的座標，不用重新要求權限
    // ========================================================
    window.rfApp.map.goToUser = () => {
        if (!navigator.geolocation) {
            if (typeof window.showToast === 'function') { const msg = window.rfApp.t ? window.rfApp.t('toast_gps_fail') : '您的裝置不支援定位'; window.showToast(msg, 'error'); }
            return;
        }
        
        isFollowing = true; 
        const gpsBtn = document.querySelector('.control-btn[onclick*="goToUser"]');
        if (gpsBtn) gpsBtn.classList.add('active'); 
        
        startCompass(); // 啟動手機羅盤指向
        
        const btnIcon = gpsBtn ? gpsBtn.querySelector('i') : null;
        
        // 如果背景已經成功抓到座標，直接飛過去！
        if (userMarker && state.userLocation) {
            const latlng = userMarker.getLatLng();
            state.mapInstance.flyTo(latlng, 17, { animate: true });
            if (typeof window.showToast === 'function') { const msg = window.rfApp.t ? window.rfApp.t('toast_gps_success') : '✅ 定位成功！'; window.showToast(msg, 'success'); }
        } else {
            // 如果還沒抓到 (可能網路慢或剛給權限)，讓按鈕轉圈圈等待
            if (btnIcon) btnIcon.classList.add('fa-spin');
            if (typeof window.showToast === 'function') { const msg = window.rfApp.t ? window.rfApp.t('toast_gps_connecting') : '🛰️ GPS 衛星連線中...'; window.showToast(msg, 'info'); }
        }
    };

    window.rfApp.map.resetNorth = () => {
        isFollowing = false;
        const gpsBtn = document.querySelector('.control-btn[onclick*="goToUser"]');
        if (gpsBtn) gpsBtn.classList.remove('active');

        stopCompass(); // 🌟 當點擊回到瑞芳時，也停止羅盤省電

        if (state.mapInstance) {
            state.mapInstance.flyTo([25.1086, 121.8058], 15, { animate: true });
            if (typeof window.showToast === 'function') { const msg = window.rfApp.t ? window.rfApp.t('toast_gps_reset') : '已回到瑞芳中心'; window.showToast(msg, 'info'); }
        }
    };

    window.goToUser = window.rfApp.map.goToUser;
    window.resetNorth = window.rfApp.map.resetNorth;
}
