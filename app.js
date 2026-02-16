// =========================================
// 0. PWA 註冊與快取管理
// =========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) { registration.update(); }
    });
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW 未註冊', err));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if(installBtn) installBtn.style.display = 'block';
});
function installPWA() {
    if (!deferredPrompt) return;
    document.getElementById('install-btn').style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
}

// =========================================
// 1. 三階段進入動線與教學邏輯
// =========================================
function enterMap() {
    document.getElementById('welcome-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('tutorial-overlay').style.display = 'flex';
    }, 400);
}
function nextTutorial() {
    document.getElementById('tut-step-1').style.display = 'none';
    document.getElementById('tut-step-2').style.display = 'block';
}
function prevTutorial() {
    document.getElementById('tut-step-2').style.display = 'none';
    document.getElementById('tut-step-1').style.display = 'block';
}
function finishTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        localStorage.setItem('ruifang_welcomed', 'true');
        if(window.mapInstance) window.mapInstance.invalidateSize(); // 強制重繪地圖防止灰屏
    }, 400);
}

// =========================================
// 2. 主題色與分享功能
// =========================================
function changeTheme(color) {
    if (color === 'custom') {
        document.getElementById('custom-color-picker').style.display = 'block';
        document.getElementById('custom-color-picker').click();
    } else {
        document.getElementById('custom-color-picker').style.display = 'none';
        applyCustomTheme(color);
    }
}
function applyCustomTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--logo-border', color);
    localStorage.setItem('ruifang_theme', color);
    const themeSelect = document.getElementById('theme-select');
    if([...themeSelect.options].some(o => o.value === color)) {
        themeSelect.value = color;
    } else {
        themeSelect.value = 'custom';
    }
}
function shareAppMap() {
    const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' };
    if (navigator.share) navigator.share(shareData).catch(()=>{}); 
    else { navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); }
}

