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
            className: 'custom-marker',
            // 🌟 恢復您以前的簡潔 HTML，原汁原味呈現
            html: `<div style="background-color: ${markerColor}"><i class="fas ${iconClass}"></i></div>`
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
