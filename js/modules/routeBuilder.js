// js/modules/routeBuilder.js (優化加強版)
import { state } from '../core/store.js';
import { events } from '../core/events.js';

let routeLine = null;

export function initRouteBuilder() {
    if (!state.currentRoute) {
        state.currentRoute = [];
    }

    createRouteUIButton();

    // 🌟 優化：因為 main.js 是在地圖準備好後才呼叫此模組，所以可以直接繪製線條，不用等 app_ready 事件
    if (state.mapInstance) {
        routeLine = L.polyline([], { 
            color: 'var(--primary)', 
            weight: 5, 
            opacity: 0, 
            dashArray: '10, 10', 
            lineJoin: 'round'
        }).addTo(state.mapInstance);
    }

    window.rfApp = window.rfApp || {};
    window.rfApp.route = {
        addSpot: addSpotToRoute,
        removeSpot: removeSpotFromRoute,
        clear: clearRoute,
        togglePanel: toggleRoutePanel
    };
}

function createRouteUIButton() {
    if (document.getElementById('route-builder-btn')) return;

    const mapControls = document.querySelector('.map-controls.right');
    if (!mapControls) return;

    const btn = document.createElement('button');
    btn.id = 'route-builder-btn';
    btn.className = 'control-btn';
    btn.innerHTML = `<i class="fas fa-route"></i><span id="route-count-badge" class="badge" style="display:none;">0</span>`;
    btn.title = "自訂行程規劃";
    btn.onclick = toggleRoutePanel;

    mapControls.insertBefore(btn, mapControls.firstChild);
}

function addSpotToRoute(spotName) {
    // 🌟 優化：合併官方景點與自訂景點，這樣連使用者自己新增的秘境都能排進行程！
    const allSpots = [
        ...(window.GLOBAL_SPOTS_DATA || []), 
        ...(state.savedCustomSpots || [])
    ];
    
    const spotData = allSpots.find(s => s.name === spotName);
    
    if (!spotData) {
        if(typeof window.showToast === 'function') window.showToast("找不到該景點的資料", "error");
        return;
    }

    if (state.currentRoute.some(s => s.name === spotName)) {
        if(typeof window.showToast === 'function') window.showToast("此景點已在行程中！", "info");
        return;
    }

    state.currentRoute.push(spotData);
    
    if(typeof window.showToast === 'function') window.showToast(`✅ 已將「${spotName}」加入行程`, "success");
    
    updateRouteUI();
}

function removeSpotFromRoute(spotName) {
    state.currentRoute = state.currentRoute.filter(s => s.name !== spotName);
    updateRouteUI();
}

function clearRoute() {
    if(state.currentRoute.length === 0) return;
    if(confirm("確定要清空目前的行程規劃嗎？")) {
        state.currentRoute = [];
        updateRouteUI();
        if(typeof window.showToast === 'function') window.showToast("行程已清空", "info");
    }
}

function updateRouteUI() {
    const count = state.currentRoute.length;
    
    const badge = document.getElementById('route-count-badge');
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        
        const btn = document.getElementById('route-builder-btn');
        if (btn) {
            btn.style.color = count > 0 ? 'var(--primary)' : 'var(--text-main)';
        }
    }

    if (routeLine && state.mapInstance) {
        if (count >= 2) {
            const latlngs = state.currentRoute.map(spot => [spot.lat, spot.lng]);
            routeLine.setLatLngs(latlngs);
            routeLine.setStyle({ opacity: 0.8 }); 
            
            state.mapInstance.fitBounds(routeLine.getBounds(), { padding: [50, 50], animate: true });
        } else {
            routeLine.setStyle({ opacity: 0 });
            routeLine.setLatLngs([]);
        }
    }
    
    renderRoutePanelContent();
}

function toggleRoutePanel() {
    let panel = document.getElementById('route-panel');
    
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'route-panel';
        panel.className = 'glass-panel floating-panel'; 
        Object.assign(panel.style, {
            position: 'absolute', top: '70px', left: '10px', 
            width: '300px', maxHeight: '60vh', overflowY: 'auto',
            zIndex: 1000, padding: '15px', display: 'none',
            borderRadius: '12px'
        });
        
        document.body.appendChild(panel);
    }

    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        renderRoutePanelContent();
    } else {
        panel.style.display = 'none';
    }
}

function renderRoutePanelContent() {
    const panel = document.getElementById('route-panel');
    if (!panel) return;

    if (state.currentRoute.length === 0) {
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0;">自訂行程</h3>
                <button onclick="rfApp.route.togglePanel()" style="background:none; border:none; font-size:18px; cursor:pointer;">&times;</button>
            </div>
            <p style="color:var(--text-muted); font-size:14px;">您的行程目前是空的喔！<br>請點擊景點卡片上的「加入行程」來開始規劃。</p>
        `;
        return;
    }

    let totalDist = 0;
    if (state.mapInstance && state.currentRoute.length > 1) {
        for (let i = 0; i < state.currentRoute.length - 1; i++) {
            const p1 = L.latLng(state.currentRoute[i].lat, state.currentRoute[i].lng);
            const p2 = L.latLng(state.currentRoute[i+1].lat, state.currentRoute[i+1].lng);
            totalDist += state.mapInstance.distance(p1, p2);
        }
    }
    const distStr = totalDist > 1000 ? (totalDist/1000).toFixed(1) + ' 公里' : Math.round(totalDist) + ' 公尺';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h3 style="margin:0;">自訂行程</h3>
            <button onclick="rfApp.route.togglePanel()" style="background:none; border:none; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">直線總距離：約 ${distStr}</p>
        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
    `;

    state.currentRoute.forEach((spot, index) => {
        html += `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="display:inline-block; width:20px; height:20px; background:var(--primary); color:white; border-radius:50%; text-align:center; line-height:20px; font-size:12px;">${index+1}</span>
                    <span style="font-size:14px; font-weight:bold;">${spot.name}</span>
                </div>
                <button onclick="rfApp.route.removeSpot('${spot.name}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
            </li>
        `;
    });

    html += `
        </ul>
        <button onclick="rfApp.route.clear()" class="danger" style="width:100%; margin-top:15px; padding:8px; border-radius:8px;">清空行程</button>
    `;

    panel.innerHTML = html;
}