// =========================================
// 3. 多國語言字典
// =========================================
const translations = {
    'zh': { splash_title: "瑞芳導覽 App", splash_desc: "致力於提供瑞芳地區最精準的在地導覽，帶領您深度探索山城之美。", lang: "語言 / Language", enter_map: "進入地圖", form_link: "填寫意見問卷", tut_step1_title: "功能說明 (1/2)", tut_search: "搜尋與標籤", tut_add: "長按新增", tut_weather: "天氣資訊", tut_next: "下一步", tut_step2_title: "快捷功能 (2/2)", tut_settings: "設定", tut_compass: "指北針", tut_share: "分享鍵", tut_prev: "前一步", tut_finish: "開始使用", settings: "系統設定", theme: "主題顏色", share_map_title: "推薦給好友", share_map: "分享導覽地圖", close: "關閉", search_ph: "🔍 搜尋景點或長按新增...", locating: "定位中...", food: "在地飲食", highlights: "推薦亮點", history: "簡介歷史", transport: "交通方式", nav: " 導航", ai: " 行程規劃", chip_all: "🌟 全部", chip_food: "🍜 美食", chip_history: "🏛️ 歷史", chip_nature: "⛰️ 自然", chip_custom: "📍 標記", contact: "聯絡開發團隊" },
    'en': { splash_title: "Ruifang Guide", splash_desc: "The most accurate local guide in Ruifang.", lang: "Language", enter_map: "Enter Map", form_link: "Feedback Form", tut_step1_title: "Features (1/2)", tut_search: "Search & Tags", tut_add: "Long Press Add", tut_weather: "Weather", tut_next: "Next", tut_step2_title: "Shortcuts (2/2)", tut_settings: "Settings", tut_compass: "Compass", tut_share: "Share", tut_prev: "Back", tut_finish: "Start", settings: "Settings", theme: "Theme Color", share_map_title: "Recommend", share_map: "Share Map", close: "Close", search_ph: "🔍 Search or long press...", locating: "Locating...", food: "Food", highlights: "Highlights", history: "History", transport: "Transport", nav: " Navigate", ai: " Plan Trip", chip_all: "🌟 All", chip_food: "🍜 Food", chip_history: "🏛️ History", chip_nature: "⛰️ Nature", chip_custom: "📍 Custom", contact: "Contact Team" },
    'ja': { splash_title: "瑞芳ガイド", splash_desc: "瑞芳の正確なローカルガイド。", lang: "言語", enter_map: "マップへ", form_link: "アンケート", tut_step1_title: "機能 (1/2)", tut_search: "検索とタグ", tut_add: "長押しで追加", tut_weather: "天気", tut_next: "次へ", tut_step2_title: "ショートカット (2/2)", tut_settings: "設定", tut_compass: "コンパス", tut_share: "共有", tut_prev: "戻る", tut_finish: "始める", settings: "設定", theme: "テーマ色", share_map_title: "友達に勧める", share_map: "マップを共有", close: "閉じる", search_ph: "🔍 検索または長押し...", locating: "取得中...", food: "グルメ", highlights: "見どころ", history: "歴史", transport: "アクセス", nav: " ナビ", ai: " ルート", chip_all: "🌟 全て", chip_food: "🍜 食事", chip_history: "🏛️ 歴史", chip_nature: "⛰️ 自然", chip_custom: "📍 カスタム", contact: "お問い合わせ" },
    'ko': { splash_title: "루이팡 가이드", splash_desc: "루이팡 지역의 정확한 로컬 가이드.", lang: "언어 / Language", enter_map: "지도 입장", form_link: "설문조사", tut_step1_title: "기능 (1/2)", tut_search: "검색 및 태그", tut_add: "길게 눌러 추가", tut_weather: "날씨", tut_next: "다음", tut_step2_title: "단축키 (2/2)", tut_settings: "설정", tut_compass: "나침반", tut_share: "공유", tut_prev: "이전", tut_finish: "시작하기", settings: "설정", theme: "테마 색상", share_map_title: "친구에게 추천", share_map: "지도 공유", close: "닫기", search_ph: "🔍 검색 또는 길게 누르기...", locating: "위치 확인 중...", food: "음식", highlights: "하이라이트", history: "역사", transport: "교통", nav: " 내비게이션", ai: " 추천", chip_all: "🌟 전체", chip_food: "🍜 음식", chip_history: "🏛️ 역사", chip_nature: "⛰️ 자연", chip_custom: "📍 마커", contact: "개발팀에 문의" },
    'vi': { splash_title: "Bản đồ Ruifang", splash_desc: "Hướng dẫn du lịch địa phương chính xác nhất.", lang: "Ngôn ngữ", enter_map: "Vào Bản Đồ", form_link: "Bảng câu hỏi", tut_step1_title: "Chức năng (1/2)", tut_search: "Tìm kiếm", tut_add: "Nhấn giữ thêm", tut_weather: "Thời tiết", tut_next: "Tiếp", tut_step2_title: "Phím tắt (2/2)", tut_settings: "Cài đặt", tut_compass: "La bàn", tut_share: "Chia sẻ", tut_prev: "Trước", tut_finish: "Bắt đầu", settings: "Cài đặt", theme: "Màu chủ đề", share_map_title: "Giới thiệu bạn bè", share_map: "Chia sẻ Bản đồ", close: "Đóng", search_ph: "🔍 Tìm kiếm...", locating: "Đang định vị...", food: "Ẩm thực", highlights: "Nổi bật", history: "Lịch sử", transport: "Di chuyển", nav: " Chỉ đường", ai: " Hành trình", chip_all: "🌟 Tất cả", chip_food: "🍜 Ăn", chip_history: "🏛️ Lịch sử", chip_nature: "⛰️ Tự nhiên", chip_custom: "📍 Đã lưu", contact: "Liên hệ" }
};

let currentLang = localStorage.getItem('ruifang_lang') || 'zh';
function applyLanguage(lang) {
    currentLang = lang; localStorage.setItem('ruifang_lang', lang);
    const t = translations[lang]; if(!t) return;
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
    if(window.targetSpot && document.getElementById("card").classList.contains("open")) renderCardButtons(window.targetSpot, t);
}

