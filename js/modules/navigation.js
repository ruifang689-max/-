import { state } from '../core/store.js';
import { routesData } from '../data/routes.js';
import { spots } from '../data/spots.js';
import { closeCard, showCard } from './cards.js';

export function initNavigation() {
    window.openRouteMenu = () => { document.getElementById('route-select-modal').style.display = 'flex'; };
    window.closeRouteMenu = () => { document.getElementById('route-select-modal').style.display = 'none'; };
    
    window.selectRoute = (routeKey) => { 
        window.closeRouteMenu(); if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); 
        const route = routesData[routeKey]; if(!route) return;
        state.currentRoute = L.polyline(route.coords, { color: route.color, weight: 6, dashArray: '10, 10' }).addTo(state.mapInstance); 
        state.mapInstance.fitBounds(state.currentRoute.getBounds(), { padding: [50, 50] }); 
        const btn = document.querySelector('.route-btn'); btn.innerHTML = '<i class="fas fa-times"></i>'; btn.onclick = window.clearRoute; btn.classList.add('active'); alert(`🚀 已啟動：${route.name}`); 
    };
    
    window.clearRoute = () => { 
        if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); state.currentRoute = null; 
        const btn = document.querySelector('.route-btn'); btn.innerHTML = '<i class="fas fa-route"></i>'; btn.onclick = window.openRouteMenu; btn.classList.remove('active'); alert('🏁 路線已關閉'); 
    };

    window.closeNav = () => { if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); document.getElementById('route-info-panel').style.display = 'none'; };
    window.changeNavMode = (mode) => { state.navMode = mode; document.querySelectorAll('.route-mode-btn').forEach(btn => btn.classList.remove('active')); document.getElementById(`mode-${mode}`).classList.add('active'); window.startNav(); };
    
    window.startNav = () => { 
        if(!state.userPos || !state.targetSpot) return alert("請開啟 GPS 定位"); 
        closeCard(); document.getElementById('route-time').innerText = "計算中..."; document.getElementById('route-dist').innerText = ""; document.getElementById('route-info-panel').style.display = 'flex'; 
        const profile = state.navMode === 'walking' ? 'foot' : 'driving'; 
        fetch(`https://router.project-osrm.org/route/v1/${profile}/${state.userPos.lng},${state.userPos.lat};${state.targetSpot.lng},${state.targetSpot.lat}?overview=full&geometries=geojson`)
        .then(r => r.json()).then(data => { 
            if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); 
            const route = data.routes[0]; const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); 
            const routeColor = state.navMode === 'walking' ? '#28a745' : 'var(--primary)'; 
            state.currentRoute = L.polyline(coords, {color: routeColor, weight: 8, dashArray: state.navMode==='walking'?'10,10':''}).addTo(state.mapInstance); 
            state.mapInstance.fitBounds(state.currentRoute.getBounds(), {padding: [80, 80]}); 
            document.getElementById('route-time').innerText = `${Math.round(route.duration / 60)} 分鐘`; document.getElementById('route-dist').innerText = `${(route.distance / 1000).toFixed(1)} km`; 
        }).catch(() => { document.getElementById('route-time').innerText = "路線規劃失敗"; }); 
    };

    window.toggleGuidedTour = () => { 
        const btn = document.getElementById('tour-btn'); const icon = btn.querySelector('i'); 
        if(state.tourModeInterval) { clearInterval(state.tourModeInterval); state.tourModeInterval = null; icon.className = 'fas fa-play'; icon.style.color = '#e84393'; btn.classList.remove('active'); closeCard(); alert('⏹️ 已停止導覽模式'); } 
        else { 
            icon.className = 'fas fa-stop'; icon.style.color = '#fff'; btn.classList.add('active'); let tourIndex = 0; alert('🎬 開始自動導覽！將帶您飛越熱門景點。'); 
            const playNext = () => { 
                if(tourIndex >= spots.length || !state.tourModeInterval) { clearInterval(state.tourModeInterval); state.tourModeInterval = null; icon.className='fas fa-play'; icon.style.color = '#e84393'; btn.classList.remove('active'); return; } 
                const s = spots[tourIndex]; state.mapInstance.flyTo([s.lat, s.lng], 16, { duration: 2 }); setTimeout(() => { if(state.tourModeInterval) showCard(s); }, 2000); tourIndex++; 
            }; 
            playNext(); state.tourModeInterval = setInterval(playNext, 8000); 
        } 
    };
}
