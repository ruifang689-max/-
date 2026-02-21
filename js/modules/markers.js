import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';

export function addMarkerToMap(spot) {
    if (!state.cluster) return;

    let iconStr = '📸'; // 預設圖示 (景點)
    let markerColor = 'var(--primary)'; // 預設顏色 (藍色)

    // 將分類、標籤、名稱合併起來判斷，提升配對準確率
    const cat = spot.category || '';
    const tags = Array.isArray(spot.tags) ? spot.tags.join(',') : (spot.tags || '');
    const combined = cat + tags + spot.name;

    // 🌟 依據關鍵字，配對您專屬的表情符號圖示
    if (combined.includes('自訂')) { iconStr = '⭐'; markerColor = '#f39c12'; }
    else if (combined.includes('咖啡')) { iconStr = '☕'; markerColor = '#8e44ad'; }
    else if (combined.includes('下午茶') || combined.includes('甜點')) { iconStr = '🥮'; markerColor = '#e84393'; }
    else if (combined.includes('茶')) { iconStr = '🍵'; markerColor = '#27ae60'; }
    else if (combined.includes('餐廳') || combined.includes('美食')) { iconStr = '🍽️'; markerColor = '#e67e22'; }
    else if (combined.includes('小吃')) { iconStr = '🍴'; markerColor = '#e67e22'; }
    else if (combined.includes('歷史') || combined.includes('古蹟')) { iconStr = '🏯'; markerColor = '#34495e'; }
    else if (combined.includes('公車') || combined.includes('客運')) { iconStr = '🚌'; markerColor = '#2980b9'; }
    else if (combined.includes('火車') || combined.includes('車站')) { iconStr = '🚂'; markerColor = '#2980b9'; }
    else if (combined.includes('船') || combined.includes('碼頭')) { iconStr = '🛥️'; markerColor = '#0984e3'; }
    else if (combined.includes('警察') || combined.includes('派出所')) { iconStr = '🚨'; markerColor = '#c0392b'; }
    else if (combined.includes('醫院') || combined.includes('診所')) { iconStr = '🏥'; markerColor = '#d63031'; }
    else if (combined.includes('學校')) { iconStr = '🏫'; markerColor = '#f39c12'; }
    else if (combined.includes('銀行') || combined.includes('郵局')) { iconStr = '🏦'; markerColor = '#f1c40f'; }
    else if (combined.includes('服務') || combined.includes('中心')) { iconStr = '❤️'; markerColor = '#ff4757'; }

    const marker = L.marker([spot.lat, spot.lng], {
        icon: L.divIcon({
            className: 'custom-marker-wrapper',
            // 使用 span 包裝 Emoji，取代原本的 FontAwesome <i> 標籤
            html: `
                <div class="custom-marker" style="background-color: ${markerColor};">
                    <span style="line-height: 1;">${iconStr}</span>
                </div>
                <div class="marker-label">${spot.name}</div>
            `,
            iconSize: [40, 50],
            iconAnchor: [20, 25] // 錨點設在圓形中心
        })
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
