/**
 * app.js - 核心邏輯層
 * 負責：PWA、地圖操作、UI 互動、天氣與功能實作
 * 相依：必須先載入 data.js
 */

// =========================================
// 0. PWA 與 iOS 支援
// =========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) { for(let registration of registrations) { registration.update(); } });
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); });
}
let deferredPrompt;
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const installBtn = document.getElementById('install-btn-container'); if (installBtn) installBtn.style.display = 'block';
});
function installPWA() {
    if (isIos() && !isStandalone()) { document.getElementById('ios-instruction-modal').style.display = 'flex'; closeSettings(); return; }
    if (!deferredPrompt) return; document.getElementById('install-btn-container').style.display = 'none';
    deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
}
function closeIosInstruction() { document.getElementById('ios-instruction-modal').style.display = 'none'; }

// =========================================
// 1. 初始化設定 (語言與主題)
// =========================================
let currentLang = localStorage.getItem('ruifang_lang') || 'zh';
function applyLanguage(lang) {
    currentLang = lang; localStorage.setItem('ruifang_lang', lang);
    const t = translations[lang] || translations['zh']; 
    document.getElementById('search').placeholder = t.search_ph; document.getElementById('addr-text').innerText = t.locating;
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (t[key]) { if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t[key]; else { const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/); el.innerHTML = iconMatch ? iconMatch[0] + ' ' + t[key] : t[key]; } } });
    document.getElementById('lang-select-startup').value = lang; document.getElementById('lang-select-settings').value = lang;
    if(targetSpot && document.getElementById("card").classList.contains("open")) renderCardButtons(targetSpot, t);
}

function changeTheme(color) { 
    if (color === 'custom') { document.getElementById('custom-color-picker').style.display = 'block'; document.getElementById('custom-color-picker').click(); } 
    else if (color === 'default') { document.getElementById('custom-color-picker').style.display = 'none'; applyCustomTheme('#007bff', false); localStorage.setItem('ruifang_theme', 'default'); } 
    else { document.getElementById('custom-color-picker').style.display = 'none'; applyCustomTheme(color, true); } 
}
function applyCustomTheme(color, syncIntro = false) { 
    document.documentElement.style.setProperty('--primary', color); document.documentElement.style.setProperty('--logo-border', color); 
    if (syncIntro) { document.documentElement.style.setProperty('--intro-color', color); if(color !== '#007bff') localStorage.setItem('ruifang_theme', color); } 
    else { document.documentElement.style.setProperty('--intro-color', '#111111'); }
    const themeSelect = document.getElementById('theme-select'); 
    if(color === '#007bff' && !syncIntro) themeSelect.value = 'default'; else if([...themeSelect.options].some(o => o.value === color)) themeSelect.value = color; else themeSelect.value = 'custom'; 
}

// =========================================
// 2. UI 互動邏輯 (Modal, Tutorial)
// =========================================
function openSettings() { document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal-overlay').style.display = 'none'; }
function toggleSkipIntro(isChecked) { localStorage.setItem('ruifang_skip_intro', isChecked ? 'true' : 'false'); }
function reopenTutorial() { closeSettings(); document.getElementById('tutorial-overlay').style.display = 'flex'; setTimeout(() => { document.getElementById('tutorial-overlay').style.opacity = '1'; }, 50); document.getElementById('tut-step-1').style.display = 'block'; document.getElementById('tut-step-2').style.display = 'none'; }

function enterMap() { document.getElementById('welcome-screen').style.opacity = '0'; setTimeout(() => { document.getElementById('welcome-screen').style.display = 'none'; document.getElementById('tutorial-overlay').style.display = 'flex'; setTimeout(() => { document.getElementById('tutorial-overlay').style.opacity = '1'; }, 50); }, 400); }
function nextTutorial() { document.getElementById('tut-step-1').style.display = 'none'; document.getElementById('tut-step-2').style.display = 'block'; }
function prevTutorial() { document.getElementById('tut-step-2').style.display = 'none'; document.getElementById('tut-step-1').style.display = 'block'; }
function finishTutorial() { document.getElementById('tutorial-overlay').style.opacity = '0'; setTimeout(() => { document.getElementById('tutorial-overlay').style.display = 'none'; localStorage.setItem('ruifang_welcomed', 'true'); if (typeof window.mapInstance !== 'undefined') window.mapInstance.invalidateSize(); }, 400); }

function shareSpot() { if(!targetSpot) return; const spotUrl = new URL(window.location.href.split('?')[0]); spotUrl.searchParams.set('spot', targetSpot.name); const shareData = { title: `瑞芳導覽地圖 - ${targetSpot.name}`, text: `我在瑞芳發現了「${targetSpot.name}」！\n點擊查看：`, url: spotUrl.toString() }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 已複製景點連結！')); }
function shareAppMap() { const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); }

// =========================================
// 3. 地圖引擎 (Map Engine)
// =========================================
window.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 14);
const mapLayers = [
    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
    { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', name: '交通', icon: 'fa-bus', dark: false },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', name: '地形', icon: 'fa-mountain', dark: false },
    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '夜間', icon: 'fa-moon', dark: true }
];
let currentLayerIdx = 0; let currentTileLayer = L.tileLayer(mapLayers[0].url).addTo(window.mapInstance);
L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(window.mapInstance);

