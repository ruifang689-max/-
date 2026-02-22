// js/core/map.js (v715) - 邊界防護與十大浮水印版
import { state } from './store.js';
import { ruifangBoundary } from '../data/boundary.js'; 
import { spots } from '../data/spots.js'; 

// 1. 注入 CSS (浮水印與圖釘樣式)
const style = document.createElement('style');
style.innerHTML = `
    .region-watermark { background: transparent; border: none; }
    .region-watermark-text { 
        font-size: 18px; font-weight: 900; color: rgba(255, 255, 255, 0.75); 
        text-shadow: 0 0 6px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.6); 
        letter-spacing: 3px; white-space: nowrap; transform: translate(-50%, -50%); 
        user-select: none; pointer-events: none; 
    }
    .custom-marker-pin {
        width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
        background: var(--primary, #007bff); position: absolute; transform: rotate(-45deg);
        left: 50%; top: 50%; margin: -15px 0 0 -15px;
        box-shadow: -1px 1px 5px rgba(0,0,0,0.5); border: 2px solid white; transition: all 0.3s ease;
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
    .leaflet-marker-icon:hover .custom-marker-pin { transform: rotate(-45deg) scale(1.1); background: var(--accent, #e67e22); }
    .leaflet-container.history-mode .leaflet-tile-pane { filter: sepia(0.8) contrast(1.2) brightness(0.9) hue-rotate(-10deg); }
`;
document.head.appendChild(style);

// 2. 十大區域浮水印座標
const watermarks = [
    { name: "瑞芳市區", lat: 25.107, lng: 121.806 },
    { name: "四腳亭", lat: 25.102, lng: 121.762 },
    { name: "猴硐", lat: 25.086, lng: 121.826 },
    { name: "三貂嶺", lat: 25.059, lng: 121.824 },
    { name: "九份", lat: 25.109, lng: 121.844 },
    { name: "金瓜石", lat: 25.107, lng: 121.859 },
    { name: "水湳洞", lat: 25.121, lng: 121.864 },
    { name: "深澳", lat: 25.129, lng: 121.820 },
    { name: "南雅", lat: 25.120, lng: 121.890 },
    { name: "鼻頭角", lat: 25.119, lng: 121.918 }
];

let currentBaseLayer = null;
let transitLayer = null;
let markersLayer = null;

const mapLayers = {
    standard: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 })
};
const railwayLayer = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.6 });

export function initMap() {
    return new Promise((resolve) => {
        if (state.mapInstance) return resolve(); 

        state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 13);
        
        currentBaseLayer = mapLayers.standard;
        state.mapInstance.addLayer(currentBaseLayer);
        L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(state.mapInstance);

        // 🌟 [關鍵修復] 邊界繪製的三重防護網
        // 確保 ruifangBoundary 存在，且 geometry 存在，且 coordinates 陣列有內容
        if (ruifangBoundary && ruifangBoundary.geometry && ruifangBoundary.geometry.coordinates && ruifangBoundary.geometry.coordinates.length > 0) {
            try {
                L.geoJSON(ruifangBoundary, {
                    style: { color: 'var(--primary, #007bff)', weight: 3, dashArray: '8, 12', fillColor: 'var(--primary, #007bff)', fillOpacity: 0.04 },
                    interactive: false 
                }).addTo(state.mapInstance);
            } catch (err) {
                console.warn("⚠️ 邊界資料格式有誤，已略過繪製:", err);
            }
        } else {
            console.log("ℹ️ 無有效的邊界資料，跳過邊界繪製");
        }

        watermarks.forEach(w => {
            L.marker([w.lat, w.lng], {
                icon: L.divIcon({ className: 'region-watermark', html: `<div class="region-watermark-text">${w.name}</div>`, iconSize: [0, 0] }),
                interactive: false,
                zIndexOffset: -1000 
            }).addTo(state.mapInstance);
        });

        createSpotMarkers();

        state.mapInstance.on('click', () => {
            if (typeof window.closeCard === 'function') window.closeCard();
            if (typeof window.rfApp?.search?.closeSuggest === 'function') window.rfApp.search.closeSuggest();
        });

        console.log("🗺️ 地圖核心 v715 啟動成功");
        resolve();
    });
}

function createSpotMarkers() {
    markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 40,
        chunkedLoading: true
    });

    window.rfApp = window.rfApp || {};
    window.rfApp.map = window.rfApp.map || {};
    
    window.rfApp.map.filterMarkers = (category = 'all') => {
        if (!markersLayer) return;
        markersLayer.clearLayers();
        const lang = state.currentLang || 'zh';
        const allSpots = [...(spots || []), ...(state.savedCustomSpots || [])];

        allSpots.forEach(spot => {
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
                    import('../modules/cards.js').then(module => { module.showCard(spot); });
                    state.mapInstance.flyTo([spot.lat, spot.lng], 16, { animate: true, duration: 0.8 });
                });
                markersLayer.addLayer(marker);
            }
        });
        state.mapInstance.addLayer(markersLayer);
    };
    window.rfApp.map.filterMarkers('all');
}

// 🌟 圖層控制 API 安全綁定
window.rfApp = window.rfApp || {};
window.rfApp.map = window.rfApp.map || {};

window.rfApp.map.switchBaseLayer = (type) => {
    if (!state.mapInstance) return;
    const mapEl = document.getElementById('map');
    if (type === 'history') { mapEl.classList.add('history-mode'); type = 'standard'; } 
    else { mapEl.classList.remove('history-mode'); }

    if (currentBaseLayer) state.mapInstance.removeLayer(currentBaseLayer);
    currentBaseLayer = mapLayers[type] || mapLayers.standard;
    state.mapInstance.addLayer(currentBaseLayer);
    if (transitLayer) transitLayer.bringToFront();
};

window.rfApp.map.toggleTransitLayer = (show) => {
    if (!state.mapInstance) return;
    if (show) { transitLayer = railwayLayer; state.mapInstance.addLayer(transitLayer); } 
    else { if (transitLayer) state.mapInstance.removeLayer(transitLayer); transitLayer = null; }
};

window.rfApp.map.updateMarkerLabels = () => {
    const activeChip = document.querySelector('#category-chips .chip.active');
    let currentCat = 'all';
    if(activeChip) {
        if(activeChip.innerText.includes('美食')) currentCat = '美食';
        else if(activeChip.innerText.includes('歷史')) currentCat = '歷史';
        else if(activeChip.innerText.includes('自然')) currentCat = '自然';
        else if(activeChip.innerText.includes('標記')) currentCat = '自訂';
    }
    window.rfApp.map.filterMarkers(currentCat);
};
