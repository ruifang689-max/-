// =========================================
// 0. PWA 註冊與 iOS 教學處理
// =========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) { registration.update(); }
    });
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); });
}

let deferredPrompt;
const isIos = () => { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; };
const isStandalone = () => { return ('standalone' in window.navigator) && (window.navigator.standalone); };

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const installBtn = document.getElementById('install-btn-container');
    if (installBtn) installBtn.style.display = 'block';
});

function installPWA() {
    if (isIos() && !isStandalone()) {
        document.getElementById('ios-instruction-modal').style.display = 'flex';
        closeSettings();
        return;
    }
    if (!deferredPrompt) return;
    document.getElementById('install-btn-container').style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
}
function closeIosInstruction() { document.getElementById('ios-instruction-modal').style.display = 'none'; }

// =========================================
// 1. 全域變數宣告
// =========================================
let targetSpot = null; 
let currentRoute = null; 
let userPos = null;
let userMarker = null;
let currentEditingSpotName = "";
let navMode = 'driving'; 
let tourModeInterval = null; 
let myFavs = JSON.parse(localStorage.getItem('ruifang_favs')) || []; 
let savedCustomSpots = JSON.parse(localStorage.getItem('ruifang_custom_spots')) || []; 
let searchHistory = JSON.parse(localStorage.getItem('ruifang_search_history')) || []; 

// =========================================
// 2. 擴充資料庫與語言庫
// =========================================
const spots = [
    { name: "瑞芳火車站", lat: 25.108, lng: 121.805, tags: ["交通", "美食"], keywords: ["車站", "龍鳳腿", "胡椒餅"], highlights: "瑞芳美食廣場", food: "龍鳳腿、胡椒餅", history: "平溪線與九份的交通轉運樞紐。", transport: "台鐵瑞芳站" },
    { name: "瑞芳後站老街", lat: 25.109, lng: 121.806, tags: ["歷史", "美食"], keywords: ["保雲芋圓", "老街"], highlights: "瑞芳創始芋圓", food: "保雲芋圓", history: "早期礦工的聚集地。", transport: "步行自後站" },
    { name: "九份老街", lat: 25.1099, lng: 121.8452, tags: ["歷史", "美食"], keywords: ["阿妹茶樓", "芋圓", "山城"], highlights: "阿妹茶樓、豎崎路", food: "阿柑姨芋圓", history: "曾經繁華的黃金山城。", transport: "客運 788/965" },
    { name: "猴硐貓村", lat: 25.086, lng: 121.828, tags: ["歷史"], keywords: ["貓", "瑞三整煤廠"], highlights: "貓咪療癒、煤礦遺跡", food: "礦工麵", history: "曾為全台煤礦產量第一。", transport: "台鐵猴硐站" },
    { name: "金瓜石黃金博物館", lat: 25.1091, lng: 121.8576, tags: ["歷史"], keywords: ["金瓜石", "礦工便當"], highlights: "大金磚、本山五坑", food: "礦工便當", history: "亞洲第一金礦山。", transport: "客運 788/856" },
    { name: "無耳茶壺山", lat: 25.1063, lng: 121.8659, tags: ["自然"], keywords: ["海景", "爬山"], highlights: "絕美海景", food: "無", history: "山形似無耳茶壺。", transport: "金瓜石步行登山" },
    { name: "報時山步道", lat: 25.1118, lng: 121.8587, tags: ["自然"], keywords: ["觀景台", "步道"], highlights: "最輕鬆看海步道", food: "無", history: "日治時期設有警報器。", transport: "勸濟堂步行" },
    { name: "水湳洞陰陽海", lat: 25.1228, lng: 121.8647, tags: ["自然"], keywords: ["海景", "十三層遺址"], highlights: "黃藍交錯海景", food: "無", history: "礦物氧化形成的自然奇觀。", transport: "客運 856" }
];
const themeRouteCoords = [[25.108, 121.805], [25.086, 121.828], [25.1099, 121.8452], [25.1091, 121.8576], [25.1228, 121.8647]];

