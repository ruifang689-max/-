// js/modules/gps.js (v645) - 恢復比例尺旁 GPS 座標顯示
import { state } from '../core/store.js';

let watchId = null;
let userMarker = null;
let compassCircle = null;
let currentHeading = 0; 
let lastRawHeading = 0;
let totalRotation = 0;
let isCompassActive = false;

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
        
        .gps-arrow-container { position: absolute; top: 0; left: 0; width: 60px; height: 60px; z-index: 2; transition: transform 0.1s ease-out; }
        
        .gps-arrow-container::before { 
            content: ''; position: absolute; bottom: 50%; left: 50%; transform: translateX(-50%);
            width: 55px; height: 55px; 
            background: radial-gradient(circle at 50% 100%, var(--primary) 0%, transparent 80%);
            clip-path: polygon(50% 100%, 10% 0, 90% 0);
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
    const getScreenOrientation = () => window.orientation || screen.orientation?.angle || 0;
    const handleOrientation = (e) => {
        let heading = 0;
        const screenOrient = getScreenOrientation();
        if (e.webkitCompassHeading !== undefined) { heading = e.webkitCompassHeading; } 
        else if (e.alpha !== null) { heading = 360 - e.alpha; }

        let delta = heading - lastRawHeading;
        if (delta > 180) delta -= 360;       
        else if (delta < -180) delta += 360; 
        
        totalRotation += delta;      
        lastRawHeading = heading;    

        const finalRotation = totalRotation + screenOrient;
        currentHeading = finalRotation;
        
        const arrowEl = document.getElementById('real-time-arrow');
        if (arrowEl) { arrowEl.style.transform = `rotate(${finalRotation}deg)`; }
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(p => { if (p === 'granted') { window.addEventListener('deviceorientation', handleOrientation, true); isCompassActive = true; } }).catch(err => console.log("羅盤權限遭拒:", err));
    } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        isCompassActive = true;
    }
};

export function initGPS() {
    injectCompassCSS();

    let isUserPanning = false;
    if (state.mapInstance) {
        state.mapInstance.on('dragstart', () => { isUserPanning = true; });
    }

    window.rfApp.map.goToUser = () => {
        if (!navigator.geolocation) {
            if (typeof window.showToast === 'function') window.showToast('您的裝置不支援定位功能', 'error');
            return;
        }
        
        isUserPanning = false; 
        requestCompassPermission();
        
        const btnIcon = document.querySelector('.control-btn.active .fa-location-crosshairs');
        if (btnIcon) btnIcon.classList.add('fa-spin');
        if (typeof window.showToast === 'function' && !userMarker) { window.showToast('🛰️ GPS 衛星連線中...', 'info'); }
        
        if (watchId) navigator.geolocation.clearWatch(watchId);

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                state.userLocation = { lat, lng };

                // 🌟 修復：在這裡把精確的經緯度座標寫回比例尺旁的 HTML 元素裡
                const gpsValText = document.getElementById('gps-val-text');
                if (gpsValText) gpsValText.textContent = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

                if (!userMarker) {
                    userMarker = L.marker([lat, lng], { icon: createCompassIcon(), zIndexOffset: 1000 }).addTo(state.mapInstance);
                    
                    compassCircle = L.circle([lat, lng], { 
                        radius: accuracy, color: 'var(--primary)', opacity: 0.35,        
                        fillColor: 'var(--primary)', fillOpacity: 0.08, weight: 1
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
                
                // 🌟 真實地址解析
                if (!isUserPanning) {
                    if (window.rfApp.announcer && typeof window.rfApp.announcer.fetchRealAddress === 'function') {
                        window.rfApp.announcer.fetchRealAddress(lat, lng, Math.round(accuracy));
                    }
                }
            },
            (err) => {
                console.warn('GPS 錯誤:', err);
                if (btnIcon) btnIcon.classList.remove('fa-spin');
                if (typeof window.showToast === 'function') window.showToast('無法取得定位，請確認已開啟 GPS', 'error');
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 } 
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