function toggleLayer() {
    currentLayerIdx = (currentLayerIdx + 1) % mapLayers.length; const c = mapLayers[currentLayerIdx];
    window.mapInstance.removeLayer(currentTileLayer); currentTileLayer = L.tileLayer(c.url).addTo(window.mapInstance);
    document.querySelector('#layer-btn i').className = `fas ${c.icon}`;
    if (c.dark) document.body.classList.add("dark-mode"); else document.body.classList.remove("dark-mode");
}

window.mapInstance.on('click', () => { closeCard(); document.getElementById("suggest").style.display = "none"; });
const userPulseIcon = L.divIcon({ className: 'user-pulse-icon', html: '<div class="pulse"></div><div class="dot"></div>', iconSize: [40, 40], iconAnchor: [20, 20] });
window.mapInstance.locate({setView: false, watch: true, enableHighAccuracy: true}); 
window.mapInstance.on('locationfound', e => { userPos = e.latlng; document.getElementById("gps-val-text").innerText = `GPS: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`; if(!userMarker) userMarker = L.marker(userPos, { icon: userPulseIcon }).addTo(window.mapInstance); else userMarker.setLatLng(userPos); });

let geocodeTimer = null;
let isFetching = false; // 加入鎖定狀態，防止重複請求

window.mapInstance.on('movestart', () => { 
    document.getElementById("addr-text").style.opacity = '0.5'; 
});

