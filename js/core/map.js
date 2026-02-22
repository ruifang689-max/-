// js/core/map.js (v700) - 多圖層切換支援版
import { state } from './store.js';
import { zones, ruifangBounds } from '../data/boundary.js?v=670';

const style = document.createElement('style');
style.innerHTML = `
    .zone-label-icon { background: transparent; border: none; }
    .zone-label-content { display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); padding: 6px 12px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); border: 2px solid var(--primary); transform: scale(1); transition: transform 0.2s; cursor: pointer; }
    .zone-label-content:active { transform: scale(0.95); }
    .zone-icon { font-size: 24px; margin-bottom: 2px; }
    .zone-name { font-size: 14px; font-weight: bold; color: var(--text-main); white-space: nowrap; }
    /* 歷史圖層專用濾鏡 */
    .leaflet-container.history-mode .leaflet-tile-pane { filter: sepia(0.8) contrast(1.2) brightness(0.9) hue-rotate(-10deg); }
`;
document.head.appendChild(style);

let zoneLabelLayer = null;
let currentBaseLayer = null;
let transitLayer = null;

// 🌟 預先定義各種專業圖層
const mapLayers = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 })
};
// 交通路網疊加圖層 (火車/捷運/重要道路)
const railwayLayer = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.6 });

export async function initMap() {
    state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false });

    // 預設載入標準圖層
    currentBaseLayer = mapLayers.standard;
    state.mapInstance.addLayer(currentBaseLayer);

    state.mapInstance.fitBounds(ruifangBounds, { padding: [20, 20] });
    createZoneLabels();
    state.mapInstance.on('zoomend', handleZoomChange);
    handleZoomChange();

    console.log("🗺️ 地圖核心 v700 已啟動 (多圖層模式)");
}

function createZoneLabels() {
    zoneLabelLayer = L.layerGroup().addTo(state.mapInstance);
    zones.forEach(zone => {
        const marker = L.marker([zone.lat, zone.lng], { 
            icon: L.divIcon({ className: 'zone-label-icon', html: `<div class="zone-label-content"><span class="zone-icon">${zone.icon}</span><span class="zone-name">${zone.name}</span></div>`, iconSize: [100, 40], iconAnchor: [50, 20] })
        });
        marker.on('click', () => state.mapInstance.flyTo([zone.lat, zone.lng], zone.zoom, { animate: true, duration: 1.2 }));
        zoneLabelLayer.addLayer(marker);
    });
}

function handleZoomChange() {
    const currentZoom = state.mapInstance.getZoom();
    if (currentZoom < 14) {
        if (!state.mapInstance.hasLayer(zoneLabelLayer)) state.mapInstance.addLayer(zoneLabelLayer);
    } else {
        if (state.mapInstance.hasLayer(zoneLabelLayer)) state.mapInstance.removeLayer(zoneLabelLayer);
    }
}

// 🌟 全域切換圖層 API
window.rfApp = window.rfApp || {};
window.rfApp.map = window.rfApp.map || {};

window.rfApp.map.switchBaseLayer = (type) => {
    if (!state.mapInstance) return;
    
    // 處理歷史濾鏡模式
    const mapEl = document.getElementById('map');
    if (type === 'history') {
        mapEl.classList.add('history-mode');
        type = 'standard'; // 歷史模式底圖依然用標準圖
    } else {
        mapEl.classList.remove('history-mode');
    }

    if (currentBaseLayer) state.mapInstance.removeLayer(currentBaseLayer);
    currentBaseLayer = mapLayers[type] || mapLayers.standard;
    state.mapInstance.addLayer(currentBaseLayer);
    
    // 確保區域標籤與交通線一直在最上層
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
