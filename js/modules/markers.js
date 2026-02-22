// js/modules/markers.js (v672) - 修復 export 錯誤版
import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';

// 用來裝所有圖釘的普通群組
let markersGroup = null;

// =========================================
// 🌟 圖釘外觀與產生邏輯
// =========================================
const createCustomPin = (tags, name, category) => {
    let cls = 'fa-map-marker-alt', col = '#ea4335'; 

    const combined = (Array.isArray(tags) ? tags.join(',') : (tags || '')) + (category || '');

    if (combined.includes('美食') || combined.includes('餐廳') || combined.includes('小吃')) { cls = 'fa-utensils'; col = '#f39c12'; } 
    else if (combined.includes('貓村') || combined.includes('貓')) { cls = 'fa-cat'; col = '#9b59b6'; } 
    else if (combined.includes('自然') || combined.includes('秘境') || combined.includes('登山')) { cls = 'fa-leaf'; col = '#2ecc71'; } 
    else if (combined.includes('歷史') || combined.includes('古蹟') || combined.includes('遺址')) { cls = 'fa-landmark'; col = '#7f8c8d'; } 
    else if (combined.includes('自訂')) { cls = 'fa-star'; col = '#f1c40f'; }
    else if (combined.includes('交通') || combined.includes('車站')) { cls = 'fa-train'; col = '#2980b9'; }
    else if (combined.includes('海岸') || combined.includes('海景')) { cls = 'fa-water'; col = '#3498db'; }
    else if (combined.includes('服務')) { cls = 'fa-info-circle'; col = '#ff4757'; }

    return L.divIcon({ 
        className: 'custom-pin-wrap', 
        html: `<div class="gmap-pin" style="background-color:${col}; transform: scale(var(--pin-scale, 1)); transition: transform 0.2s;"><i class="fas ${cls}"></i></div><div class="pin-label" style="transform: scale(var(--pin-scale, 1)); transform-origin: top center; transition: transform 0.2s;">${name}</div>`, 
        iconSize: [32, 50],   
        iconAnchor: [16, 38]  
    });
};

const createMarkerObj = (spot) => {
    const marker = L.marker([spot.lat, spot.lng], {
        icon: createCustomPin(spot.tags, spot.name, spot.category),
        riseOnHover: true 
    });

    marker.on('click', () => {
        state.mapInstance.flyTo([spot.lat, spot.lng], 16, { animate: true, duration: 1.2 });
        setTimeout(() => showCard(spot), 800); 
    });

    spot.markerObj = marker;
    return marker;
};

export function addMarkerToMap(spot) {
    if(!markersGroup) return;
    const m = createMarkerObj(spot);
    markersGroup.addLayer(m);
}

// =========================================
// 🌟 圖釘動態縮放邏輯
// =========================================
function updatePinScale() {
    if (!state.mapInstance) return;
    const zoom = state.mapInstance.getZoom();
    let scale = 1;

    if (zoom < 14) {
        scale = 0; 
    } else if (zoom === 14) {
        scale = 0.5; 
    } else if (zoom === 15) {
        scale = 0.8;
    } else {
        scale = 1; 
    }

    document.documentElement.style.setProperty('--pin-scale', scale);
    
    if (scale === 0 && state.mapInstance.hasLayer(markersGroup)) {
        state.mapInstance.removeLayer(markersGroup);
    } else if (scale > 0 && !state.mapInstance.hasLayer(markersGroup)) {
        state.mapInstance.addLayer(markersGroup);
    }
}

// =========================================
// 🌟 獨立匯出的過濾函數 (修正點)
// =========================================
export function filterSpots(category) {
    if (!markersGroup || !state.mapInstance) return;

    markersGroup.clearLayers(); 

    const allSpots = spots.concat(state.savedCustomSpots || []);
    
    let filtered = [];
    if (category === 'all') {
        filtered = allSpots;
    } else {
        filtered = allSpots.filter(s => {
            const sCat = s.category || "";
            const sTags = s.tags || [];
            if (sCat === category) return true;
            if (sTags.includes(category)) return true;
            
            const joined = (sCat + sTags.join("")).toLowerCase();
            return joined.includes(category.toLowerCase());
        });
        
        if (filtered.length === 0) {
            if(typeof window.showToast === 'function') window.showToast(window.rfApp.t ? window.rfApp.t('toast_search_empty') : "找不到該分類景點", 'info');
            filtered = allSpots;
        } else {
            if(typeof window.showToast === 'function') window.showToast(`篩選：${category}`, 'success');
        }
    }

    filtered.forEach(spot => markersGroup.addLayer(spot.markerObj || createMarkerObj(spot)));

    if (filtered.length > 0) {
        const group = new L.featureGroup(filtered.map(s => s.markerObj));
        state.mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
        
        document.documentElement.style.setProperty('--pin-scale', 1);
        if (!state.mapInstance.hasLayer(markersGroup)) state.mapInstance.addLayer(markersGroup);
    }
}

// =========================================
// 🌟 初始化渲染
// =========================================
export function renderAllMarkers() {
    if (!state.mapInstance) return;

    markersGroup = L.layerGroup();

    spots.forEach(spot => {
        const m = createMarkerObj(spot);
        markersGroup.addLayer(m);
    });

    if (state.savedCustomSpots) {
        state.savedCustomSpots.forEach(spot => {
            const m = createMarkerObj(spot);
            markersGroup.addLayer(m);
        });
    }

    state.mapInstance.addLayer(markersGroup);

    state.mapInstance.on('zoomend', updatePinScale);
    updatePinScale(); 

    // 掛載到全域變數，供 HTML onclick 或 console 使用
    window.rfApp.map.filterSpots = filterSpots;
    window.filterSpots = filterSpots;
}