window.mapInstance.on('moveend', function() {
    clearTimeout(geocodeTimer); 
    document.getElementById("addr-text").innerText = "定位中..."; 
    document.getElementById("addr-text").style.opacity = '1';
    
    // 🌟 延遲增加到 1.5 秒，並檢查是否正在請求中
    geocodeTimer = setTimeout(() => {
        if(isFetching) return;
        isFetching = true;

        const center = window.mapInstance.getCenter();
        // 加入 Accept-Language 標頭嘗試改善
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`, {
            headers: { 'Accept-Language': 'zh-TW' } 
        })
        .then(res => { 
            if (!res.ok) throw new Error('Network response was not ok'); 
            return res.json(); 
        })
        .then(data => { 
            if (data && data.address) { 
                const a = data.address; 
                // 優先顯示順序：路名 > 村里 > 區域
                const text = (a.road || a.village || a.suburb || a.hamlet || "瑞芳山城");
                document.getElementById("addr-text").innerText = text; 
            }
        })
        .catch((e) => { 
            // 🌟 失敗時優雅降級，顯示預設文字，不報紅字
            console.warn("地理編碼暫時無法使用 (流量限制)"); 
            document.getElementById("addr-text").innerText = "探索瑞芳中..."; 
        })
        .finally(() => {
            isFetching = false; // 解除鎖定
        });
    }, 1500); 
});

// =========================================
// 4. 圖釘與渲染 (Markers & Rendering)
// =========================================
const cluster = L.markerClusterGroup(); window.mapInstance.addLayer(cluster);
function calculateWalk(lat, lng) { if(!userPos) return "--"; const mins = Math.round(window.mapInstance.distance(userPos, [lat, lng]) / 80); return mins < 1 ? "1分內" : `約 ${mins} 分`; }
const createCustomPin = (tags, name) => { let cls = 'fa-map-marker-alt', col = '#007bff'; if (tags.includes('美食')) { cls = 'fa-utensils'; col = '#e67e22'; } else if (tags.includes('歷史')) { cls = 'fa-landmark'; col = '#8e44ad'; } else if (tags.includes('自然')) { cls = 'fa-leaf'; col = '#27ae60'; } else if (tags.includes('自訂')) { cls = 'fa-star'; col = '#ff4757'; } return L.divIcon({ className: 'custom-pin-wrap', html: `<div class="gmap-pin" style="background-color:${col}"><i class="fas ${cls}"></i></div><div class="pin-label">${name}</div>`, iconSize: [32,32], iconAnchor: [16,16], popupAnchor: [0,-25] }); };

function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200; const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';
    ctx.fillStyle = color; ctx.fillRect(0, 0, 400, 200); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 200, 100);
    return canvas.toDataURL('image/jpeg', 0.8);
}

function addMarkerToMap(s) {
    if (!s.tags.includes('自訂') && !s.wikiImg) fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(s.name)}`).then(r=>r.json()).then(d=>{s.wikiImg=d.thumbnail?.source;}).catch(()=>{});
    const m = L.marker([s.lat, s.lng], { icon: createCustomPin(s.tags, s.name) });
    m.bindPopup(() => {
        const img = s.wikiImg || getPlaceholderImage(s.name);
        const foodIcon = s.tags.includes('自訂') ? 'fa-star' : 'fa-utensils'; const foodText = s.tags.includes('自訂') ? '自訂地點' : `美食：${s.food || '--'}`;
        return `<div class="preview-card"><img class="preview-img" src="${img}" onerror="this.src='${getPlaceholderImage(s.name)}'"><div class="preview-info"><div class="preview-header"><span class="preview-title">${s.name}</span><span class="walk-badge"><i class="fas fa-walking"></i> ${calculateWalk(s.lat, s.lng)}</span></div><div class="preview-tag-box">${s.tags.map(t=>`<span class="mini-tag">${t}</span>`).join('')}</div><div class="food-preview"><i class="fas ${foodIcon}"></i> ${foodText}</div></div></div>`;
    }, { closeButton: false, offset: [0, -5] });
    m.on('mouseover', function() { this.openPopup(); }); m.on('mouseout', function() { this.closePopup(); }); 
    m.on('click', function(e) { L.DomEvent.stopPropagation(e); this.closePopup(); showCard(s); }); 
    s.markerObj = m; cluster.addLayer(m);
}
spots.forEach(addMarkerToMap); savedCustomSpots.forEach(s => { spots.push(s); addMarkerToMap(s); });

function filterSpots(category, element) {
    if(element) { document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); element.classList.add('active'); }
    cluster.clearLayers(); const filteredSpots = category === 'all' ? spots.concat(savedCustomSpots) : spots.concat(savedCustomSpots).filter(s => s.tags.includes(category)); filteredSpots.forEach(addMarkerToMap); closeCard();
}

// =========================================
// 5. 資訊卡與功能 (Card & Functions)
// =========================================
function showCard(s) {
    targetSpot = s; document.getElementById("card-fav-icon").className = myFavs.includes(s.name) ? "fas fa-heart active" : "fas fa-heart";
    document.getElementById("title").innerText = s.name; 
    const imgEl = document.getElementById("img"); imgEl.src = s.wikiImg || getPlaceholderImage(s.name); imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); }; 
    document.getElementById("card-tags").innerHTML = s.tags.map(t => `<span class="info-tag">${t}</span>`).join('');
    document.getElementById("card-food").innerText = s.food || "--"; document.getElementById("card-highlights").innerText = s.highlights || "暫無介紹";
    document.getElementById("card-history").innerText = s.history || "無"; document.getElementById("card-transport").innerText = s.transport || "自行前往";
    renderCardButtons(s); document.getElementById("card").classList.add("open"); document.getElementById("card").style.transform = '';
}
function openCardByName(name) { const s = spots.concat(savedCustomSpots).find(x => x.name === name); if(s) showCard(s); }
function closeCard() { document.getElementById("card").classList.remove("open"); document.getElementById("card").style.transform = ''; }
const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; 
cardEl.addEventListener('touchstart', (e) => { if(cardEl.scrollTop===0){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }},{passive:true}); 
cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); 
cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});

