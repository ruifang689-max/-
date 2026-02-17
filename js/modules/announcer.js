import { state } from '../core/store.js';

export function initAnnouncer() {
    let geocodeTimer = null;
    state.mapInstance.on('movestart', () => { document.getElementById("addr-text").style.opacity = '0.5'; });
    state.mapInstance.on('moveend', function() {
        clearTimeout(geocodeTimer); 
        document.getElementById("addr-text").innerText = "定位中..."; 
        document.getElementById("addr-text").style.opacity = '1';
        geocodeTimer = setTimeout(() => {
            const center = state.mapInstance.getCenter();
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=18&addressdetails=1&accept-language=zh-TW`)
            .then(res => res.json())
            .then(data => { 
                if (data && data.address) { 
                    const a = data.address; 
                    document.getElementById("addr-text").innerText = ((a.road||"") + (a.village||a.suburb||a.district||"")) || "探索瑞芳中..."; 
                } 
            }).catch(()=>{ document.getElementById("addr-text").innerText = "探索瑞芳中..."; }); 
        }, 600); 
    });
}
