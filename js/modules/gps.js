import { state } from '../core/store.js';

export function initGPS() {
    const userPulseIcon = L.divIcon({ className: 'user-pulse-icon', html: '<div class="pulse"></div><div class="dot"></div>', iconSize: [40, 40], iconAnchor: [20, 20] });
    state.mapInstance.locate({setView: false, watch: true, enableHighAccuracy: true}); 
    
    state.mapInstance.on('locationfound', e => { 
        state.userPos = e.latlng; 
        document.getElementById("gps-val-text").innerText = `GPS: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`; 
        if(!state.userMarker) state.userMarker = L.marker(state.userPos, { icon: userPulseIcon }).addTo(state.mapInstance); 
        else state.userMarker.setLatLng(state.userPos); 
    });

    window.goToUser = function() { 
        if(state.userPos) { state.mapInstance.flyTo(state.userPos, 16); } 
        else { alert("📍 正在獲取定位...\n若無反應，請確認您已開啟定位權限！"); state.mapInstance.locate({setView: false, watch: true}); } 
    };
}