// =========================================
// 6. 導航、路線與天氣
// =========================================
function resetNorth() { window.mapInstance.flyTo([25.1032, 121.8224], 14); } 
function goToUser() { if(userPos) { window.mapInstance.flyTo(userPos, 16); } else { alert("📍 正在獲取定位...\n若無反應，請確認您已開啟手機與瀏覽器的 GPS 定位權限！"); window.mapInstance.locate({setView: false, watch: true, enableHighAccuracy: true}); } } 
function goToStation() { const ruiIcon = document.querySelector('.rui-icon'); if(ruiIcon){ ruiIcon.classList.remove('stamped'); void ruiIcon.offsetWidth; ruiIcon.classList.add('stamped'); } window.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); } 
function aiTrip() { if(!userPos) return alert("等待 GPS 定位..."); const sorted = spots.concat(savedCustomSpots).sort((a,b) => window.mapInstance.distance(userPos,[a.lat,a.lng]) - window.mapInstance.distance(userPos,[b.lat,b.lng])); alert("🤖 AI 推薦最近景點：\n" + sorted.slice(0,5).map((s,i) => `${i+1}. ${s.name}`).join("\n")); }

function openRouteMenu() { document.getElementById('route-select-modal').style.display = 'flex'; }
function closeRouteMenu() { document.getElementById('route-select-modal').style.display = 'none'; }
function selectRoute(routeKey) {
    closeRouteMenu(); if(currentRoute) window.mapInstance.removeLayer(currentRoute); 
    const route = routesData[routeKey]; if(!route) return;
    currentRoute = L.polyline(route.coords, { color: route.color, weight: 6, dashArray: '10, 10' }).addTo(window.mapInstance); 
    window.mapInstance.fitBounds(currentRoute.getBounds(), { padding: [50, 50] }); 
    const btn = document.querySelector('.route-btn'); btn.innerHTML = '<i class="fas fa-times"></i>'; btn.onclick = clearRoute; btn.classList.add('active');
    alert(`🚀 已啟動：${route.name}`);
}
function clearRoute() {
    if(currentRoute) window.mapInstance.removeLayer(currentRoute); currentRoute = null;
    const btn = document.querySelector('.route-btn'); btn.innerHTML = '<i class="fas fa-route"></i>'; btn.onclick = openRouteMenu; btn.classList.remove('active');
    alert('🏁 路線已關閉');
}

function closeNav() { if(currentRoute) window.mapInstance.removeLayer(currentRoute); document.getElementById('route-info-panel').style.display = 'none'; }
function changeNavMode(mode) { navMode = mode; document.querySelectorAll('.route-mode-btn').forEach(btn => btn.classList.remove('active')); document.getElementById(`mode-${mode}`).classList.add('active'); startNav(); }
function startNav() {
    if(!userPos || !targetSpot) return alert("請開啟 GPS 定位"); 
    closeCard(); document.getElementById('route-time').innerText = "計算中..."; document.getElementById('route-dist').innerText = ""; document.getElementById('route-info-panel').style.display = 'flex';
    const profile = navMode === 'walking' ? 'foot' : 'driving';
    fetch(`https://router.project-osrm.org/route/v1/${profile}/${userPos.lng},${userPos.lat};${targetSpot.lng},${targetSpot.lat}?overview=full&geometries=geojson`)
    .then(r => r.json()).then(data => { 
        if(currentRoute) window.mapInstance.removeLayer(currentRoute); 
        const route = data.routes[0]; const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); 
        const routeColor = navMode === 'walking' ? '#28a745' : 'var(--primary)';
        currentRoute = L.polyline(coords, {color: routeColor, weight: 8, dashArray: navMode==='walking'?'10,10':''}).addTo(window.mapInstance); 
        window.mapInstance.fitBounds(currentRoute.getBounds(), {padding: [80, 80]}); 
        document.getElementById('route-time').innerText = `${Math.round(route.duration / 60)} 分鐘`; 
        document.getElementById('route-dist').innerText = `${(route.distance / 1000).toFixed(1)} km`; 
    }).catch(() => { document.getElementById('route-time').innerText = "路線規劃失敗"; });
}

