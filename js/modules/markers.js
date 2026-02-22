// js/modules/markers.js (v641) - 分類過濾修復與視角優化版

import { state } from '../core/store.js';
import { spots } from '../data/spots.js'; 
import { showCard } from './cards.js';

// =========================================
// 🌟 圖釘外觀與產生邏輯
// =========================================
const createCustomPin = (tags, name, category) => {
    let cls = 'fa-map-marker-alt', col = '#ea4335'; // 預設紅色圖釘

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
    marker.on('click', () => showCard(spot));
    spot.markerObj = marker;
    return marker;
};

// 供外部單一呼叫新增 (例如新增自訂秘境)
export function addMarkerToMap(spot) {
    if (!state.cluster) return;
    const marker = createMarkerObj(spot);
    state.cluster.addLayer(marker); 
    return marker;
}

// 初始批次載入所有圖釘
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

// =========================================
// 🌟 核心修復：分類過濾方法 (filterSpots)
// =========================================
export function filterSpots(category, elem) {
    // 1. 處理上方分類按鈕 (Chips) 的 UI 狀態
    const chips = document.querySelectorAll('#category-chips .chip');
    chips.forEach(c => c.classList.remove('active'));

    if (elem) {
        elem.classList.add('active'); // 使用者點擊的按鈕
    } else {
        // 如果是從搜尋框等其他地方呼叫，自動尋找並點亮對應的按鈕
        chips.forEach(c => {
            if (category === 'all' && c.innerText.includes('全部')) c.classList.add('active');
            else if (category !== 'all' && c.innerText.includes(category)) c.classList.add('active');
        });
    }

    if (!state.cluster) return;
    
    // 2. 清空當前地圖上的所有圖釘
    state.cluster.clearLayers();

    const officialSpots = Array.isArray(spots) ? spots : [];
    const customList = state.savedCustomSpots || []; 
    const allSpots = [...officialSpots, ...customList];

    let filteredSpots = [];
    
    // 3. 過濾邏輯
    if (category === 'all') {
        filteredSpots = allSpots;
    } else if (category === '自訂') {
        // 特別處理「自訂」分類
        filteredSpots = customList;
    } else {
        filteredSpots = allSpots.filter(spot => {
            const tags = spot.tags ? (Array.isArray(spot.tags) ? spot.tags : [spot.tags]) : [];
            const cat = spot.category || '';
            const keywords = spot.keywords || [];
            
            // 只要標籤、分類名稱或關鍵字有中，就顯示出來
            return tags.includes(category) || cat.includes(category) || keywords.includes(category);
        });
    }

    // 4. 將過濾後的圖釘重新繪製到畫面上
    const markersArray = [];
    filteredSpots.forEach(spot => {
        markersArray.push(createMarkerObj(spot));
    });

    state.cluster.addLayers(markersArray);

    // 🌟 超棒 UX 優化：切換分類後，自動將視角縮放並平移到涵蓋這些景點的範圍！
    if (markersArray.length > 0 && state.mapInstance) {
        // 如果是「全部」，避免縮得太遠，我們可以不移動，或給個最大的 maxZoom
        const group = new L.featureGroup(markersArray);
        state.mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15, animate: true });
    } else if (markersArray.length === 0 && typeof window.showToast === 'function') {
        window.showToast(`目前沒有「${category}」相關的景點喔！`, 'info');
    }
}

// 🌟 註冊到全域，因為 HTML 中的 onclick 會直接呼叫 window.filterSpots
if (typeof window !== 'undefined') {
    if(!window.rfApp) window.rfApp = {};
    if(!window.rfApp.map) window.rfApp.map = {};
    window.rfApp.map.filterSpots = filterSpots;
    window.filterSpots = filterSpots; // 向下相容 HTML 的綁定
}