const translations = {
    'zh': { splash_title: "瑞芳導覽 App", splash_desc: "精準在地導覽，深度探索山城。", lang: "語言 / Language", enter_map: "進入地圖", form_link: "意見問卷", skip_intro: "啟動時略過開場", tut_step1_title: "功能說明 (1/2)", tut_search: "搜尋與標籤", tut_add: "長按新增", tut_weather: "天氣資訊", tut_compass: "指北針", tut_next: "下一步", tut_step2_title: "進階功能 (2/2)", tut_nav: "多模式導航", tut_tour: "自動導覽", tut_settings: "設定", tut_share: "分享", tut_prev: "前一步", tut_finish: "開始使用", settings: "系統設定", theme: "主題顏色", share_map_title: "推薦給好友", share_map: "分享地圖", close: "關閉", search_ph: "🔍 搜尋或長按新增...", locating: "定位中...", food: "在地飲食", highlights: "推薦亮點", history: "簡介歷史", transport: "交通方式", nav: " 導航", ai: " 智慧推薦", chip_all: "🌟 全部", chip_food: "🍜 美食", chip_history: "🏛️ 歷史", chip_nature: "⛰️ 自然", chip_custom: "📍 標記", contact: "聯絡開發團隊", install_app: "將 App 安裝至桌面", manage_fav: "管理收藏夾" },
    'en': { splash_title: "Ruifang Guide", splash_desc: "Accurate local guide in Ruifang.", lang: "Language", enter_map: "Enter Map", form_link: "Feedback", skip_intro: "Skip intro on startup", tut_step1_title: "Features (1/2)", tut_search: "Search & Tags", tut_add: "Long Press Add", tut_weather: "Weather", tut_compass: "Compass", tut_next: "Next", tut_step2_title: "Advanced (2/2)", tut_nav: "Navigation", tut_tour: "Guided Tour", tut_settings: "Settings", tut_share: "Share", tut_prev: "Back", tut_finish: "Start", settings: "Settings", theme: "Theme Color", share_map_title: "Recommend", share_map: "Share Map", close: "Close", search_ph: "🔍 Search or long press...", locating: "Locating...", food: "Food", highlights: "Highlights", history: "History", transport: "Transport", nav: " Navigate", ai: " AI Trip", chip_all: "🌟 All", chip_food: "🍜 Food", chip_history: "🏛️ History", chip_nature: "⛰️ Nature", chip_custom: "📍 Custom", contact: "Contact", install_app: "Install App", manage_fav: "Manage Favs" }
};

let currentLang = localStorage.getItem('ruifang_lang') || 'zh';
function applyLanguage(lang) {
    currentLang = lang; localStorage.setItem('ruifang_lang', lang);
    const t = translations[lang] || translations['zh']; 
    document.getElementById('search').placeholder = t.search_ph;
    document.getElementById('addr-text').innerText = t.locating;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t[key];
            else { const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/); el.innerHTML = iconMatch ? iconMatch[0] + ' ' + t[key] : t[key]; }
        }
    });
    document.getElementById('lang-select-startup').value = lang;
    document.getElementById('lang-select-settings').value = lang;
    if(targetSpot && document.getElementById("card").classList.contains("open")) renderCardButtons(targetSpot, t);
}

// =========================================
// 3. UI 與教學流程切換
// =========================================
function openSettings() { document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal-overlay').style.display = 'none'; }
function toggleSkipIntro(isChecked) { localStorage.setItem('ruifang_skip_intro', isChecked ? 'true' : 'false'); }

function enterMap() {
    document.getElementById('welcome-screen').style.opacity = '0';
    setTimeout(() => { document.getElementById('welcome-screen').style.display = 'none'; document.getElementById('tutorial-overlay').style.display = 'flex'; setTimeout(() => { document.getElementById('tutorial-overlay').style.opacity = '1'; }, 50); }, 400);
}
function nextTutorial() { document.getElementById('tut-step-1').style.display = 'none'; document.getElementById('tut-step-2').style.display = 'block'; }
function prevTutorial() { document.getElementById('tut-step-2').style.display = 'none'; document.getElementById('tut-step-1').style.display = 'block'; }
function finishTutorial() {
    document.getElementById('tutorial-overlay').style.opacity = '0';
    setTimeout(() => { document.getElementById('tutorial-overlay').style.display = 'none'; localStorage.setItem('ruifang_welcomed', 'true'); if (typeof window.mapInstance !== 'undefined') window.mapInstance.invalidateSize(); }, 400);
}

function changeTheme(color) { 
    if (color === 'custom') { document.getElementById('custom-color-picker').style.display = 'block'; document.getElementById('custom-color-picker').click(); } 
    else { document.getElementById('custom-color-picker').style.display = 'none'; applyCustomTheme(color); } 
}
function applyCustomTheme(color) { 
    document.documentElement.style.setProperty('--primary', color); document.documentElement.style.setProperty('--logo-border', color); 
    localStorage.setItem('ruifang_theme', color); 
    const themeSelect = document.getElementById('theme-select'); 
    if([...themeSelect.options].some(o => o.value === color)) themeSelect.value = color; else themeSelect.value = 'custom'; 
}

function shareSpot() { 
    if(!targetSpot) return; 
    const spotUrl = new URL(window.location.href.split('?')[0]); spotUrl.searchParams.set('spot', targetSpot.name); 
    const shareData = { title: `瑞芳導覽地圖 - ${targetSpot.name}`, text: `我在瑞芳發現了「${targetSpot.name}」！\n點擊查看：`, url: spotUrl.toString() }; 
    if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 景點連結已複製！')); 
}
function shareAppMap() { 
    const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' }; 
    if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); 
}

