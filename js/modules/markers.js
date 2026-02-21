import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';

export function addMarkerToMap(spot) {
    if (!state.cluster) return;

    let iconClass = 'fa-map-marker-alt'; 
    let markerColor = 'var(--primary)';

    if (spot.category === '服務中心') {
        iconClass = 'fa-info-circle';
        markerColor = '#27ae60';
    } else if (spot.tags && spot.tags.includes('自訂')) {
        iconClass = 'fa-star';
        markerColor = '#f39c12';
    }

    const marker = L.marker([spot.lat, spot.lng], {
        icon: L.divIcon({
            className: 'custom-marker-wrapper',
            // 🌟 完美復刻：上方是水滴圖釘，下方是名稱標籤
            html: `
                <div class="custom-marker" style="background-color: ${markerColor};">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="marker-label">${spot.name}</div>
            `,
            iconSize: [40, 56],   // 調整感應大小以包含文字
            iconAnchor: [20, 48]  // 將定位錨點設在水滴底部尖端
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