function toggleGuidedTour() {
    const btn = document.getElementById('tour-btn'); const icon = btn.querySelector('i');
    if(tourModeInterval) { clearInterval(tourModeInterval); tourModeInterval = null; icon.className = 'fas fa-play'; icon.style.color = '#e84393'; btn.classList.remove('active'); closeCard(); alert('⏹️ 已停止導覽模式'); } 
    else {
        icon.className = 'fas fa-stop'; icon.style.color = '#fff'; btn.classList.add('active'); let tourIndex = 0; alert('🎬 開始自動導覽！將帶您飛越熱門景點。');
        const playNext = () => {
            if(tourIndex >= spots.length || !tourModeInterval) { clearInterval(tourModeInterval); tourModeInterval = null; icon.className='fas fa-play'; icon.style.color = '#e84393'; btn.classList.remove('active'); return; }
            const s = spots[tourIndex]; window.mapInstance.flyTo([s.lat, s.lng], 16, { duration: 2 });
            setTimeout(() => { if(tourModeInterval) showCard(s); }, 2000); tourIndex++;
        };
        playNext(); tourModeInterval = setInterval(playNext, 8000); 
    }
}

// =========================================
// 7. 搜尋、收藏與編輯
// =========================================
const searchInput = document.getElementById("search"); const sugBox = document.getElementById("suggest");
searchInput.addEventListener('focus', () => { if(!searchInput.value.trim()) renderDefaultSearch(); });
function closeSuggest() { sugBox.style.display = "none"; }
function saveSearchHistory(name) { searchHistory = searchHistory.filter(h => h !== name); searchHistory.unshift(name); if(searchHistory.length > 5) searchHistory.pop(); localStorage.setItem('ruifang_search_history', JSON.stringify(searchHistory)); }
function renderDefaultSearch() { 
    const c = document.getElementById("suggest-content"); c.innerHTML = ""; 
    if(searchHistory.length > 0) { 
        c.innerHTML += `<div class="search-section-title"><span>🕒 歷史搜尋</span> <span class="clear-history-btn" onclick="clearHistory()"><i class="fas fa-trash"></i> 清除</span></div>`; 
        searchHistory.forEach(h => { c.innerHTML += `<div class="list-item" onclick="triggerSearch('${h}')"><span><i class="fas fa-history" style="color:#aaa;"></i> ${h}</span></div>`; }); 
    } 
    c.innerHTML += `<div class="search-section-title">⭐ 推薦景點</div>`; 
    ["九份老街", "猴硐貓村", "水湳洞陰陽海"].forEach(r => { c.innerHTML += `<div class="list-item" onclick="triggerSearch('${r}')"><span><i class="fas fa-fire" style="color:#e74c3c;"></i> ${r}</span></div>`; }); 
    sugBox.style.display = "block"; 
}
function clearHistory() { searchHistory = []; localStorage.setItem('ruifang_search_history', JSON.stringify([])); renderDefaultSearch(); }
function triggerSearch(name) { searchInput.value = name; sugBox.style.display = "none"; const s = spots.concat(savedCustomSpots).find(x => x.name === name); if(s) { window.mapInstance.flyTo([s.lat, s.lng], 16); setTimeout(() => showCard(s), 800); } }
searchInput.addEventListener('input', function() { 
    const k = this.value.trim(); const c = document.getElementById("suggest-content"); 
    if(!k) { renderDefaultSearch(); return; } c.innerHTML = ""; 
    const matches = spots.concat(savedCustomSpots).filter(s => s.name.includes(k) || s.tags.some(t => t.includes(k)) || (s.keywords && s.keywords.some(kw => kw.includes(k)))); 
    if(matches.length > 0) { sugBox.style.display = "block"; matches.forEach(s => { const div = document.createElement("div"); div.className = "list-item"; div.innerHTML = `<span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span>`; div.onclick = () => { saveSearchHistory(s.name); triggerSearch(s.name); }; c.appendChild(div); }); } else { sugBox.style.display = "none"; } 
});

