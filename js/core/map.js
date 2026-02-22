// js/core/map.js (v703) - 景點渲染與多語系標記版
import { state } from './store.js';
import { zones, ruifangBounds } from '../data/boundary.js?v=670';
// 🌟 新增：引入景點資料與卡片顯示功能
import { spots } from '../data/spots.js'; 
import { showCard } from '../modules/cards.js';

const style = document.createElement('style');
style.innerHTML = `
    .zone-label-icon { background: transparent; border: none; }
    .zone-label-content { display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: 2px solid var(--primary); transform: scale(1); transition: transform 0.2s; cursor: pointer; }
    .zone-label-content:active { transform: scale(0.95); }
    .zone-icon { font-size: 24px; margin-bottom: 2px; }
    .zone-name { font-size: 14px; font-weight: bold; color: var(--text-main); white-space: nowrap; }
    /* 歷史圖層專用濾鏡 */
    .leaflet-container.history-mode .leaflet-tile-pane { filter: sepia(0.8) contrast(1.2) brightness(0.9) hue-rotate(-10deg); }
    
    /* 🌟 新增：景點標記樣式 (Pulse 動畫) */
    .custom-marker-pin {
        width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
        background: var(--primary); position: absolute; transform: rotate(-45deg);
        left: 50%; top: 50%; margin: -15px 0 0 -15px;
        box-shadow: -1px 1px 5px rgba(0,0,0,0.5);
        border: 2px solid white;
        transition: all 0.3s ease;
    }
    .custom-marker-pin::after {
        content: ''; width: 14px; height: 14px; margin: 6px 0 0 6px;
        background: white; position: absolute; border-radius: 50%;
    }
    .marker-pulse {
        background: rgba(255, 255, 255, 0.4); border-radius: 50%;
        height: 14px; width: 14px; position: absolute; left: 50%; top: 50%;
        margin: 11px 0px 0px -12px; transform: rotateX(55deg); z-index: -2;
    }
    .leaflet-marker-icon:hover .custom-marker-pin { transform: rotate(-45deg) scale(1.1); background: var(--accent); }
`;
document.head.appendChild(style);

let zoneLabelLayer = null;
let currentBaseLayer = null;
let transitLayer = null;
// 🌟 新增：景點標記群組
let markersLayer = null; 

// 預先定義各種專業圖層
const mapLayers = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 })
};
// 交通路網疊加圖層
const railwayLayer = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.6 });

export async function initMap() {
    state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false });

    // 預設載入標準圖層
    currentBaseLayer = mapLayers.standard;
    state.mapInstance.addLayer(currentBaseLayer);

    state.mapInstance.fitBounds(ruifangBounds, { padding: [20, 20] });
    
    // 🌟 1. 建立大區域標籤 (Zoom Out 時顯示)
    createZoneLabels();
    
    // 🌟 2. 建立景點標記 (Zoom In 時顯示)
    createSpotMarkers();
    
    state.mapInstance.on('zoomend', handleZoomChange);
    handleZoomChange();

    console.log("🗺️ 地圖核心 v703 已啟動 (含景點渲染)");
}

function createZoneLabels() {
    zoneLabelLayer = L.layerGroup(); // 先不 addTo，由 handleZoomChange 控制
    zones.forEach(zone => {
        const marker = L.marker([zone.lat, zone.lng], { 
            icon: L.divIcon({ className: 'zone-label-icon', html: `<div class="zone-label-content"><span class="zone-icon">${zone.icon}</span><span class="zone-name">${zone.name}</span></div>`, iconSize: [100, 40], iconAnchor: [50, 20] })
        });
        marker.on('click', () => state.mapInstance.flyTo([zone.lat, zone.lng], zone.zoom, { animate: true, duration: 1.2 }));
        zoneLabelLayer.addLayer(marker);
    });
}

// 🌟 核心函數：渲染所有景點標記
function createSpotMarkers() {
    markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 40 // 讓點比較不容易聚集成一坨，散開一點
    });

    if (Array.isArray(spots)) {
        spots.forEach(spot => {
            // 建立自訂圖示 (CSS 純代碼繪製，效能好且可變色)
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='marker-pulse'></div><div class='custom-marker-pin'></div>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42],
                popupAnchor: [0, -35]
            });

            const marker = L.marker([spot.lat, spot.lng], { icon: icon });
            
            // 🌟 綁定多語系 Tooltip (根據目前語言顯示名稱)
            const lang = state.currentLang || 'zh';
            const displayName = spot[`name_${lang}`] || spot.name; // 優先取用對應語言的名稱
            marker.bindTooltip(displayName, { direction: 'top', offset: [0, -40], opacity: 0.9 });

            // 🌟 點擊事件：開啟卡片
            marker.on('click', () => {
                showCard(spot);
                // 可選：點擊後地圖中心稍微上移，讓卡片不擋住景點
                state.mapInstance.flyTo([spot.lat, spot.lng], 16, { animate: true, duration: 0.8 });
            });

            markersLayer.addLayer(marker);
        });
        state.mapInstance.addLayer(markersLayer);
    }
}