function openSettings() { document.getElementById('settings-modal-overlay').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal-overlay').style.display = 'none'; }

// =========================================
// 4. 天氣功能
// =========================================
async function fetchWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&timezone=Asia%2FTaipei');
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        let iconClass = 'fa-cloud-sun'; 
        if(code === 0) iconClass = 'fa-sun'; else if(code > 3) iconClass = 'fa-cloud-rain'; 
        document.getElementById('weather-temp').innerText = `${temp}°C`;
        document.querySelector('#weather-box i').className = `fas ${iconClass}`; 
    } catch (e) { document.getElementById('weather-temp').innerText = "--"; }
}

// =========================================
// 5. 景點與 Firebase 設定
// =========================================
const spots = [
    { name: "瑞芳", lat: 25.108, lng: 121.805, tags: ["交通", "美食"], keywords: ["火車站", "龍鳳腿", "胡椒餅"], highlights: "瑞芳美食廣場", food: "龍鳳腿、胡椒餅", history: "進入九份與平溪線門戶。", transport: "台鐵瑞芳站" },
    { name: "瑞芳後站老街", lat: 25.109, lng: 121.806, tags: ["歷史", "美食"], keywords: ["保雲芋圓", "老街"], highlights: "瑞芳創始芋圓", food: "保雲芋圓", history: "早期礦工的聚集地。", transport: "瑞芳火車站後站" },
    { name: "九份老街", lat: 25.1099, lng: 121.8452, tags: ["歷史", "美食"], keywords: ["阿妹茶樓", "芋圓", "山城"], highlights: "阿妹茶樓", food: "阿柑姨芋圓", history: "黃金山城。", transport: "客運 788/965" },
    { name: "猴硐貓村", lat: 25.086, lng: 121.828, tags: ["歷史"], keywords: ["貓", "瑞三整煤廠"], highlights: "貓咪療癒", food: "礦工麵", history: "全台煤礦產量第一。", transport: "台鐵猴硐站" },
    { name: "金瓜石黃金博物館", lat: 25.1091, lng: 121.8576, tags: ["歷史"], keywords: ["金瓜石", "礦工便當"], highlights: "大金磚", food: "礦工便當", history: "亞洲第一金礦山。", transport: "客運 788/856" },
    { name: "無耳茶壺山", lat: 25.1063, lng: 121.8659, tags: ["自然"], keywords: ["海景", "爬山"], highlights: "絕美海景", food: "無", history: "山形似無耳茶壺。", transport: "金瓜石步行登山" }
];

window.targetSpot = null; window.currentRoute = null; window.userPos = null;
let myFavs = JSON.parse(localStorage.getItem('ruifang_favs')) || []; 
let savedCustomSpots = JSON.parse(localStorage.getItem('ruifang_custom_spots')) || []; 
let searchHistory = JSON.parse(localStorage.getItem('ruifang_search_history')) || []; 
const themeRouteCoords = [[25.108, 121.805], [25.086, 121.828], [25.0606, 121.8226], [25.1091, 121.8576]];