// =========================================
// 4. 天氣功能
// =========================================
async function fetchWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&timezone=Asia%2FTaipei');
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        let iconClass = 'fa-cloud-sun weather-cloud'; 
        if(code === 0) iconClass = 'fa-sun weather-sun'; else if(code > 3) iconClass = 'fa-cloud-rain weather-rain'; 
        document.getElementById('weather-temp').innerText = `${temp}°C`;
        document.querySelector('#weather-box i').className = `fas ${iconClass}`; 
    } catch (e) { document.getElementById('weather-temp').innerText = "--"; }
}

// =========================================
// 5. 核心地圖初始化與底圖
// =========================================
window.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 14);

const mapLayers = [
    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
    { url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', name: '交通', icon: 'fa-bus', dark: false },
    { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: '夜間', icon: 'fa-moon', dark: true }
];
let currentLayerIdx = 0;
let currentTileLayer = L.tileLayer(mapLayers[0].url).addTo(window.mapInstance);
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

window.mapInstance.on('locationfound', e => {
    userPos = e.latlng; document.getElementById("gps-val-text").innerText = `GPS: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    if(!userMarker) userMarker = L.marker(userPos, { icon: userPulseIcon }).addTo(window.mapInstance); else userMarker.setLatLng(userPos);
});

// 🌟 報幕文字平滑淡入淡出優化
let geocodeTimer = null;
window.mapInstance.on('movestart', () => { document.getElementById("addr-text").style.opacity = '0.5'; });
window.mapInstance.on('moveend', function() {
    clearTimeout(geocodeTimer);
    document.getElementById("addr-text").innerText = "定位中...";
    document.getElementById("addr-text").style.opacity = '1';
    geocodeTimer = setTimeout(() => {
        const center = window.mapInstance.getCenter();
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`)
        .then(res => { if (!res.ok) throw new Error('API Rate Limit'); return res.json(); })
        .then(data => { if (data && data.address) { const a = data.address; document.getElementById("addr-text").innerText = ((a.city||a.town||a.county||"") + (a.suburb||a.district||"") + (a.village||a.neighbourhood||a.road||"")) || "探索瑞芳中..."; } })
        .catch(()=>{ document.getElementById("addr-text").innerText = "探索瑞芳中..."; }); 
    }, 1200); 
});

// =========================================
// 6. 圖釘生成與資訊卡顯示 (🌟 Canvas 終極防破圖)
// =========================================
const cluster = L.markerClusterGroup(); window.mapInstance.addLayer(cluster);
function calculateWalk(lat, lng) { if(!userPos) return "--"; const mins = Math.round(window.mapInstance.distance(userPos, [lat, lng]) / 80); return mins < 1 ? "1分內" : `約 ${mins} 分`; }

