// js/modules/nearby.js (v646) - 周邊秘境雷達
import { state } from '../core/store.js';
import { spots } from '../data/spots.js';
import { events } from '../core/events.js?v=646';

// 用來記錄已經通知過的景點，避免一直重複跳通知
const notifiedSpots = new Set();

export function initNearby() {
    // 訂閱位置更新
    events.on('location_update', (data) => {
        if (!state.mapInstance) return;

        const userLatLng = L.latLng(data.lat, data.lng);
        const allSpots = spots.concat(state.savedCustomSpots || []);

        allSpots.forEach(spot => {
            if (notifiedSpots.has(spot.name)) return; // 已經通知過就跳過

            const spotLatLng = L.latLng(spot.lat, spot.lng);
            const dist = userLatLng.distanceTo(spotLatLng); // 計算距離 (公尺)

            // 如果距離小於 100 公尺
            if (dist < 100) {
                // 發送通知
                if (typeof window.showToast === 'function') {
                    window.showToast(`✨ 發現秘境：${spot.name} 就在附近 ${Math.round(dist)} 公尺處！`, 'info');
                }
                
                // 標記為已通知
                notifiedSpots.add(spot.name);
                
                // (可選) 手機震動一下
                if (navigator.vibrate) navigator.vibrate(200);
            }
        });
    });
    
    console.log("📡 周邊秘境雷達已啟動");
}