const firebaseConfig = { apiKey: "請至Firebase後台取得 Web API Key", authDomain: "ruifang689-max.firebaseapp.com", projectId: "ruifang689-max", storageBucket: "ruifang689-max.appspot.com", messagingSenderId: "29945788628", appId: "請至Firebase後台取得 App ID" };
let db = null; const userId = "user_default";
if (firebaseConfig.apiKey !== "請至Firebase後台取得 Web API Key") {
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js").then(module => {
        const app = module.initializeApp(firebaseConfig);
        import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js").then(fs => { db = fs.getFirestore(app); console.log("Firebase 已啟用"); });
    }).catch(e => console.log(e));
}
async function saveFavToCloud() { if (!db) return; try { const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"); await setDoc(doc(db, "users", userId), { favorites: myFavs }, { merge: true }); } catch(e) {} }

// =========================================
// 6. 核心地圖初始化與圖釘操作 (修復 map.on 錯誤)
// =========================================

// 🌟 明確將地圖綁定到全域變數 window.mapInstance，防止找不到
window.mapInstance = L.map('map', { zoomControl: false, attributionControl: false }).setView([25.1032, 121.8224], 14);

const mapLayers = [
    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: '街道', icon: 'fa-map', dark: false },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', name: '等高線', icon: 'fa-mountain', dark: false },
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
window.mapInstance.locate({setView: false, watch: true}); 

window.mapInstance.on('locationfound', e => {
    window.userPos = e.latlng; document.getElementById("gps-val-text").innerText = `GPS: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    if(!window.userMarker) window.userMarker = L.marker(window.userPos, { icon: userPulseIcon }).addTo(window.mapInstance); else window.userMarker.setLatLng(window.userPos);
});
window.mapInstance.on('locationerror', e => { document.getElementById("gps-val-text").innerText = "GPS: 請開啟定位權限"; });

// 新增延遲計時器
let geocodeTimer = null;

map.on('moveend', function() {
    // 每次滑動時先清空計時器，並顯示定位中
    clearTimeout(geocodeTimer);
    document.getElementById("addr-text").innerText = "定位中...";

    // 停止滑動 1.2 秒後，才向伺服器發送一次請求 (防止被 OpenStreetMap 封鎖)
    geocodeTimer = setTimeout(() => {
        const center = map.getCenter();
        // 🌟 網址尾端加入了您的信箱，符合 OSM 官方的 API 規範
        const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`;
        
        fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error('API 請求過於頻繁');
            return res.json();
        })
        .then(data => {
            if (data && data.address) { 
                const a = data.address; 
                document.getElementById("addr-text").innerText = ((a.city||a.town||a.county||"") + (a.suburb||a.district||"") + (a.village||a.neighbourhood||a.road||"")) || "探索瑞芳中..."; 
            }
        }).catch((e)=>{ 
            console.warn("地理編碼失敗或被限制:", e);
            document.getElementById("addr-text").innerText = "探索瑞芳中..."; 
        }); 
    }, 1200); 
});

const cluster = L.markerClusterGroup(); window.mapInstance.addLayer(cluster);
function calculateWalk(lat, lng) { if(!window.userPos) return "--"; const mins = Math.round(window.mapInstance.distance(window.userPos, [lat, lng]) / 80); return mins < 1 ? "1分內" : `約 ${mins} 分`; }
const createCustomPin = (tags) => { let cls = 'fa-map-marker-alt', col = '#ea4335'; if (tags.includes('美食')) { cls = 'fa-utensils'; col = 'var(--primary)'; } else if (tags.includes('歷史')) { cls = 'fa-landmark'; col = '#7f8c8d'; } else if (tags.includes('自然')) { cls = 'fa-leaf'; col = '#2ecc71'; } else if (tags.includes('自訂')) { cls = 'fa-star'; col = 'var(--accent)'; } return L.divIcon({ className: 'custom-pin-wrap', html: `<div class="gmap-pin" style="background-color:${col}"><i class="fas ${cls}"></i></div>`, iconSize: [32,32], iconAnchor: [16,38], popupAnchor: [0,-38] }); };