const createCustomPin = (tags, name) => { let cls = 'fa-map-marker-alt', col = '#ea4335'; if (tags.includes('美食')) { cls = 'fa-utensils'; col = 'var(--primary)'; } else if (tags.includes('歷史')) { cls = 'fa-landmark'; col = '#7f8c8d'; } else if (tags.includes('自然')) { cls = 'fa-leaf'; col = '#2ecc71'; } else if (tags.includes('自訂')) { cls = 'fa-star'; col = 'var(--accent)'; } return L.divIcon({ className: 'custom-pin-wrap', html: `<div class="gmap-pin" style="background-color:${col}"><i class="fas ${cls}"></i></div><div class="pin-label">${name}</div>`, iconSize: [32,32], iconAnchor: [16,16], popupAnchor: [0,-20] }); };

// 🌟 Canvas 動態產生預設圖 (百分之百保證不破圖)
function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#333333';
    ctx.fillStyle = color; ctx.fillRect(0, 0, 400, 200);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 200, 100);
    return canvas.toDataURL('image/jpeg', 0.8);
}

function addMarkerToMap(s) {
    if (!s.tags.includes('自訂') && !s.wikiImg) fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(s.name)}`).then(r=>r.json()).then(d=>{s.wikiImg=d.thumbnail?.source;}).catch(()=>{});
    const m = L.marker([s.lat, s.lng], { icon: createCustomPin(s.tags, s.name) });
    m.bindPopup(() => {
        const img = s.wikiImg || getPlaceholderImage(s.name);
        const foodIcon = s.tags.includes('自訂') ? 'fa-star' : 'fa-utensils'; const foodText = s.tags.includes('自訂') ? '自訂地點' : `美食：${s.food || '--'}`;
        return `<div class="preview-card" onclick="openCardByName('${s.name}')"><img class="preview-img" src="${img}" onerror="this.src='${getPlaceholderImage(s.name)}'"><div class="preview-info"><div class="preview-header"><span class="preview-title">${s.name}</span><span class="walk-badge"><i class="fas fa-walking"></i> ${calculateWalk(s.lat, s.lng)}</span></div><div class="preview-tag-box">${s.tags.map(t=>`<span class="mini-tag">${t}</span>`).join('')}</div><div class="food-preview"><i class="fas ${foodIcon}"></i> ${foodText}</div></div></div>`;
    }, { closeButton: false });
    m.on('mouseover', function() { this.openPopup(); }); m.on('click', (e) => { L.DomEvent.stopPropagation(e); showCard(s); });
    s.markerObj = m; cluster.addLayer(m);
}
spots.forEach(addMarkerToMap); savedCustomSpots.forEach(s => { spots.push(s); addMarkerToMap(s); });

function filterSpots(category, element) {
    if(element) { document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); element.classList.add('active'); }
    cluster.clearLayers(); const filteredSpots = category === 'all' ? spots.concat(savedCustomSpots) : spots.concat(savedCustomSpots).filter(s => s.tags.includes(category)); filteredSpots.forEach(addMarkerToMap); closeCard();
}

function showCard(s) {
    targetSpot = s; document.getElementById("card-fav-icon").className = myFavs.includes(s.name) ? "fas fa-heart active" : "fas fa-heart";
    document.getElementById("title").innerText = s.name; 
    const imgEl = document.getElementById("img");
    imgEl.src = s.wikiImg || getPlaceholderImage(s.name);
    imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); }; // 圖片如果壞掉，瞬間換成 Canvas

    document.getElementById("card-tags").innerHTML = s.tags.map(t => `<span class="mini-tag">${t}</span>`).join('');
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
// 7. 自訂景點編輯
// =========================================
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
// 8. 側邊功能列與導覽
// =========================================
function resetNorth() { window.mapInstance.flyTo([25.1032, 121.8224], 14); } 
function goToUser() { if(userPos) { window.mapInstance.flyTo(userPos, 16); } else { alert("📍 正在獲取定位...\n若無反應，請確認您已開啟手機與瀏覽器的 GPS 定位權限！"); window.mapInstance.locate({setView: false, watch: true, enableHighAccuracy: true}); } } 
function drawThemeRoute() { if(currentRoute) window.mapInstance.removeLayer(currentRoute); currentRoute = L.polyline(themeRouteCoords, { color: '#8e44ad', weight: 6, dashArray: '10, 10' }).addTo(window.mapInstance); window.mapInstance.fitBounds(currentRoute.getBounds(), { padding: [50, 50] }); closeCard(); alert("🚀 熱門路線已載入！"); } 
function goToStation() { const ruiIcon = document.querySelector('.rui-icon'); if(ruiIcon){ ruiIcon.classList.remove('stamped'); void ruiIcon.offsetWidth; ruiIcon.classList.add('stamped'); } window.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); } 
function aiTrip() { if(!userPos) return alert("等待 GPS 定位..."); const sorted = spots.concat(savedCustomSpots).sort((a,b) => window.mapInstance.distance(userPos,[a.lat,a.lng]) - window.mapInstance.distance(userPos,[b.lat,b.lng])); alert("🤖 AI 推薦最近景點：\n" + sorted.slice(0,5).map((s,i) => `${i+1}. ${s.name}`).join("\n")); }

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
// 9. 搜尋歷史、推薦與收藏夾
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
    if(matches.length > 0) { 
        sugBox.style.display = "block"; 
        matches.forEach(s => { 
            const div = document.createElement("div"); div.className = "list-item"; 
            div.innerHTML = `<span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span>`; 
            div.onclick = () => { saveSearchHistory(s.name); triggerSearch(s.name); }; c.appendChild(div); 
        }); 
    } else { sugBox.style.display = "none"; } 
});

function toggleCurrentFav() { if(!targetSpot) return; const idx = myFavs.indexOf(targetSpot.name); if(idx === -1) myFavs.push(targetSpot.name); else myFavs.splice(idx, 1); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); document.getElementById("card-fav-icon").className = myFavs.includes(targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; saveFavToCloud(); }

function toggleFavList() { 
    const p = document.getElementById("fav-list-panel"); 
    if(p.style.display === "block") { p.style.display = "none"; } else { 
        p.innerHTML = ""; 
        if(myFavs.length === 0) { 
            p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; 
        } else { 
            myFavs.forEach(name => { 
                const div = document.createElement("div"); div.className = "list-item"; 
                div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; 
                div.onclick = () => { triggerSearch(name); p.style.display = "none"; }; p.appendChild(div); 
            }); 
        } 
        const manageBtn = document.createElement('div'); manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:14px; color:var(--primary);"; manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾"; manageBtn.onclick = () => { p.style.display = "none"; openFavManage(); }; p.appendChild(manageBtn);
        p.style.display = "block"; 
    } 
}

function openFavManage() { document.getElementById('fav-manage-modal').style.display = 'flex'; renderFavManageList(); }
function closeFavManage() { document.getElementById('fav-manage-modal').style.display = 'none'; }
function renderFavManageList() {
    const listEl = document.getElementById('fav-manage-list'); listEl.innerHTML = '';
    if (myFavs.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; return; }
    myFavs.forEach((name, idx) => {
        const item = document.createElement('div'); item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px;";
        item.innerHTML = `<span style="font-weight:bold; color:var(--text-main); font-size:15px;">${name}</span> <div style="display:flex; gap:6px;"> <button onclick="moveFav(${idx}, -1)" style="padding:6px 12px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button> <button onclick="moveFav(${idx}, 1)" style="padding:6px 12px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button> <button onclick="removeFavManage('${name}')" style="padding:6px 12px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button> </div>`;
        listEl.appendChild(item);
    });
}
function moveFav(idx, dir) { if (idx + dir < 0 || idx + dir >= myFavs.length) return; const temp = myFavs[idx]; myFavs[idx] = myFavs[idx + dir]; myFavs[idx + dir] = temp; localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); renderFavManageList(); saveFavToCloud(); }
function removeFavManage(name) { myFavs = myFavs.filter(fav => fav !== name); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); renderFavManageList(); saveFavToCloud(); if (targetSpot && targetSpot.name === name) document.getElementById("card-fav-icon").className = "fas fa-heart"; }

// =========================================
// 10. 系統啟動
// =========================================
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search); const spotQuery = params.get('spot');
    if(spotQuery) { const s = spots.concat(savedCustomSpots).find(x => x.name === spotQuery); if(s) { setTimeout(() => { window.mapInstance.flyTo([s.lat, s.lng], 16); showCard(s); }, 1000); } }
    
    applyLanguage(currentLang); fetchWeather();
    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (savedTheme) { applyCustomTheme(savedTheme); } else { applyCustomTheme('#333333'); }

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