function toggleCurrentFav() { if(!targetSpot) return; const idx = myFavs.indexOf(targetSpot.name); if(idx === -1) myFavs.push(targetSpot.name); else myFavs.splice(idx, 1); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); document.getElementById("card-fav-icon").className = myFavs.includes(targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; }
function toggleFavList() { 
    const p = document.getElementById("fav-list-panel"); 
    if(p.style.display === "block") { p.style.display = "none"; } else { 
        p.innerHTML = ""; 
        if(myFavs.length === 0) { p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; } else { myFavs.forEach(name => { const div = document.createElement("div"); div.className = "list-item"; div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; div.onclick = () => { triggerSearch(name); p.style.display = "none"; }; p.appendChild(div); }); } 
        const manageBtn = document.createElement('div'); manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);"; manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾"; manageBtn.onclick = () => { p.style.display = "none"; openFavManage(); }; p.appendChild(manageBtn);
        p.style.display = "block"; 
    } 
}
function openFavManage() { document.getElementById('fav-manage-modal').style.display = 'flex'; renderFavManageList(); }
function closeFavManage() { document.getElementById('fav-manage-modal').style.display = 'none'; }
function renderFavManageList() {
    const listEl = document.getElementById('fav-manage-list'); listEl.innerHTML = '';
    if (myFavs.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; return; }
    myFavs.forEach((name, idx) => {
        const item = document.createElement('div'); item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px;";
        item.innerHTML = `<span style="font-weight:bold; color:var(--text-main); font-size:14px;">${name}</span> <div style="display:flex; gap:6px;"> <button onclick="moveFav(${idx}, -1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button> <button onclick="moveFav(${idx}, 1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button> <button onclick="removeFavManage('${name}')" style="padding:6px 10px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button> </div>`;
        listEl.appendChild(item);
    });
}
function moveFav(idx, dir) { if (idx + dir < 0 || idx + dir >= myFavs.length) return; const temp = myFavs[idx]; myFavs[idx] = myFavs[idx + dir]; myFavs[idx + dir] = temp; localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); renderFavManageList(); }
function removeFavManage(name) { myFavs = myFavs.filter(fav => fav !== name); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); renderFavManageList(); if (targetSpot && targetSpot.name === name) document.getElementById("card-fav-icon").className = "fas fa-heart"; }

