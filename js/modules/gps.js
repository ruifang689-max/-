// js/modules/gps.js (v632) - 實境羅盤進化版
import { state } from '../core/store.js';

let watchId = null;
let userMarker = null;
let compassCircle = null;
let currentHeading = 0; 
let isCompassActive = false;

// 🌟 動態注入羅盤專用 CSS (自帶雷達波紋與漸層箭頭)
const injectCompassCSS = () => {
    if (document.getElementById('gps-compass-style')) return;
    const style = document.createElement('style');
    style.id = 'gps-compass-style';
    style.innerHTML = `
        .gps-marker-wrap { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        .gps-core { width: 16px; height: 16px; background-color: var(--primary); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.4); z-index: 3; position: relative; }
        .gps-radar { position: absolute; width: 60px; height: 60px; background: radial-gradient(circle, var(--primary) 0%, transparent 60%); opacity: 0.3; border-radius: 50%; animation: pulse 2s infinite; z-index: 1; }
        .gps-arrow-container { position: absolute; top: 0; left: 0; width: 60px; height: 60px; display: flex; align-items: flex-start; justify-content: center; transition: transform 0.15s ease-out; z-index: 2; }
        .gps-arrow-container::before { 
            content: ''; width: 0; height: 0; 
            border-left: 12px solid transparent; border-right: 12px solid transparent; 
            border-bottom: 28px solid rgba(0, 123, 255, 0.6); 
            transform: translateY(-8px); filter: drop-shadow(0 -2px 3px rgba(255,255,255,0.8)); 
        }
        @keyframes pulse { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(1.3); opacity: 0; } }
    `;
    document.head.appendChild(style);
};

// 🌟 建立帶有方向箭頭的自訂圖標
const createCompassIcon = () => {
    return L.divIcon({
        className: 'custom-compass-icon',
        html: `
            <div class="gps-marker-wrap">
                <div class="gps-radar"></div>
                <div class="gps-arrow-container" id="real-time-arrow" style="transform: rotate(${currentHeading}deg);"></div>
                <div class="gps-core"></div>
            </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30] // 將錨點精準對齊中心
    });
};

// 🌟 啟動實境羅盤感測器
const requestCompassPermission = () => {
    if (isCompassActive) return;

    const handleOrientation = (e) => {
        let heading = 0;
        // iOS 系統
        if (e.webkitCompassHeading) {
            heading = e.webkitCompassHeading;
        } 
        // Android 系統
        else if (e.absolute && e.alpha !== null) {
            heading = 360 - e.alpha; 
        }

        currentHeading = heading;
        
        // 即時旋轉地圖上的藍色箭頭
        const arrowEl = document.getElementById('real-time-arrow');
        if (arrowEl) {
            arrowEl.style.transform = `rotate(${heading}deg)`;
        }
    };

    // iOS 13+ 安全性規定：必須由使用者點擊後才能請求權限
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    isCompassActive = true;
                }
            })
            .catch(err => console.log("用戶拒絕或無法取得羅盤權限:", err));
    } else {
        // 非 iOS 13+ 或 Android
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        isCompassActive = true;
    }
};

export function initGPS() {
    injectCompassCSS();

    window.rfApp.map.goToUser = () => {
        if (!navigator.geolocation) {
            if (typeof window.showToast === 'function') window.showToast('您的裝置不支援定位功能', 'error');
            return;
        }

        // 🌟 最關鍵的一步：使用者按下定位按鈕時，同步請求羅盤權限！
        requestCompassPermission();

        const btnIcon = document.querySelector('.control-btn.active .fa-location-crosshairs');
        if (btnIcon) btnIcon.classList.add('fa-spin');
        
        if (typeof window.showToast === 'function' && !userMarker) {
            window.showToast('🛰️ GPS 衛星連線中...', 'info');
        }

        if (watchId) navigator.geolocation.clearWatch(watchId);

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                state.userLocation = { lat, lng };

                if (!userMarker) {
                    // 首次定位
                    userMarker = L.marker([lat, lng], { icon: createCompassIcon(), zIndexOffset: 1000 }).addTo(state.mapInstance);
                    compassCircle = L.circle([lat, lng], { radius: accuracy, color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.15, weight: 1 }).addTo(state.mapInstance);
                    state.mapInstance.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
                    if (typeof window.showToast === 'function') window.showToast('✅ 定位成功！實境羅盤已啟動', 'success');
                } else {
                    // 更新位置
                    userMarker.setLatLng([lat, lng]);
                    compassCircle.setLatLng([lat, lng]);
                    compassCircle.setRadius(accuracy);
                    state.mapInstance.panTo([lat, lng]);
                }

                if (btnIcon) btnIcon.classList.remove('fa-spin');
                
                // 更新右下角地址/精準度資訊
                const addrText = document.getElementById('addr-text');
                if (addrText) addrText.textContent = `定位精準度: ±${Math.round(accuracy)}m`;
            },
            (err) => {
                console.warn('GPS 錯誤:', err);
                if (btnIcon) btnIcon.classList.remove('fa-spin');
                if (typeof window.showToast === 'function') window.showToast('無法取得定位，請確認已開啟 GPS', 'error');
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    };

    window.rfApp.map.resetNorth = () => {
        if (state.mapInstance) {
            state.mapInstance.flyTo(state.mapInstance.getCenter(), state.mapInstance.getZoom(), { animate: true });
            if (typeof window.showToast === 'function') window.showToast('地圖視角已重置', 'info');
        }
    };

    // 🌟 橋接至全域供 HTML onclick 使用
    window.goToUser = window.rfApp.map.goToUser;
    window.resetNorth = window.rfApp.map.resetNorth;
}