function addMarkerToMap(s) {
    if (!s.tags.includes('自訂') && !s.wikiImg) fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(s.name)}`).then(r=>r.json()).then(d=>{s.wikiImg=d.thumbnail?.source;}).catch(()=>{});
    const m = L.marker([s.lat, s.lng], { icon: createCustomPin(s.tags) });
    m.bindPopup(() => {
        const img = s.wikiImg || 'https://via.placeholder.com/260x130/007bff/ffffff?text=Ruifang';
        const foodIcon = s.tags.includes('自訂') ? 'fa-star' : 'fa-utensils';
        const foodText = s.tags.includes('自訂') ? '自訂地點' : `美食：${s.food || '--'}`;
        return `<div class="preview-card" onclick="openCardByName('${s.name}')"><img class="preview-img" src="${img}"><div class="preview-info"><div class="preview-header"><span class="preview-title">${s.name}</span><span class="walk-badge"><i class="fas fa-walking"></i> ${calculateWalk(s.lat, s.lng)}</span></div><div class="preview-tag-box">${s.tags.map(t=>`<span class="mini-tag">${t}</span>`).join('')}</div><div class="food-preview"><i class="fas ${foodIcon}"></i> ${foodText}</div></div></div>`;
    }, { closeButton: false });
    m.on('mouseover', function() { this.openPopup(); }); m.on('click', (e) => { L.DomEvent.stopPropagation(e); showCard(s); });
    s.markerObj = m; cluster.addLayer(m);
}
spots.forEach(addMarkerToMap); savedCustomSpots.forEach(s => { spots.push(s); addMarkerToMap(s); });

function filterSpots(category, element) {
    if(element) { document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); element.classList.add('active'); }
    cluster.clearLayers(); const filteredSpots = category === 'all' ? spots : spots.filter(s => s.tags.includes(category)); filteredSpots.forEach(addMarkerToMap); closeCard();
}

window.mapInstance.on('contextmenu', function(e) {
    const spotName = prompt("📍 新增自訂標記\n請為地點命名：", "我的景點");
    if (!spotName) return; 
    const newSpot = { name: spotName, lat: e.latlng.lat, lng: e.latlng.lng, tags: ["自訂"], highlights: "點擊下方編輯...", food: "--", history: "自訂標記", transport: "自行前往", wikiImg: "" };
    spots.push(newSpot); addMarkerToMap(newSpot); savedCustomSpots.push(newSpot); localStorage.setItem('ruifang_custom_spots', JSON.stringify(savedCustomSpots)); showCard(newSpot);
});

let currentEditingSpotName = "";
function openEditModal(name) {
    currentEditingSpotName = name; const s = spots.find(x => x.name === name);
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
    const s = spots.find(x => x.name === currentEditingSpotName); const savedIdx = savedCustomSpots.findIndex(x => x.name === currentEditingSpotName);
    s.name = newName; s.highlights = document.getElementById('edit-highlights').value; s.history = document.getElementById('edit-history').value; s.wikiImg = document.getElementById('edit-image-preview').src;
    if(savedIdx > -1) { savedCustomSpots[savedIdx] = s; localStorage.setItem('ruifang_custom_spots', JSON.stringify(savedCustomSpots)); }
    if(s.markerObj) cluster.removeLayer(s.markerObj); addMarkerToMap(s); closeEditModal(); showCard(s); 
}
function deleteCustomSpot(name) {
    if(!confirm(`確定要刪除「${name}」？無法復原喔！`)) return;
    savedCustomSpots = savedCustomSpots.filter(s => s.name !== name); localStorage.setItem('ruifang_custom_spots', JSON.stringify(savedCustomSpots));
    const spotIndex = spots.findIndex(s => s.name === name);
    if (spotIndex > -1) { cluster.removeLayer(spots[spotIndex].markerObj); spots.splice(spotIndex, 1); }
    if (myFavs.includes(name)) { myFavs = myFavs.filter(fav => fav !== name); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); renderFavList(); }
    closeCard(); alert('🗑️ 標記已刪除！');
}

function renderCardButtons(s, t = translations[currentLang]) {
    const btnGroup = document.getElementById("card-btn-group");
    if (s.tags.includes('自訂')) { btnGroup.innerHTML = `<button onclick="startNav()" style="flex: 1.2;"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="edit-btn" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i></button><button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i></button>`; } 
    else { btnGroup.innerHTML = `<button onclick="startNav()"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="secondary" onclick="aiTrip()"><i class="fas fa-magic"></i> ${t.ai}</button>`; }
}
function showCard(s) {
    window.targetSpot = s; document.getElementById("card-fav-icon").className = myFavs.includes(s.name) ? "fas fa-heart active" : "fas fa-heart";
    document.getElementById("title").innerText = s.name; document.getElementById("img").src = s.wikiImg || 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23f39c12"/><text x="50%" y="50%" fill="white" font-size="32" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">Ruifang Spot</text></svg>';
    document.getElementById("card-tags").innerHTML = s.tags.map(t => `<span class="mini-tag">${t}</span>`).join('');
    document.getElementById("card-food").innerText = s.food || "--"; document.getElementById("card-highlights").innerText = s.highlights || "暫無介紹";
    document.getElementById("card-history").innerText = s.history || "無"; document.getElementById("card-transport").innerText = s.transport || "自行前往";
    renderCardButtons(s); document.getElementById("card").classList.add("open"); document.getElementById("card").style.transform = '';
}
function openCardByName(name) { const s = spots.find(x => x.name === name); if(s) showCard(s); }
function closeCard() { document.getElementById("card").classList.remove("open"); document.getElementById("card").style.transform = ''; }
function closeNav() { if(window.currentRoute) window.mapInstance.removeLayer(window.currentRoute); document.getElementById('route-info-panel').style.display = 'none'; }
function startNav() {
    if(!window.userPos || !window.targetSpot) return alert("請開啟 GPS 定位"); closeCard(); document.getElementById('route-time').innerText = "計算中..."; document.getElementById('route-dist').innerText = ""; document.getElementById('route-info-panel').style.display = 'flex';
    fetch(`https://router.project-osrm.org/route/v1/driving/${window.userPos.lng},${window.userPos.lat};${window.targetSpot.lng},${window.targetSpot.lat}?overview=full&geometries=geojson`)
    .then(r => r.json()).then(data => { if(window.currentRoute) window.mapInstance.removeLayer(window.currentRoute); const route = data.routes[0]; const coords = route.geometry.coordinates.map(c => [c[1], c[0]]); window.currentRoute = L.polyline(coords, {color: 'var(--primary)', weight: 8}).addTo(window.mapInstance); window.mapInstance.fitBounds(window.currentRoute.getBounds(), {padding: [80, 80]}); document.getElementById('route-time').innerText = `${Math.round(route.duration / 60)} 分鐘`; document.getElementById('route-dist').innerText = `${(route.distance / 1000).toFixed(1)} km`; }).catch(() => { document.getElementById('route-time').innerText = "規劃失敗"; });
}