// 自訂景點編輯
window.mapInstance.on('contextmenu', function(e) {
    const spotName = prompt("📍 新增自訂標記\n請為地點命名：", "我的景點");
    if (!spotName) return; 
    const newSpot = { name: spotName, lat: e.latlng.lat, lng: e.latlng.lng, tags: ["自訂"], highlights: "點擊下方編輯...", food: "--", history: "自訂標記", transport: "自行前往", wikiImg: "" };
    savedCustomSpots.push(newSpot); localStorage.setItem('ruifang_custom_spots', JSON.stringify(savedCustomSpots)); addMarkerToMap(newSpot); showCard(newSpot);
});
function openEditModal(name) {
    currentEditingSpotName = name; const s = savedCustomSpots.find(x => x.name === name); if(!s) return;
    document.getElementById('edit-name').value = s.name; document.getElementById('edit-highlights').value = s.highlights; document.getElementById('edit-history').value = s.history;
    document.getElementById('edit-image-preview').style.display = s.wikiImg ? "block" : "none"; document.getElementById('edit-image-preview').src = s.wikiImg || "";
    document.getElementById('edit-modal-overlay').style.display = "flex";
}
function closeEditModal() { document.getElementById('edit-modal-overlay').style.display = "none"; }
document.getElementById('edit-image').addEventListener('change', function(e) {
    const file = e.target.files[0]; if(!file) return; const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas'); const scaleSize = 400 / img.width; canvas.width = 400; canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            document.getElementById('edit-image-preview').src = canvas.toDataURL('image/jpeg', 0.7); document.getElementById('edit-image-preview').style.display = "block";
        }; img.src = event.target.result;
    }; reader.readAsDataURL(file);
});
function saveEditSpot() {
    const newName = document.getElementById('edit-name').value.trim(); if(!newName) return alert("名稱不能為空！");
    const savedIdx = savedCustomSpots.findIndex(x => x.name === currentEditingSpotName); if(savedIdx === -1) return;
    const s = savedCustomSpots[savedIdx];
    s.name = newName; s.highlights = document.getElementById('edit-highlights').value; s.history = document.getElementById('edit-history').value; s.wikiImg = document.getElementById('edit-image-preview').src;
    localStorage.setItem('ruifang_custom_spots', JSON.stringify(savedCustomSpots));
    if(s.markerObj) cluster.removeLayer(s.markerObj); addMarkerToMap(s); closeEditModal(); showCard(s); 
}
function deleteCustomSpot(name) {
    if(!confirm(`確定要刪除「${name}」？無法復原喔！`)) return;
    const spotIndex = savedCustomSpots.findIndex(s => s.name === name);
    if (spotIndex > -1) { 
        if(savedCustomSpots[spotIndex].markerObj) cluster.removeLayer(savedCustomSpots[spotIndex].markerObj); 
        savedCustomSpots.splice(spotIndex, 1); 
        localStorage.setItem('ruifang_custom_spots', JSON.stringify(savedCustomSpots));
    }
    if (myFavs.includes(name)) { myFavs = myFavs.filter(fav => fav !== name); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); }
    closeCard(); alert('🗑️ 標記已刪除！');
}
function renderCardButtons(s, t = translations[currentLang]) {
    const btnGroup = document.getElementById("card-btn-group");
    if (s.tags.includes('自訂')) { btnGroup.innerHTML = `<button onclick="startNav()" style="flex: 1.2;"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="edit-btn" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i></button><button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i></button>`; } 
    else { btnGroup.innerHTML = `<button onclick="startNav()"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="secondary" onclick="aiTrip()"><i class="fas fa-magic"></i> ${t.ai}</button>`; }
}

// =========================================
// 8. 系統啟動
// =========================================
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search); const spotQuery = params.get('spot');
    if(spotQuery) { const s = spots.concat(savedCustomSpots).find(x => x.name === spotQuery); if(s) { setTimeout(() => { window.mapInstance.flyTo([s.lat, s.lng], 16); showCard(s); }, 1000); } }
    
    applyLanguage(currentLang); fetchWeather();
    
    // 🌟 啟動時檢查主題：如果是 'default' 或沒設定，強制 Intro 變黑白！
    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { 
        applyCustomTheme('#007bff', false); 
    } else { 
        applyCustomTheme(savedTheme, true); 
    }

    const splash = document.getElementById('splash-screen');
    const welcome = document.getElementById('welcome-screen');
    const tutorial = document.getElementById('tutorial-overlay');
    const skipIntro = localStorage.getItem('ruifang_skip_intro') === 'true';
    
    const skipToggle = document.getElementById('skip-intro-toggle');
    if(skipToggle) skipToggle.checked = skipIntro;

    if(skipIntro) { 
        if(splash) splash.style.display = 'none'; 
        if(welcome) welcome.style.display = 'none'; 
        if(tutorial) tutorial.style.display = 'none';
        window.mapInstance.invalidateSize(); 
    } else {
        setTimeout(() => { 
            if(splash) { splash.style.opacity = '0'; setTimeout(() => { splash.style.display = 'none'; }, 500); } 
        }, 2500);
    }
});
