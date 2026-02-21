import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';

// =========================================
// 🌟 完美移植您的圖釘邏輯
// =========================================
const createCustomPin = (tags, name, category) => {
    let cls = 'fa-map-marker-alt', col = '#ea4335'; // 預設紅色圖釘

    // 將 tags 和 category 合併成字串方便判斷
    const combined = (Array.isArray(tags) ? tags.join(',') : (tags || '')) + (category || '');

    // 依據您的設計賦予專屬色彩與 FontAwesome 圖示
    if (combined.includes('美食') || combined.includes('餐廳') || combined.includes('小吃')) { cls = 'fa-utensils'; col = '#f39c12'; } 
    else if (combined.includes('貓村') || combined.includes('貓')) { cls = 'fa-cat'; col = '#9b59b6'; } 
    else if (combined.includes('自然') || combined.includes('秘境')) { cls = 'fa-leaf'; col = '#2ecc71'; } 
    else if (combined.includes('歷史') || combined.includes('古蹟')) { cls = 'fa-landmark'; col = '#7f8c8d'; } 
    else if (combined.includes('自訂')) { cls = 'fa-star'; col = '#f1c40f'; }
    // 補齊其他常用分類的圖示
    else if (combined.includes('咖啡') || combined.includes('茶')) { cls = 'fa-coffee'; col = '#8e44ad'; }
    else if (combined.includes('公車') || combined.includes('客運')) { cls = 'fa-bus'; col = '#2980b9'; }
    else if (combined.includes('火車') || combined.includes('車站')) { cls = 'fa-train'; col = '#2980b9'; }
    else if (combined.includes('醫院')) { cls = 'fa-hospital'; col = '#d63031'; }
    else if (combined.includes('警察')) { cls = 'fa-taxi'; col = '#c0392b'; } // 警車替代
    else if (combined.includes('服務') || combined.includes('中心')) { cls = 'fa-info-circle'; col = '#ff4757'; }

    return L.divIcon({ 
        className: 'custom-pin-wrap', 
        html: `<div class="gmap-pin" style="background-color:${col}"><i class="fas ${cls}"></i></div><div class="pin-label">${name}</div>`, 
        iconSize: [32, 50],   // 調整整體高度以包含標籤
        iconAnchor: [16, 38]  // 將錨點精準對齊水滴的尖端
    });
};

export function addMarkerToMap(spot) {
    if (!state.cluster) return;

    // 呼叫 createCustomPin 來生成圖釘
    const marker = L.marker([spot.lat, spot.lng], {
        icon: createCustomPin(spot.tags, spot.name, spot.category)
    });

    marker.on('click', () => showCard(spot));
    spot.markerObj = marker;
    state.cluster.addLayer(marker);
    return marker;
}

export function renderAllMarkers() {
    if (!state.cluster) return;
    state.cluster.clearLayers();

    const officialSpots = Array.isArray(spots) ? spots : [];
    const customList = state.savedCustomSpots || []; 
    const allSpots = [...officialSpots, ...customList];

    allSpots.forEach(spot => {
        addMarkerToMap(spot);
    });
}
