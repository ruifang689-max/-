import { state } from './store.js';

export function initMap() {
    state.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 14);
    
    const mapLayers = [
        { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
        { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', name: '交通', icon: 'fa-bus', dark: false },
        { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', name: '地形', icon: 'fa-mountain', dark: false },
        { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '夜間', icon: 'fa-moon', dark: true }
    ];
    
    let currentLayerIdx = 0; 
    let currentTileLayer = L.tileLayer(mapLayers[0].url).addTo(state.mapInstance);
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(state.mapInstance);

    window.toggleLayer = function() {
        currentLayerIdx = (currentLayerIdx + 1) % mapLayers.length; 
        const c = mapLayers[currentLayerIdx];
        state.mapInstance.removeLayer(currentTileLayer); 
        currentTileLayer = L.tileLayer(c.url).addTo(state.mapInstance);
        document.querySelector('#layer-btn i').className = `fas ${c.icon}`;
        c.dark ? document.body.classList.add("dark-mode") : document.body.classList.remove("dark-mode");
    };
    
    state.cluster = L.markerClusterGroup(); 
    state.mapInstance.addLayer(state.cluster);
}
