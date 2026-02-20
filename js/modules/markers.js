import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; // 🌟 正確匯入官方資料
import { showCard } from './cards.js';

export function renderMarkers() {
    if (!state.cluster) return;
    state.cluster.clearLayers();

    // 🌟 將「官方資料」與「自訂標記」完美合併
    const officialSpots = Array.isArray(spots) ? spots : [];
    const customList = state.customSpots || [];
    const allSpots = [...officialSpots, ...customList];

    allSpots.forEach(spot => {
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
                html: `<div style="background-color: ${markerColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="fas ${iconClass}"></i></div>`
            })
        });

        marker.on('click', () => showCard(spot));
        state.cluster.addLayer(marker);
    });
}
