// js/modules/navigation.js (v648) - 現代化重構與除錯版
import { state } from '../core/store.js';
import { routesData } from '../data/routes.js';
import { spots } from '../data/spots.js';
import { closeCard, showCard } from './cards.js';

export function initNavigation() {
    
    // 🌟 1. 將所有方法收納進 rfApp.nav 命名空間
    window.rfApp.nav.openRouteMenu = () => { 
        const m = document.getElementById('route-select-modal');
        if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
    };
    
    window.rfApp.nav.closeRouteMenu = () => { 
        const m = document.getElementById('route-select-modal');
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); }
    };
    
    window.rfApp.nav.selectRoute = (routeKey) => { 
        window.rfApp.nav.closeRouteMenu(); 
        if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); 
        
        const route = routesData[routeKey]; 
        if(!route) return;
        
        state.currentRoute = L.polyline(route.coords, { color: route.color, weight: 6, dashArray: '10, 10' }).addTo(state.mapInstance); 
        state.mapInstance.fitBounds(state.currentRoute.getBounds(), { padding: [50, 50] }); 
        
        const btn = document.querySelector('.route-btn'); 
        if(btn) {
            btn.innerHTML = '<i class="fas fa-times"></i>'; 
            btn.onclick = window.rfApp.nav.clearRoute; 
            btn.classList.add('active'); 
        }
        
        // 🌟 替換原生 alert 為精美的 Toast
        if (typeof window.showToast === 'function') window.showToast(`🚀 已啟動：${route.name}`, 'success');
    };
    
    window.rfApp.nav.clearRoute = () => { 
        if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); 
        state.currentRoute = null; 
        
        const btn = document.querySelector('.route-btn'); 
        if(btn) {
            btn.innerHTML = '<i class="fas fa-route"></i>'; 
            btn.onclick = window.rfApp.nav.openRouteMenu; 
            btn.classList.remove('active'); 
        }
        
        if (typeof window.showToast === 'function') window.showToast('🏁 路線已關閉', 'info');
    };

    window.rfApp.nav.closeNav = () => { 
        if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); 
        const p = document.getElementById('route-info-panel');
        if(p) { p.classList.remove('u-flex'); p.classList.add('u-hidden'); }
    };
    
    window.rfApp.nav.changeNavMode = (mode) => { 
        state.navMode = mode; 
        document.querySelectorAll('.route-mode-btn').forEach(btn => btn.classList.remove('active')); 
        const activeBtn = document.getElementById(`mode-${mode}`);
        if(activeBtn) activeBtn.classList.add('active'); 
        
        window.rfApp.nav.startNav(state._tempNavLat, state._tempNavLng); 
    };
    
    // 🌟 2. 核心修復：使用最新的 state.userLocation，並優化錯誤處理
    window.rfApp.nav.startNav = (lat, lng) => { 
        // 🚨 重大 Bug 修復：將 state.userPos 改為 state.userLocation
        if(!state.userLocation) {
            if (typeof window.showToast === 'function') window.showToast("請先開啟左下角的 GPS 定位功能！", "error");
            return;
        }
        
        const targetLat = lat || (state.targetSpot ? state.targetSpot.lat : null);
        const targetLng = lng || (state.targetSpot ? state.targetSpot.lng : null);
        
        if (!targetLat || !targetLng) {
            if (typeof window.showToast === 'function') window.showToast("請先選擇一個目的地！", "error");
            return;
        }

        state._tempNavLat = targetLat;
        state._tempNavLng = targetLng;

        if(typeof window.closeCard === 'function') window.closeCard(); 
        
        const p = document.getElementById('route-info-panel');
        if(p) { p.classList.remove('u-hidden'); p.classList.add('u-flex'); }
        
        const timeEl = document.getElementById('route-time');
        const distEl = document.getElementById('route-dist');
        if(timeEl) timeEl.innerText = "路線計算中..."; 
        if(distEl) distEl.innerText = ""; 
        
        const profile = state.navMode === 'walking' ? 'foot' : 'driving'; 
        const fetchUrl = `https://router.project-osrm.org/route/v1/${profile}/${state.userLocation.lng},${state.userLocation.lat};${targetLng},${targetLat}?overview=full&geometries=geojson`;

        fetch(fetchUrl)
        .then(r => r.json())
        .then(data => { 
            if(state.currentRoute) state.mapInstance.removeLayer(state.currentRoute); 
            const route = data.routes[0]; 
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); 
            const routeColor = state.navMode === 'walking' ? '#28a745' : 'var(--primary)'; 
            
            state.currentRoute = L.polyline(coords, {
                color: routeColor, 
                weight: 8, 
                dashArray: state.navMode === 'walking' ? '10,10' : ''
            }).addTo(state.mapInstance); 
            
            state.mapInstance.fitBounds(state.currentRoute.getBounds(), {padding: [80, 80]}); 
            
            if(timeEl) timeEl.innerText = `${Math.round(route.duration / 60)} 分鐘`; 
            if(distEl) distEl.innerText = `${(route.distance / 1000).toFixed(1)} km`; 
        })
        .catch(() => { 
            if(timeEl) timeEl.innerText = "路線規劃失敗，請檢查網路連線"; 
            if (typeof window.showToast === 'function') window.showToast("無法連接路線伺服器", "error");
        }); 
    };

    window.rfApp.nav.toggleGuidedTour = () => { 
        const btn = document.getElementById('tour-btn'); 
        if(!btn) return;
        
        const icon = btn.querySelector('i'); 
        
        if(state.tourModeInterval) { 
            clearInterval(state.tourModeInterval); 
            state.tourModeInterval = null; 
            if(icon) { icon.className = 'fas fa-play'; icon.style.color = '#e84393'; }
            btn.classList.remove('active'); 
            closeCard(); 
            if (typeof window.showToast === 'function') window.showToast('⏹️ 已停止自動導覽', 'info');
        } else { 
            if(icon) { icon.className = 'fas fa-stop'; icon.style.color = '#fff'; }
            btn.classList.add('active'); 
            let tourIndex = 0; 
            if (typeof window.showToast === 'function') window.showToast('🎬 開始自動導覽！將帶您飛越熱門景點', 'success');
            
            const playNext = () => { 
                if(tourIndex >= spots.length || !state.tourModeInterval) { 
                    clearInterval(state.tourModeInterval); 
                    state.tourModeInterval = null; 
                    if(icon) { icon.className = 'fas fa-play'; icon.style.color = '#e84393'; }
                    btn.classList.remove('active'); 
                    return; 
                } 
                const s = spots[tourIndex]; 
                state.mapInstance.flyTo([s.lat, s.lng], 16, { duration: 2 }); 
                setTimeout(() => { if(state.tourModeInterval) showCard(s); }, 2000); 
                tourIndex++; 
            }; 
            playNext(); 
            state.tourModeInterval = setInterval(playNext, 8000); 
        } 
    };

    // 🌟 3. 向下相容：為了讓 HTML 裡寫死的 onclick="..." 依然能動，我們做一個橋樑
    window.openRouteMenu = window.rfApp.nav.openRouteMenu;
    window.closeRouteMenu = window.rfApp.nav.closeRouteMenu;
    window.selectRoute = window.rfApp.nav.selectRoute;
    window.clearRoute = window.rfApp.nav.clearRoute;
    window.closeNav = window.rfApp.nav.closeNav;
    window.changeNavMode = window.rfApp.nav.changeNavMode;
    window.startNav = window.rfApp.nav.startNav;
    window.toggleGuidedTour = window.rfApp.nav.toggleGuidedTour;
}
