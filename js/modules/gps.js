// js/modules/gps.js (v633) - 專業雷達波紋版
import { state } from '../core/store.js';

let watchId = null;
let userMarker = null;
let compassCircle = null;
let currentHeading = 0; 
let isCompassActive = false;

// 🌟 動態注入 CSS：打造專業雷達聲納波紋
const injectCompassCSS = () => {
    if (document.getElementById('gps-compass-style')) return;
    const style = document.createElement('style');
    style.id = 'gps-compass-style';
    style.innerHTML = `
        .gps-marker-wrap { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        
        /* 中心點 */
        .gps-core { width: 16px; height: 16px; background-color: var(--primary); border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 3; position: relative; }
        
        /* 🌟 雷達波紋容器 */
        .gps-radar { position: absolute; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
        
        /* 🌟 利用偽元素製造雙重波紋 */
        .gps-radar::before, .gps-radar::after {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 20px; height: 20px; /* 初始大小 */
            background-color: var(--primary); /* 跟隨主題色 */
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
            animation: radar-wave 2s infinite linear;
        }
        /* 讓第二個波紋延遲發射，製造層次感 */
        .gps-radar::after { animation-delay: 1s; }

        /* 🌟 全新的雷達擴散動畫關鍵影格 */
        @keyframes radar-wave {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; } /* 擴散到 3.5 倍大並消失 */
        }

        /* 方向箭頭 */
        .gps-arrow-container { position: absolute; top: 0; left: 0; width: 60px; height: 60px; display: flex; align-items: flex-start; justify-content: center; transition: transform 0.1s ease-out; z-index: 2; }
        .gps-arrow-container::before { 
            content: ''; width: 0; height: 0; 
            border-left: 12px solid transparent; border-right: 12px solid transparent; 
            border-bottom: 28px solid rgba(0, 123, 255, 0.7); /* 稍微加深顏色 */
            transform: translateY(-10px); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); 
        }
    `;
    document.head.appendChild(style);
};

const createCompassIcon = () => {
    return L.divIcon({
        className: 'custom-compass-icon',
        html: `
            <div class="gps-marker-wrap">
                <div class="gps-radar"></div> <div class="gps-arrow-container" id="real-time-arrow" style="transform: rotate(${currentHeading}deg);"></div>
                <div class="gps-core"></div>
            </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });
};

const requestCompassPermission = () => {
    if (isCompassActive) return;
    const handleOrientation = (e) => {
        let heading = 0;
        if (e.webkitCompassHeading) { heading = e.webkitCompassHeading; } 
        else if (e.absolute && e.alpha !== null) { heading = 360 - e.alpha; }
        currentHeading = heading;
        const arrowEl = document.getElementById('real-time-arrow');
        if (arrowEl) { arrowEl.style.transform = `rotate(${heading}deg)`; }
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(p => { if (p === 'granted') { window.addEventListener('deviceorientation', handleOrientation, true); isCompassActive = true; } })
            .catch(err => console.log("羅盤權限遭拒:", err));
    } else {
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
        requestCompassPermission();
        const btnIcon = document.querySelector('.control-btn.active .fa-location-crosshairs');
        if (btnIcon) btnIcon.classList.add('fa-spin');
        if (typeof window.showToast === 'function' && !userMarker) { window.showToast('🛰️ GPS 衛星連線中...', 'info'); }
        if (watchId) navigator.geolocation.clearWatch(watchId);

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                state.userLocation = { lat, lng };

                if (!userMarker) {
                    userMarker = L.marker([lat, lng], { icon: createCompassIcon(), zIndexOffset: 1000 }).addTo(state.mapInstance);
                    compassCircle = L.circle([lat, lng], { radius: accuracy, color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.08, weight: 1 }).addTo(state.mapInstance);
                    state.mapInstance.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
                    if (typeof window.showToast === 'function') window.showToast('✅ 定位成功！實境羅盤已啟動', 'success');
                } else {
                    userMarker.setLatLng([lat, lng]);
                    compassCircle.setLatLng([lat, lng]);
                    compassCircle.setRadius(accuracy);
                    // 只有在用戶沒有手動拖曳地圖時才自動跟隨，避免干擾操作
                    // state.mapInstance.panTo([lat, lng]); 
                }
                if (btnIcon) btnIcon.classList.remove('fa-spin');
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

    window.goToUser = window.rfApp.map.goToUser;
    window.resetNorth = window.rfApp.map.resetNorth;
}
