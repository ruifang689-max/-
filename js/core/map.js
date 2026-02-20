import { state } from '../core/store.js';

const mapLayers = [
    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
    { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', name: '交通', icon: 'fa-bus', dark: false },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', name: '地形', icon: 'fa-mountain', dark: false },
    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '夜間', icon: 'fa-moon', dark: true }
];

let currentLayerIdx = 0; 
let currentTileLayer = null;

export function initMap() {
    // 1. 終極防護罩：檢查地圖容器是否已經被初始化過
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
        console.warn("地圖已經存在，已攔截重複建立的指令！");
        return; 
    }

    // 2. 建立地圖實體
    state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 13);
    
    // 3. 載入動態底圖與比例尺
    currentTileLayer = L.tileLayer(mapLayers[0].url).addTo(state.mapInstance);
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(state.mapInstance);

    // 4. 建立標記叢集 (Cluster)
    state.cluster = L.markerClusterGroup(); 
    state.mapInstance.addLayer(state.cluster);

    // 5. 點擊地圖空白處，關閉資訊卡與推薦搜尋
    state.mapInstance.on('click', () => { 
        if (typeof window.closeCard === 'function') window.closeCard(); 
        if (typeof window.closeSuggest === 'function') window.closeSuggest(); 
        const sug = document.getElementById("suggest");
        if(sug) sug.style.display = "none";
    });

    // ==========================================
    // 6. 🌟 自動抓取並繪製「瑞芳區行政界線」 (最純淨請求版，避免觸發 CORS 預檢)
    // ==========================================
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search?q=瑞芳區,新北市,台灣&format=json&polygon_geojson=1&limit=1';
    
    // 👉 核心修改：直接 fetch 網址，絕對不要加 headers 大括號！
    fetch(nominatimUrl)
    .then(res => res.json())
    .then(data => {
        if (data && data.length > 0 && data[0].geojson) {
            L.geoJSON(data[0].geojson, {
                style: {
                    color: 'var(--primary)',     
                    weight: 3,                   
                    dashArray: '8, 12',          
                    fillColor: 'var(--primary)', 
                    fillOpacity: 0.04            
                },
                interactive: false 
            }).addTo(state.mapInstance);
        }
    })
    .catch(err => console.error("區界線載入失敗", err));

// 7. 切換底圖功能
export function toggleLayer() {
    currentLayerIdx = (currentLayerIdx + 1) % mapLayers.length; 
    const c = mapLayers[currentLayerIdx];
    state.mapInstance.removeLayer(currentTileLayer); 
    currentTileLayer = L.tileLayer(c.url).addTo(state.mapInstance);
    document.querySelector('#layer-btn i').className = `fas ${c.icon}`;
    c.dark ? document.body.classList.add("dark-mode") : document.body.classList.remove("dark-mode");
}