// =========================================
// 7. 搜尋與工具
// =========================================
const searchInput = document.getElementById("search"); const sugBox = document.getElementById("suggest");
searchInput.addEventListener('focus', () => { if(!searchInput.value.trim()) renderDefaultSearch(); });
function saveSearchHistory(name) { searchHistory = searchHistory.filter(h => h !== name); searchHistory.unshift(name); if(searchHistory.length > 5) searchHistory.pop(); localStorage.setItem('ruifang_search_history', JSON.stringify(searchHistory)); }
function renderDefaultSearch() { sugBox.innerHTML = ""; if(searchHistory.length > 0) { sugBox.innerHTML += `<div class="search-section-title">🕒 歷史搜尋</div>`; searchHistory.forEach(h => { sugBox.innerHTML += `<div class="list-item" onclick="triggerSearch('${h}')"><span><i class="fas fa-history" style="color:#aaa;"></i> ${h}</span></div>`; }); } sugBox.innerHTML += `<div class="search-section-title">⭐ 推薦景點</div>`; ["九份老街", "猴硐貓村", "無耳茶壺山"].forEach(r => { sugBox.innerHTML += `<div class="list-item" onclick="triggerSearch('${r}')"><span><i class="fas fa-fire" style="color:#e74c3c;"></i> ${r}</span></div>`; }); sugBox.style.display = "block"; }
function triggerSearch(name) { searchInput.value = name; sugBox.style.display = "none"; const s = spots.find(x => x.name === name); if(s) { window.mapInstance.flyTo([s.lat, s.lng], 16); setTimeout(() => showCard(s), 800); } }
searchInput.oninput = function() { const k = this.value.trim(); if(!k) { renderDefaultSearch(); return; } sugBox.innerHTML = ""; const matches = spots.filter(s => { return s.name.includes(k) || s.tags.some(t => t.includes(k)) || (s.keywords && s.keywords.some(kw => kw.includes(k))); }); if(matches.length > 0) { sugBox.style.display = "block"; matches.forEach(s => { const div = document.createElement("div"); div.className = "list-item"; div.innerHTML = `<span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span>`; div.onclick = () => { saveSearchHistory(s.name); triggerSearch(s.name); }; sugBox.appendChild(div); }); } else { sugBox.style.display = "none"; } };

