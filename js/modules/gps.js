// js/modules/gps.js (v652) - 實境羅盤終極視覺版
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

// 🌟 終極視覺：動態注入具有「呼吸感」與「掃描感」的雷達 CSS
const injectCompassCSS = () => {
    if (document.getElementById('gps-compass-style')) return;
    const style = document.createElement('style');
    style.id = 'gps-compass-style';
    style.innerHTML = `
        .gps-marker-wrap { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        
        /* 中心點 */
        .gps-core { 
            width: 16px; height: 16px; background-color: var(--primary); 
            border: 3px solid white; border-radius: 50%; 
            box-shadow: 0 0 8px var(--primary); z-index: 3; position: relative; 
        }
        
        /* 背景擴散波紋 */
        .gps-radar { position: absolute; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
        .gps-radar::before, .gps-radar::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 20px; height: 20px;
            background-color: var(--primary); border-radius: 50%;
            transform: translate(-50%, -50%) scale(1); opacity: 0;
            animation: radar-wave 2.5s infinite linear;
        }
        .gps-radar::after { animation-delay: 1.25s; }
        @keyframes radar-wave {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
        }
        
        /* 🌟 扇形雷達光束：加入「呼吸縮放」與「邊緣羽化」動畫 */
        .gps-arrow-container { 
            position: absolute; top: 0; left: 0; width: 60px; height: 60px; 
            z-index: 2; transition: transform 0.1s ease-out; 
        }
        .gps-arrow-container::before { 
            content: ''; position: absolute; bottom: 50%; left: 50%; transform: translateX(-50%);
            width: 58px; height: 58px; 
            /* 放射狀漸層，製造深淺層次 */
            background: radial-gradient(circle at 50% 100%, var(--primary) 10%, transparent 85%);
            clip-path: polygon(50% 100%, 12% 0, 88% 0);
            opacity: 0.8; 
            filter: drop-shadow(0 -2px 4px var(--primary));
            /* 🌟 讓光束有微微掃描的律動感 */
            animation: beam-breath 3s infinite ease-in-out;
        }
        @keyframes beam-breath {
            0%, 100% { transform: translateX(-50%) scaleY(1); opacity: 0.7; }
            50% { transform: translateX(-50%) scaleY(1.1); opacity: 0.9; }
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
        DeviceOrientationEvent.requestPermission().then(p => { 
            if (p === 'granted') { window.addEventListener('deviceorientation', handleOrientation, true); isCompassActive = true; } 
        }).catch(err => console.log("羅盤權現遭拒:", err));
    } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        isCompassActive = true;
    }
};

export function initGPS() {
    injectCompassCSS();

    if (state.mapInstance) {
        state.mapInstance.on('dragstart', () => {
            if (isFollowing) {
                isFollowing = false;
                if(typeof window.showToast === 'function') window.showToast('已停止位置跟隨', 'info');
            }
        });
    }

    window.rfApp.map.goToUser = () => {
        if (!navigator.geolocation) {
            if (typeof window.showToast === 'function') window.showToast('您的裝置不支援定位', 'error');
            return;
        }
        
        isFollowing = true; 
        requestCompassPermission();
        
        const btnIcon = document.querySelector('.control-btn.active .fa-location-crosshairs');
        if (btnIcon) btnIcon.classList.add('fa-spin');
        
        if (watchId) navigator.geolocation.clearWatch(watchId);

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                state.userLocation = { lat, lng };

                const gpsValText = document.getElementById('gps-val-text');
                if (gpsValText) gpsValText.textContent = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

                if (!userMarker) {
                    userMarker = L.marker([lat, lng], { icon: createCompassIcon(), zIndexOffset: 1000 }).addTo(state.mapInstance);
                    compassCircle = L.circle([lat, lng], { 
                        radius: accuracy, color: 'var(--primary)', opacity: 0.4, 
                        fillColor: 'var(--primary)', fillOpacity: 0.08, weight: 1.5 
                    }).addTo(state.mapInstance);
                    state.mapInstance.flyTo([lat, lng], 17, { animate: true });
                    if (typeof window.showToast === 'function') window.showToast('✅ 定位成功！實境羅盤已啟動', 'success');
                } else {
                    userMarker.setLatLng([lat, lng]);
                    compassCircle.setLatLng([lat, lng]);
                    compassCircle.setRadius(accuracy);
                    if (isFollowing) state.mapInstance.panTo([lat, lng]);
                    
                    // 廣播給其他模組 (如 announcer 和 nearby)
                    events.emit('location_update', { lat, lng, accuracy, timestamp: Date.now() });
                }
                if (btnIcon) btnIcon.classList.remove('fa-spin');
            },
            (err) => {
                if (btnIcon) btnIcon.classList.remove('fa-spin');
                if (typeof window.showToast === 'function') window.showToast('無法取得定位，請確認已開啟 GPS', 'error');
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 } 
        );
    };

    window.rfApp.map.resetNorth = () => {
        isFollowing = false;
        if (state.mapInstance) {
            state.mapInstance.flyTo([25.1086, 121.8058], 15, { animate: true });
            if (typeof window.showToast === 'function') window.showToast('已回到瑞芳中心', 'info');
        }
    };

    window.goToUser = window.rfApp.map.goToUser;
    window.resetNorth = window.rfApp.map.resetNorth;
}
