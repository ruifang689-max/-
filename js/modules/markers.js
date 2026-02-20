import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';

// =========================================
// 🌟 1. 繪製「單一」標記 (供 search.js 與 ui.js 呼叫)
// =========================================
export function addMarkerToMap(spot) {
    if (!state.cluster) return;

    let iconClass = 'fa-map-marker-alt'; 
    let markerColor = 'var(--primary)';

    // 依據類別給予專屬圖示與顏色
    if (spot.category === '服務中心') {
        iconClass = 'fa-info-circle';
        markerColor = '#27ae60';
    } else if (spot.tags && spot.tags.includes('自訂')) {
        iconClass = 'fa-star';
        markerColor = '#f39c12';
    }

    const marker = L.marker([spot.lat, spot.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                // 🌟 修正 4：加入完美的圓形圖釘樣式 (白邊 + 圓角 + 陰影 + 置中)
                html: `<div style="background-color: ${markerColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: 14px;"><i class="fas ${iconClass}"></i></div>`
            })
        });

    marker.on('click', () => showCard(spot));
    
    // 將地圖上的標記物件存回 spot 裡面，這樣 ui.js 刪除時才找得到它！
    spot.markerObj = marker;
    
    state.cluster.addLayer(marker);
    return marker;
}

// =========================================
// 🌟 2. 重新繪製「所有」標記 (已修正為 main.js 需要的 renderAllMarkers)
// =========================================
export function renderAllMarkers() {
    if (!state.cluster) return;
    state.cluster.clearLayers();

    // 確保讀取到正確的官方資料與自訂資料
    const officialSpots = Array.isArray(spots) ? spots : [];
    const customList = state.savedCustomSpots || []; 
    const allSpots = [...officialSpots, ...customList];

    // 迴圈呼叫上方的 addMarkerToMap，把它們全部畫到地圖上
    allSpots.forEach(spot => {
        addMarkerToMap(spot);
    });
}
