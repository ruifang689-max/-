// js/modules/gps.js (v635) - 羅盤體驗與細節修復版
import { state } from '../core/store.js';

let watchId = null;
let userMarker = null;
let compassCircle = null;
let currentHeading = 0; 
let isCompassActive = false;

// 🌟 九大區域地理中心座標 (用來計算最近地區)
const ruifangRegions = [
    { name: "瑞芳市區", lat: 25.107, lng: 121.806 },
    { name: "九份", lat: 25.109, lng: 121.844 },
    { name: "金瓜石", lat: 25.107, lng: 121.859 },
    { name: "猴硐", lat: 25.086, lng: 121.826 },
    { name: "深澳", lat: 25.129, lng: 121.820 },
    { name: "水湳洞", lat: 25.121, lng: 121.864 },
    { name: "四腳亭", lat: 25.102, lng: 121.762 },
    { name: "三貂嶺", lat: 25.059, lng: 121.824 },
    { name: "鼻頭角", lat: 25.119, lng: 121.918 }
];

// 計算最近的地區
function getNearestRegion(lat, lng) {
    let nearest = "瑞芳區";
    let minDist = Infinity;
    ruifangRegions.forEach(r => {
        // 簡單歐式距離計算
        const d = Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2);
        if (d < minDist) { minDist = d; nearest = r.name; }
    });
    return nearest;
}

// 🌟 動態注入 CSS
const injectCompassCSS = () => {
    if (document.getElementById('gps-compass-style')) return;
    const style = document.createElement('style');
    style.id = 'gps-compass-style';
    style.innerHTML = `
        .gps-marker-wrap { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        .gps-core { width: 16px; height: 16px; background-color: var(--primary); border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 3; position: relative; }
        .gps-radar { position: absolute; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
        .gps-radar::before, .gps-radar::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 20px; height: 20px;
            background-color: var(--primary); border-radius: 50%;
            transform: translate(-50%, -50%) scale(1); opacity: 0;
            animation: radar-wave 2.5s infinite linear;
        }
        .gps-radar::after { animation-delay: 1.25s; }
        @keyframes radar-wave {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
        }
        
        /* 🌟 修復羅盤延遲：移除過長的 transition，讓它完全跟手同步 */
        .gps-arrow-container { position: absolute; top: 0; left: 0; width: 60px; height: 60px; z-index: 2; transition: transform 0.05s linear; }
        
        /* 🌟 縮小扇形開合角度 (變窄 5~8度) */
        .gps-arrow-container::before { 
            content: ''; position: absolute; bottom: 50%; left: 50%; transform: translateX(-50%);
            width: 50px; /* 從 70px 縮小為 50px */
            height: 55px; /* 稍微拉長一點點 */
            background: radial-gradient(circle at 50% 100%, var(--primary) 0%, transparent 80%);
            clip-path: polygon(50% 100%, 15% 0, 85% 0); /* 裁切得更尖銳 */
            opacity: 0.85; filter: drop-shadow(0 -2px 4px rgba(0, 123, 255, 0.4));
        }
    `;
    document.head.appendChild(style);
};

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
        iconAnchor: [30, 30] 
    });
};

const requestCompassPermission = () => {
    if (isCompassActive) return;
    
    // 取得手機橫放/直放的角度補償
    const getScreenOrientation = () => window.orientation || screen.orientation?.angle || 0;

    const handleOrientation = (e) => {
        let heading = 0;
        const screenOrient = getScreenOrientation();

        if (e.webkitCompassHeading !== undefined) { 
            heading = e.webkitCompassHeading; // iOS 原生羅盤 (精準度極高)
        } 
        else if (e.alpha !== null) { 
            heading = 360 - e.alpha; // Android 電子羅盤換算
        }

        // 🌟 修正：補上螢幕旋轉的角度，解決手機橫拿時的不同步問題
        heading += screenOrient;
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

    // 🌟 監聽地圖拖曳，離開定位時隱藏精度
    let isUserPanning = false;
    if (state.mapInstance) {
        state.mapInstance.on('dragstart', () => { isUserPanning = true; });
        state.mapInstance.on('movestart', () => { 
            const addrText = document.getElementById('addr-text');
            if (addrText && isUserPanning) addrText.textContent = `隨處逛逛中...`;
        });
    }

    window.rfApp.map.goToUser = () => {
        if (!navigator.geolocation) {
            if (typeof window.showToast === 'function') window.showToast('您的裝置不支援定位功能', 'error');
            return;
        }
        
        isUserPanning = false; // 按下定位鈕，視為鎖定跟隨
        requestCompassPermission();
        
        const btnIcon = document.querySelector('.control-btn.active .fa-location-crosshairs');
        if (btnIcon) btnIcon.classList.add('fa-spin');
        if (typeof window.showToast === 'function' && !userMarker) { window.showToast('🛰️ GPS 衛星連線中...', 'info'); }
        
        if (watchId) navigator.geolocation.clearWatch(watchId);

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                state.userLocation = { lat, lng };

                // 🌟 修復 GPS 座標顯示
                const gpsValText = document.getElementById('gps-val-text');
                if (gpsValText) gpsValText.textContent = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

                if (!userMarker) {
                    userMarker = L.marker([lat, lng], { icon: createCompassIcon(), zIndexOffset: 1000 }).addTo(state.mapInstance);
                    
                    // 🌟 圓形範圍線：將框線加深、加粗
                    compassCircle = L.circle([lat, lng], { 
                        radius: accuracy, 
                        color: 'rgba(100, 100, 100, 0.65)', // 深灰框線
                        fillColor: 'var(--primary)', 
                        fillOpacity: 0.05, 
                        weight: 1.5
                    }).addTo(state.mapInstance);
                    
                    state.mapInstance.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
                    if (typeof window.showToast === 'function') window.showToast('✅ 定位成功！實境羅盤已啟動', 'success');
                } else {
                    userMarker.setLatLng([lat, lng]);
                    compassCircle.setLatLng([lat, lng]);
                    compassCircle.setRadius(accuracy);
                    if (!isUserPanning) state.mapInstance.panTo([lat, lng]); 
                }
                if (btnIcon) btnIcon.classList.remove('fa-spin');
                
                // 🌟 結合地區與定位精度顯示 (僅在鎖定跟隨時顯示)
                if (!isUserPanning) {
                    const nearestRegion = getNearestRegion(lat, lng);
                    const addrText = document.getElementById('addr-text');
                    if (addrText) addrText.textContent = `你在: ${nearestRegion} | 精度: ±${Math.round(accuracy)}m`;
                }
            },
            (err) => {
                console.warn('GPS 錯誤:', err);
                if (btnIcon) btnIcon.classList.remove('fa-spin');
                if (typeof window.showToast === 'function') window.showToast('無法取得定位，請確認已開啟 GPS', 'error');
            },
            // 🌟 退回原本的 5000 毫秒快取設定
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 } 
        );
    };

    window.rfApp.map.resetNorth = () => {
        if (state.mapInstance) {
            state.mapInstance.flyTo(state.mapInstance.getCenter(), state.mapInstance.getZoom(), { animate: true });
            if (typeof window.showToast === 'function') window.showToast('地圖視角已重置', 'info');
        }
    };

    // 向下相容
    window.goToUser = window.rfApp.map.goToUser;
    window.resetNorth = window.rfApp.map.resetNorth;
}
