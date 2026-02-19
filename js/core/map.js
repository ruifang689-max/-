// js/core/map.js (v409)
import { state } from './store.js';

export function initMap() {
    // 1. 終極防護罩
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
        console.warn("地圖已經存在，已攔截重複建立的指令！");
        return;
    }

    // 2. 建立地圖實體
    state.mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([25.1032, 121.8224], 13);

    // 3. 載入底圖
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(state.mapInstance);

    // ==========================================
    // 🌟 新增：自動抓取並繪製「瑞芳區行政界線」
    // ==========================================
    fetch('https://nominatim.openstreetmap.org/search?q=瑞芳區,新北市,台灣&format=json&polygon_geojson=1&limit=1')
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0 && data[0].geojson) {
                L.geoJSON(data[0].geojson, {
                    style: {
                        color: 'var(--primary)',     // 🌟 黑科技：線條顏色自動綁定您的主題色！
                        weight: 3,                   // 線條粗細
                        dashArray: '8, 12',          // 專業地圖常用的虛線樣式 (長度8, 間距12)
                        fillColor: 'var(--primary)', // 區域內部填充顏色
                        fillOpacity: 0.04            // 超薄的透明度，微微凸顯瑞芳區，但絕不干擾底圖閱讀
                    },
                    interactive: false // 🌟 關鍵：關閉這層的互動，讓滑鼠可以「穿透」界線，順利點擊下方的景點！
                }).addTo(state.mapInstance);
            }
        })
        .catch(err => console.error("區界線載入失敗", err));
}

const mapLayers = [
    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
    { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', name: '交通', icon: 'fa-bus', dark: false },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', name: '地形', icon: 'fa-mountain', dark: false },
    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '夜間', icon: 'fa-moon', dark: true }
];

let currentLayerIdx = 0; 
let currentTileLayer = null;

export function initMap() {
    // ==========================================
    // 🌟 終極防護罩：檢查地圖容器是否已經被初始化過
    // ==========================================
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
        console.warn("地圖已經存在，已攔截重複建立的指令！");
        return; // 直接中斷，不讓 Leaflet 報錯崩潰
    }
    state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 14);
    
    currentTileLayer = L.tileLayer(mapLayers[0].url).addTo(state.mapInstance);
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(state.mapInstance);

    state.cluster = L.markerClusterGroup(); 
    state.mapInstance.addLayer(state.cluster);

    // 🌟 補回遺失的功能：點擊地圖空白處，關閉資訊卡與推薦搜尋
    state.mapInstance.on('click', () => { 
        if (typeof window.closeCard === 'function') window.closeCard(); 
        if (typeof window.closeSuggest === 'function') window.closeSuggest(); 
        const sug = document.getElementById("suggest");
        if(sug) sug.style.display = "none";
    });
}

export function toggleLayer() {
    currentLayerIdx = (currentLayerIdx + 1) % mapLayers.length; 
    const c = mapLayers[currentLayerIdx];
    state.mapInstance.removeLayer(currentTileLayer); 
    currentTileLayer = L.tileLayer(c.url).addTo(state.mapInstance);
    document.querySelector('#layer-btn i').className = `fas ${c.icon}`;
    c.dark ? document.body.classList.add("dark-mode") : document.body.classList.remove("dark-mode");
}
