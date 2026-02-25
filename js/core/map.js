// js/core/map.js (v721) - 純淨水滴對接版 + 十大浮水印
import { state } from './store.js';
import { ruifangBoundary } from '../data/boundary.js'; 
import { spots } from '../data/spots.js'; 

// 🌟 十大區域浮水印座標
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

        // 🌟 繪製虛線邊界 (三重安全防護)
        if (ruifangBoundary && ruifangBoundary.geometry && ruifangBoundary.geometry.coordinates && ruifangBoundary.geometry.coordinates.length > 0) {
            try {
                L.geoJSON(ruifangBoundary, {
                    style: { color: 'var(--primary, #007bff)', weight: 3, dashArray: '8, 12', fillColor: 'var(--primary, #007bff)', fillOpacity: 0.04 },
                    interactive: false 
                }).addTo(state.mapInstance);
            } catch (err) {
                console.warn("⚠️ 邊界繪製略過:", err);
            }
        }

        // 🌟 繪製十大橫書浮水印
        watermarks.forEach(w => {
            L.marker([w.lat, w.lng], {
                icon: L.divIcon({ className: 'region-watermark', html: `<div class="region-watermark-text">${w.name}</div>`, iconSize: [0, 0] }),
                interactive: false,
                zIndexOffset: -1000 
            }).addTo(state.mapInstance);
        });

        createSpotMarkers();

        // 點擊地圖空白處關閉卡片與搜尋建議
        state.mapInstance.on('click', () => {
            if (typeof window.closeCard === 'function') window.closeCard();
            if (typeof window.rfApp?.search?.closeSuggest === 'function') window.rfApp.search.closeSuggest();
        });

        console.log("🗺️ 地圖核心 v721 (純淨水滴對接版) 啟動成功");
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
                // 🌟 動態改變水滴底色，但不放入圖示
                let bgColor = 'var(--primary, #007bff)';
                if(spot.tags) {
                    if(spot.tags.includes('美食')) bgColor = '#e67e22';
                    else if(spot.tags.includes('歷史')) bgColor = '#8e44ad';
                    else if(spot.tags.includes('自然')) bgColor = '#27ae60';
                    else if(spot.tags.includes('自訂')) bgColor = '#e74c3c';
                }

                // 🌟 使用對應 V720 的 custom-marker-pin 結構
                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class='marker-pulse'></div><div class='custom-marker-pin' style='background: ${bgColor} !important;'></div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42],
                    popupAnchor: [0, -35]
                });
                
                const marker = L.marker([spot.lat, spot.lng], { icon: icon });
                const displayName = spot[`name_${lang}`] || spot.name;
                marker.bindTooltip(displayName, { direction: 'top', offset: [0, -35], opacity: 0.95 });
                
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

// ==========================================
// 🌟 圖層控制 API
// ==========================================
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
