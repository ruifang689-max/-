import { state } from '../core/store.js';

const mapLayers = [
    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
    { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', name: '交通', icon: 'fa-bus', dark: false },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', name: '地形', icon: 'fa-mountain', dark: false },
    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '夜間', icon: 'fa-moon', dark: true }
];

// 🌟 九大區域地理中心座標 (浮水印)
const ruifangRegions = [
    { name: "瑞芳市區", lat: 25.107, lng: 121.806 },
    { name: "九份", lat: 25.109, lng: 121.844 },
    { name: "金瓜石", lat: 25.107, lng: 121.859 },
    { name: "猴硐", lat: 25.086, lng: 121.826 },
    { name: "深澳", lat: 25.129, lng: 121.820 },
    { name: "水湳洞", lat: 25.121, lng: 121.864 },
    { name: "四腳亭", lat: 25.102, lng: 121.762 },
    { name: "三貂嶺", lat: 25.059, lng: 121.824 },
    { name: "鼻頭角", lat: 25.119, lng: 121.918 }
];

let currentLayerIdx = 0; 
let currentTileLayer = null;

export function initMap() {
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
        console.warn("地圖已經存在，已攔截重複建立的指令！");
        return; 
    }

    state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 13);
    
    currentTileLayer = L.tileLayer(mapLayers[0].url).addTo(state.mapInstance);
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(state.mapInstance);

    state.cluster = L.markerClusterGroup(); 
    state.mapInstance.addLayer(state.cluster);

    state.mapInstance.on('click', () => { 
        if (typeof window.closeCard === 'function') window.closeCard(); 
        if (typeof window.closeSuggest === 'function') window.closeSuggest(); 
        const sug = document.getElementById("suggest");
        if(sug) sug.style.display = "none";
    });

    // ==========================================
    // 🌟 繪製九大區域浮水印
    // ==========================================
    ruifangRegions.forEach(r => {
        L.marker([r.lat, r.lng], {
            icon: L.divIcon({
                className: 'region-label', 
                html: `<div class="region-label-text">${r.name}</div>`, 
                iconSize: [0, 0] 
            }),
            interactive: false 
        }).addTo(state.mapInstance);
    });

    // ==========================================
    // 🌟 穩健修復版：瑞芳區行政界線 (快取機制)
    // ==========================================
    const cacheKey = 'ruifang_boundary';
    const cachedData = localStorage.getItem(cacheKey);

    const drawBoundary = (geojsonData) => {
        L.geoJSON(geojsonData, {
            style: { color: 'var(--primary)', weight: 3, dashArray: '8, 12', fillColor: 'var(--primary)', fillOpacity: 0.04 },
            interactive: false 
        }).addTo(state.mapInstance);
    };

    if (cachedData) {
        drawBoundary(JSON.parse(cachedData));
    } else {
        fetch('https://nominatim.openstreetmap.org/search?q=瑞芳區,新北市,台灣&format=json&polygon_geojson=1&limit=1')
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0 && data[0].geojson) {
                localStorage.setItem(cacheKey, JSON.stringify(data[0].geojson));
                drawBoundary(data[0].geojson);
            }
        }).catch(err => console.log("界線載入中...", err));
    }
} // 👈 就是這個救命的右大括號，這次我幫您確實補上了！

export function toggleLayer() {
    currentLayerIdx = (currentLayerIdx + 1) % mapLayers.length; 
    const c = mapLayers[currentLayerIdx];
    state.mapInstance.removeLayer(currentTileLayer); 
    currentTileLayer = L.tileLayer(c.url).addTo(state.mapInstance);
    document.querySelector('#layer-btn i').className = `fas ${c.icon}`;
    c.dark ? document.body.classList.add("dark-mode") : document.body.classList.remove("dark-mode");
}
