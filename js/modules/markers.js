// js/modules/markers.js

import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';
import { getPreviewHtml } from './previews.js'; // 只有引入 HTML 產生器

// =========================================
// 🌟 圖釘外觀與產生邏輯
// =========================================
const createCustomPin = (tags, name, category) => {
    let cls = 'fa-map-marker-alt', col = '#ea4335';

    const combined = (Array.isArray(tags) ? tags.join(',') : (tags || '')) + (category || '');

    if (combined.includes('美食') || combined.includes('餐廳') || combined.includes('小吃')) { cls = 'fa-utensils'; col = '#f39c12'; } 
    else if (combined.includes('貓村') || combined.includes('貓')) { cls = 'fa-cat'; col = '#9b59b6'; } 
    else if (combined.includes('自然') || combined.includes('秘境')) { cls = 'fa-leaf'; col = '#2ecc71'; } 
    else if (combined.includes('歷史') || combined.includes('古蹟')) { cls = 'fa-landmark'; col = '#7f8c8d'; } 
    else if (combined.includes('自訂')) { cls = 'fa-star'; col = '#f1c40f'; }
    else if (combined.includes('咖啡') || combined.includes('茶')) { cls = 'fa-coffee'; col = '#8e44ad'; }
    else if (combined.includes('公車') || combined.includes('客運')) { cls = 'fa-bus'; col = '#2980b9'; }
    else if (combined.includes('火車') || combined.includes('車站')) { cls = 'fa-train'; col = '#2980b9'; }
    else if (combined.includes('醫院')) { cls = 'fa-hospital'; col = '#d63031'; }
    else if (combined.includes('警察')) { cls = 'fa-taxi'; col = '#c0392b'; } 
    else if (combined.includes('服務') || combined.includes('中心')) { cls = 'fa-info-circle'; col = '#ff4757'; }

    return L.divIcon({ 
        className: 'custom-pin-wrap', 
        html: `<div class="gmap-pin" style="background-color:${col}"><i class="fas ${cls}"></i></div><div class="pin-label">${name}</div>`, 
        iconSize: [32, 50],   
        iconAnchor: [16, 38]  
    });
};

const createMarkerObj = (spot) => {
    const marker = L.marker([spot.lat, spot.lng], {
        icon: createCustomPin(spot.tags, spot.name, spot.category)
    });

    // 1. 綁定預覽小卡 (Popup) HTML
    marker.bindPopup(() => getPreviewHtml(spot), { closeButton: false });

    // 2. 滑鼠移入時自動顯示預覽小卡
    marker.on('mouseover', function() { 
        this.openPopup(); 
    });

    // 3. 點擊圖釘時：阻止預設事件，並直接開啟下方資訊大卡
    marker.on('click', (e) => { 
        L.DomEvent.stopPropagation(e); 
        showCard(spot); 
    });

    spot.markerObj = marker;
    return marker;
};

export function addMarkerToMap(spot) {
    if (!state.cluster) return;
    const marker = createMarkerObj(spot);
    state.cluster.addLayer(marker); 
    return marker;
}

export function renderAllMarkers() {
    if (!state.cluster) return;
    state.cluster.clearLayers();

    const officialSpots = Array.isArray(spots) ? spots : [];
    const customList = state.savedCustomSpots || []; 
    const allSpots = [...officialSpots, ...customList];

    const markersArray = [];
    allSpots.forEach(spot => {
        markersArray.push(createMarkerObj(spot));
    });

    state.cluster.addLayers(markersArray);
}

export function filterSpots(category, elem) {
    const chips = document.querySelectorAll('#category-chips .chip');
    chips.forEach(c => c.classList.remove('active'));

    if (elem) {
        elem.classList.add('active'); 
    } else {
        chips.forEach(c => {
            if (category === 'all' && c.innerText.includes('全部')) c.classList.add('active');
            else if (category !== 'all' && c.innerText.includes(category)) c.classList.add('active');
        });
    }

    if (!state.cluster) return;
    state.cluster.clearLayers();

    const officialSpots = Array.isArray(spots) ? spots : [];
    const customList = state.savedCustomSpots || []; 
    const allSpots = [...officialSpots, ...customList];

    let filteredSpots = [];
    
    if (category === 'all') {
        filteredSpots = allSpots;
    } else if (category === '自訂') {
        filteredSpots = customList;
    } else {
        filteredSpots = allSpots.filter(spot => {
            const tags = spot.tags ? (Array.isArray(spot.tags) ? spot.tags : [spot.tags]) : [];
            const cat = spot.category || '';
            const keywords = spot.keywords || [];
            return tags.includes(category) || cat.includes(category) || keywords.includes(category);
        });
    }

    const markersArray = [];
    filteredSpots.forEach(spot => {
        markersArray.push(createMarkerObj(spot));
    });

    state.cluster.addLayers(markersArray);

    if (markersArray.length > 0 && state.mapInstance) {
        const group = new L.featureGroup(markersArray);
        state.mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15, animate: true });
    } else if (markersArray.length === 0 && typeof window.showToast === 'function') {
        window.showToast(`目前沒有「${category}」相關的景點喔！`, 'info');
    }
}

if (typeof window !== 'undefined') {
    if(!window.rfApp) window.rfApp = {};
    if(!window.rfApp.map) window.rfApp.map = {};
    window.rfApp.map.filterSpots = filterSpots;
    window.filterSpots = filterSpots; 
}