function toggleCurrentFav() { if(!window.targetSpot) return; const idx = myFavs.indexOf(window.targetSpot.name); if(idx === -1) myFavs.push(window.targetSpot.name); else myFavs.splice(idx, 1); localStorage.setItem('ruifang_favs', JSON.stringify(myFavs)); document.getElementById("card-fav-icon").className = myFavs.includes(window.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; saveFavToCloud(); }
function toggleFavList() { const p = document.getElementById("fav-list-panel"); if(p.style.display === "block") { p.style.display = "none"; } else { p.innerHTML = ""; if(myFavs.length === 0) { p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; } else { myFavs.forEach(name => { const div = document.createElement("div"); div.className = "list-item"; div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; div.onclick = () => triggerSearch(name); p.appendChild(div); }); } p.style.display = "block"; } }
function shareSpot() { if(!window.targetSpot) return; const spotUrl = new URL(window.location.href); spotUrl.searchParams.set('spot', window.targetSpot.name); const shareData = { title: `瑞芳導覽地圖 - ${window.targetSpot.name}`, text: `我在瑞芳地圖上發現了「${window.targetSpot.name}」！\n趕快點擊連結查看：`, url: spotUrl.toString() }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 已複製景點資訊與連結！')); }

function resetNorth() { window.mapInstance.flyTo([25.1032, 121.8224], 14); } 
function goToUser() { if(window.userPos) { window.mapInstance.flyTo(window.userPos, 16); } else { alert("📍 正在獲取定位...\n若無反應，請確認您已開啟手機與瀏覽器的 GPS 定位權限！"); window.mapInstance.locate({setView: false, watch: true, enableHighAccuracy: true}); } } 
function drawThemeRoute() { if(currentRoute) window.mapInstance.removeLayer(currentRoute); currentRoute = L.polyline(themeRouteCoords, { color: '#8e44ad', weight: 6, dashArray: '10, 10' }).addTo(window.mapInstance); window.mapInstance.fitBounds(currentRoute.getBounds(), { padding: [50, 50] }); closeCard(); alert("🚀 推薦路線已載入！"); } 
function goToStation() { const ruiIcon = document.querySelector('.rui-icon'); if(ruiIcon){ ruiIcon.classList.remove('stamped'); void ruiIcon.offsetWidth; ruiIcon.classList.add('stamped'); } window.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); } 
function aiTrip() { if(!window.userPos) return alert("等待 GPS 定位..."); const sorted = [...spots].sort((a,b) => window.mapInstance.distance(window.userPos,[a.lat,a.lng]) - window.mapInstance.distance(window.userPos,[b.lat,b.lng])); alert("🤖 AI 推薦最近景點：\n" + sorted.slice(0,5).map((s,i) => `${i+1}. ${s.name}`).join("\n")); }

const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; cardEl.addEventListener('touchstart', (e) => { if(cardEl.scrollTop===0){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }},{passive:true}); cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});

// =========================================
// 8. 系統初始化啟動
// =========================================
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search); const spotQuery = params.get('spot');
    if(spotQuery) { const s = spots.find(x => x.name === spotQuery); if(s) { setTimeout(() => { window.mapInstance.flyTo([s.lat, s.lng], 16); showCard(s); }, 1000); } }
    
    applyLanguage(currentLang); fetchWeather();
    const savedTheme = localStorage.getItem('ruifang_theme');
    if (savedTheme) { applyCustomTheme(savedTheme); } else { applyCustomTheme('#007bff'); }

    const splash = document.getElementById('splash-screen');
    const welcome = document.getElementById('welcome-screen');
    const tutorial = document.getElementById('tutorial-overlay');

    if(localStorage.getItem('ruifang_welcomed')) { 
        if(splash) splash.style.display = 'none'; 
        if(welcome) welcome.style.display = 'none'; 
        if(tutorial) tutorial.style.display = 'none';
        window.mapInstance.invalidateSize(); 
    } else {
        // 第一次訪問：確保 2.5 秒後淡出
        setTimeout(() => {
            if(splash) {
                splash.style.opacity = '0';
                setTimeout(() => { splash.style.display = 'none'; }, 500);
            }
        }, 2500);
    }
});