// 🌟 處理縮放顯示邏輯 (分層顯示)
function handleZoomChange() {
    const currentZoom = state.mapInstance.getZoom();
    
    // Zoom < 14: 顯示大區域標籤 (Zone Labels)，隱藏詳細景點
    if (currentZoom < 14) {
        if (!state.mapInstance.hasLayer(zoneLabelLayer)) state.mapInstance.addLayer(zoneLabelLayer);
        if (state.mapInstance.hasLayer(markersLayer)) state.mapInstance.removeLayer(markersLayer);
    } 
    // Zoom >= 14: 隱藏大區域，顯示詳細景點 (Markers)
    else {
        if (state.mapInstance.hasLayer(zoneLabelLayer)) state.mapInstance.removeLayer(zoneLabelLayer);
        if (!state.mapInstance.hasLayer(markersLayer)) state.mapInstance.addLayer(markersLayer);
    }
}

// 全域切換圖層 API
window.rfApp = window.rfApp || {};
window.rfApp.map = window.rfApp.map || {};

window.rfApp.map.switchBaseLayer = (type) => {
    if (!state.mapInstance) return;
    
    const mapEl = document.getElementById('map');
    if (type === 'history') {
        mapEl.classList.add('history-mode');
        type = 'standard'; 
    } else {
        mapEl.classList.remove('history-mode');
    }

    if (currentBaseLayer) state.mapInstance.removeLayer(currentBaseLayer);
    currentBaseLayer = mapLayers[type] || mapLayers.standard;
    state.mapInstance.addLayer(currentBaseLayer);
    
    if (transitLayer) transitLayer.bringToFront();
};

window.rfApp.map.toggleTransitLayer = (show) => {
    if (!state.mapInstance) return;
    if (show) {
        transitLayer = railwayLayer;
        state.mapInstance.addLayer(transitLayer);
    } else {
        if (transitLayer) state.mapInstance.removeLayer(transitLayer);
        transitLayer = null;
    }
};

// 🌟 新增：全域更新標記語言 (當使用者切換語言時呼叫)
window.rfApp.map.updateMarkerLabels = () => {
    if (!markersLayer) return;
    const lang = state.currentLang || 'zh';
    
    markersLayer.eachLayer(layer => {
        // 假設 layer 身上沒有直接綁 spot 資料，我們需要透過經緯度或 ID 反查，
        // 但最簡單的方式是清空重繪，或是直接利用 marker 的原始 reference。
        // 這裡為了效能，我們簡化處理：直接關閉所有 Tooltip，下次 hover 時重新綁定太複雜。
        // ✅ 最佳解：直接重新執行 createSpotMarkers (清空再重繪)
    });
    
    // 簡單暴力法：清除舊圖層，重新繪製
    if (markersLayer) {
        markersLayer.clearLayers();
        state.mapInstance.removeLayer(markersLayer);
    }
    createSpotMarkers();
};

// 將這段加入到 js/core/map.js 的最下方

// 🌟 全域：過濾地圖上的標記
window.rfApp.map.filterMarkers = (category) => {
    if (!markersLayer) return;
    
    // 先清空所有標記
    markersLayer.clearLayers();
    const lang = state.currentLang || 'zh';

    // 重新篩選並加入符合的標記
    spots.forEach(spot => {
        // 如果選了 'all'，或者景點的 tags 包含該分類，就顯示
        const isMatch = category === 'all' || (spot.tags && spot.tags.includes(category));
        
        if (isMatch) {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='marker-pulse'></div><div class='custom-marker-pin'></div>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42],
                popupAnchor: [0, -35]
            });

            const marker = L.marker([spot.lat, spot.lng], { icon: icon });
            const displayName = spot[`name_${lang}`] || spot.name;
            marker.bindTooltip(displayName, { direction: 'top', offset: [0, -40], opacity: 0.9 });

            marker.on('click', () => {
                import('../modules/cards.js').then(module => {
                    module.showCard(spot);
                });
                state.mapInstance.flyTo([spot.lat, spot.lng], 16, { animate: true, duration: 0.8 });
            });

            markersLayer.addLayer(marker);
        }
    });
};
