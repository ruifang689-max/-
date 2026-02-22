// js/core/map.js (v670) - 智慧縮放與分區導覽版
import { state } from './store.js';
import { zones, ruifangBounds, ruifangBoundary } from '../data/boundary.js?v=670';

// 動態注入區域標籤 CSS
const style = document.createElement('style');
style.innerHTML = `
    .zone-label-icon { background: transparent; border: none; }
    .zone-label-content {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        padding: 6px 12px;
        border-radius: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        border: 2px solid var(--primary);
        transform: scale(1);
        transition: transform 0.2s;
        cursor: pointer;
    }
    .zone-label-content:active { transform: scale(0.95); }
    .zone-icon { font-size: 24px; margin-bottom: 2px; }
    .zone-name { font-size: 14px; font-weight: bold; color: var(--text-main); white-space: nowrap; }
`;
document.head.appendChild(style);

// 用來儲存區域標籤的圖層群組
let zoneLabelLayer = null;

export async function initMap() {
    // 1. 初始化地圖，但不設定 view，改用 fitBounds
    state.mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: false
    });

    // 2. 載入圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(state.mapInstance);

    // 🌟 選配：如果您想把瑞芳區的輪廓線畫出來，可以解除這段註解
     if (ruifangBoundary && ruifangBoundary.coordinates) {
         L.geoJSON(ruifangBoundary.coordinates[0][0].geojson, {
             style: { color: 'var(--primary)', weight: 2, fillOpacity: 0.05, dashArray: '5, 5' }
         }).addTo(state.mapInstance);
     }

    // 3. 🌟 核心升級：自動適配瑞芳邊界 (Item 2)
    state.mapInstance.fitBounds(ruifangBounds, { padding: [20, 20] });

    // 4. 建立區域標籤圖層 (Item 3, 7)
    createZoneLabels();

    // 5. 監聽縮放事件：控制「區域標籤」的顯示與隱藏
    state.mapInstance.on('zoomend', handleZoomChange);
    handleZoomChange();

    console.log("🗺️ 地圖核心 v670 已啟動 (智慧邊界模式)");
}

function createZoneLabels() {
    zoneLabelLayer = L.layerGroup().addTo(state.mapInstance);

    zones.forEach(zone => {
        const labelIcon = L.divIcon({
            className: 'zone-label-icon',
            html: `<div class="zone-label-content">
                     <span class="zone-icon">${zone.icon}</span>
                     <span class="zone-name">${zone.name}</span>
                   </div>`,
            iconSize: [100, 40],
            iconAnchor: [50, 20]
        });

        const marker = L.marker([zone.lat, zone.lng], { icon: labelIcon });
        
        // 點擊標籤 -> 飛入該區域
        marker.on('click', () => {
            state.mapInstance.flyTo([zone.lat, zone.lng], zone.zoom, { animate: true, duration: 1.2 });
        });

        zoneLabelLayer.addLayer(marker);
    });
}

function handleZoomChange() {
    const currentZoom = state.mapInstance.getZoom();
    const map = state.mapInstance;

    // Zoom < 14 (看全區時)：顯示區域標籤
    // Zoom >= 14 (看細節時)：隱藏區域標籤
    if (currentZoom < 14) {
        if (!map.hasLayer(zoneLabelLayer)) map.addLayer(zoneLabelLayer);
    } else {
        if (map.hasLayer(zoneLabelLayer)) map.removeLayer(zoneLabelLayer);
    }
}

export function toggleLayer(type) {
    console.log('切換圖層:', type);
}
