// js/modules/cards.js (v682) - 預覽小卡與自動重構 DOM 版
import { state } from '../core/store.js';

window.rfApp = window.rfApp || {};
window.rfApp.cards = window.rfApp.cards || {};

let isCardInitialized = false;

// 計算使用者到景點的距離
function getDistanceText(lat, lng) {
    if (!state.userLocation || !state.userLocation.lat) return "";
    const R = 6371; 
    const dLat = (lat - state.userLocation.lat) * Math.PI / 180;
    const dLon = (lng - state.userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(state.userLocation.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    if (d < 1) return `📍 距離 ${(d*1000).toFixed(0)}m`;
    return `📍 距離 ${d.toFixed(1)}km`;
}

// 🌟 自動重構 HTML 結構
function initCardDOM() {
    if (isCardInitialized) return;
    const cardEl = document.getElementById("card");
    if (!cardEl) return;

    // 將原本簡單的 HTML 替換為支援「預覽/展開」雙模式的結構
    cardEl.innerHTML = `
        <div class="card-drag-handle" id="card-drag-handle">
            <div class="drag-pill"></div>
        </div>
        
        <div id="card-preview-zone" onclick="window.rfApp.cards.expandCard()">
            <div class="preview-img-wrap">
                <img id="preview-img" src="" alt="preview">
            </div>
            <div class="preview-info">
                <h3 id="preview-title"></h3>
                <div id="preview-tags" class="card-tags-scroll" style="padding-bottom:0;"></div>
                <div id="preview-distance" style="font-size:12px; color:#888; margin-top:6px; font-weight:bold;"></div>
            </div>
            <div class="preview-action">
                <button class="icon-btn" onclick="event.stopPropagation(); window.rfApp.cards.openRouteMenu(event)"><i class="fas fa-directions" style="color:var(--primary)"></i></button>
            </div>
        </div>

        <div id="card-full-zone" class="u-hidden">
            <div class="card-hero">
                <img id="full-img" src="" alt="full">
                <div class="hero-overlay">
                    <h2 id="full-title"></h2>
                    <div class="card-header-icons">
                        <i class="fas fa-share-alt" id="card-share-icon" onclick="shareSpot()"></i>
                        <i class="fas fa-heart" id="card-fav-icon" onclick="toggleCurrentFav()"></i>
                    </div>
                </div>
            </div>
            <div class="card-content-body">
                <div id="full-tags" class="card-tags-scroll"></div>
                <div id="full-info-rows" style="margin-top:15px;"></div>
                <div id="full-desc" class="spot-desc"></div>
                <div id="full-sections"></div>
            </div>
        </div>

        <div id="card-btn-group" class="u-hidden"></div>

        <div id="route-menu-container" class="route-menu-overlay"></div>
    `;

    // 注入對應的 CSS
    const style = document.createElement('style');
    style.id = 'card-style-v682';
    style.innerHTML = `
        /* 主題色彩 (Item 24) */
        #card.theme-jiufen { --card-accent: #e74c3c; --card-bg: #fff5f5; }
        #card.theme-jinguashi { --card-accent: #d4ac0d; --card-bg: #fcfbf6; }
        #card.theme-houtong { --card-accent: #e67e22; --card-bg: #fffcf5; }
        #card.theme-shuinandong { --card-accent: #3498db; --card-bg: #f0f8ff; }
        #card.theme-default { --card-accent: var(--primary); --card-bg: #ffffff; }

        /* 卡片容器控制 */
        #card { 
            background: var(--card-bg); 
            border-radius: 20px 20px 0 0;
            padding: 0;
            display: flex; flex-direction: column;
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s;
            overflow: hidden;
            z-index: 2000;
        }
        #card.preview { height: auto; min-height: 110px; }
        #card.expanded { height: 85vh; }
        
        .card-drag-handle { width: 100%; height: 24px; display: flex; justify-content: center; align-items: center; cursor: grab; background: transparent; position: absolute; top:0; z-index: 10; }
        .drag-pill { width: 40px; height: 5px; background: rgba(0,0,0,0.2); border-radius: 3px; }

        /* 預覽模式樣式 */
        #card-preview-zone { display: flex; padding: 25px 15px 15px 15px; align-items: center; gap: 12px; cursor: pointer; }
        .preview-img-wrap { width: 70px; height: 70px; border-radius: 12px; overflow: hidden; flex-shrink:0; }
        .preview-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .preview-info { flex: 1; overflow: hidden; }
        #preview-title { margin: 0 0 6px 0; font-size: 18px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preview-action .icon-btn { background: #f0f4f8; border: none; width: 44px; height: 44px; border-radius: 50%; font-size: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

        /* 完整模式樣式 */
        #card-full-zone { flex: 1; overflow-y: auto; padding-bottom: 20px; display: flex; flex-direction: column; }
        .card-hero { position: relative; width: 100%; height: 220px; flex-shrink:0; }
        .card-hero img { width: 100%; height: 100%; object-fit: cover; }
        .hero-overlay { position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px 20px 15px 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; justify-content: space-between; align-items: flex-end; }
        #full-title { color: white; margin: 0; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
        .card-header-icons i { color: white; font-size: 22px; margin-left: 15px; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transition: transform 0.2s; }
        .card-header-icons i:active { transform: scale(1.2); }
        .card-header-icons i.active { color: #e74c3c; }

        .card-content-body { padding: 20px; }
        .card-tags-scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
        .card-tags-scroll::-webkit-scrollbar { display: none; }
        .info-tag { background: rgba(255,255,255,0.8); border: 1px solid var(--card-accent); color: var(--card-accent); font-size: 12px; padding: 3px 10px; border-radius: 12px; white-space: nowrap; font-weight: bold; }

        .info-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 14px; color: #555; line-height: 1.5; }
        .info-row i { color: var(--card-accent); width: 18px; text-align: center; margin-top: 3px; flex-shrink: 0; }
        .info-row a { color: var(--card-accent); text-decoration: none; border-bottom: 1px dashed; }
        
        .spot-desc { font-size: 15px; line-height: 1.6; color: #444; margin: 15px 0; padding: 15px; background: rgba(0,0,0,0.03); border-radius: 12px; }
        
        .section-title { font-size: 16px; font-weight: bold; color: #333; margin: 20px 0 8px 0; display: flex; align-items: center; gap: 6px; }
        .section-title::before { content: ''; width: 4px; height: 16px; background: var(--card-accent); border-radius: 2px; }
        .section-content { font-size: 14px; color: #666; text-align: justify; line-height: 1.6; }

        /* 路線選單 */
        .route-menu-overlay { position: absolute; bottom: 0; left: 0; width: 100%; background: white; border-radius: 20px 20px 0 0; box-shadow: 0 -5px 20px rgba(0,0,0,0.2); transform: translateY(100%); transition: transform 0.3s; z-index: 100; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .route-menu-overlay.active { transform: translateY(0); }
        .route-btn-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; background: #f8f9fa; border: 1px solid #eee; color: #333; font-weight: bold; text-decoration: none; font-size: 15px;}
        .route-btn-item:active { background: #e9ecef; transform: scale(0.98); }
        .route-btn-item i { font-size: 20px; color: var(--primary); width: 24px; text-align:center; }
        .route-close { text-align: center; padding: 12px; color: #888; font-size: 15px; margin-top: 5px; cursor: pointer; font-weight:bold; }

        /* 底部按鈕 */
        #card-btn-group { padding: 12px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(5px); border-top: 1px solid rgba(0,0,0,0.05); display: flex; gap: 10px; }
        #card-btn-group button { flex: 1; padding: 12px; border-radius: 12px; font-weight: bold; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 6px; font-size: 15px; }
        #card-btn-group button.primary { background: var(--card-accent); color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
        #card-btn-group button.secondary { background: #f0f0f0; color: #333; }
        #card-btn-group button.danger { background: #fee; color: #e74c3c; }
    `;
    document.head.appendChild(style);
    isCardInitialized = true;
}

export function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400; const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, 600, 400); 
    ctx.fillStyle = color; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 300, 200);
    return canvas.toDataURL('image/jpeg', 0.8);
}

const getCardTheme = (tags) => {
    const t = (tags || []).join('');
    if (t.includes('九份')) return 'theme-jiufen';
    if (t.includes('金瓜石') || t.includes('黃金') || t.includes('礦')) return 'theme-jinguashi';
    if (t.includes('猴硐') || t.includes('貓')) return 'theme-houtong';
    if (t.includes('水湳洞') || t.includes('陰陽海')) return 'theme-shuinandong';
    return 'theme-default';
};

export function showCard(s) { 
    initCardDOM(); // 確保 DOM 已被重構
    state.targetSpot = s; 
    
    const cardEl = document.getElementById("card");
    const tags = s.tags ? (Array.isArray(s.tags) ? s.tags : [s.tags]) : [];
    cardEl.className = getCardTheme(tags) + ' preview open'; // 🌟 預設顯示預覽模式
    
    const t = window.rfApp.t || (k => k); 
    const lang = state.currentLang || 'zh';
    const imgUrl = s.wikiImg || s.coverImg || getPlaceholderImage(s.name);
    const tagsHtml = tags.map(tag => `<span class="info-tag">${tag}</span>`).join('');

    // --- 填入預覽資料 ---
    document.getElementById("preview-title").innerText = s.name;
    const pImg = document.getElementById('preview-img');
    pImg.src = imgUrl; pImg.onerror = () => pImg.src = getPlaceholderImage(s.name);
    document.getElementById("preview-tags").innerHTML = tagsHtml;
    document.getElementById("preview-distance").innerText = getDistanceText(s.lat, s.lng);

    // --- 填入完整資料 ---
    document.getElementById("full-title").innerText = s.name;
    const fImg = document.getElementById('full-img');
    fImg.src = imgUrl; fImg.onerror = () => fImg.src = getPlaceholderImage(s.name);
    document.getElementById("full-tags").innerHTML = tagsHtml;
    document.getElementById("card-fav-icon").className = (state.myFavs || []).includes(s.name) ? "fas fa-heart active" : "fas fa-heart"; 
    
    let infoHtml = s.warning ? `<div class="warning-banner" style="background:#fff3cd; color:#856404; padding:10px; border-radius:8px; margin-bottom:15px; font-size:13px; display:flex; gap:8px;"><i class="fas fa-exclamation-triangle"></i><span>${s.warning}</span></div>` : '';
    if (s.address) infoHtml += `<div class="info-row"><i class="fas fa-map-marker-alt"></i> <span onclick="window.rfApp.custom.copyAddr('${s.address}')" style="cursor:pointer;">${s.address} <i class="far fa-copy" style="font-size:11px; opacity:0.6;"></i></span></div>`;
    if (s.openTime) infoHtml += `<div class="info-row"><i class="fas fa-clock"></i> <span>${s.openTime}</span></div>`;
    if (s.tel && s.tel !== '無') infoHtml += `<div class="info-row"><i class="fas fa-phone"></i> <a href="tel:${s.tel}">${s.tel}</a></div>`;
    document.getElementById("full-info-rows").innerHTML = infoHtml;
    
    document.getElementById("full-desc").innerText = s.description || s.highlights || (lang === 'zh' ? "暫無詳細介紹，建議親自前往探索。" : "No description available.");
    
    let sectionsHtml = '';
    if (s.history && s.history !== "暫無歷史資訊" && s.history !== "--") {
        sectionsHtml += `<div class="section-title">${t('history') || '歷史背景'}</div><div class="section-content">${s.history}</div>`;
    }
    if (s.food && s.food !== "--") {
        sectionsHtml += `<div class="section-title">${t('food') || '推薦美食'}</div><div class="section-content">${s.food}</div>`;
    }
    if (s.transport && s.transport !== "自行前往" && s.transport !== "--") {
        sectionsHtml += `<div class="section-title">${t('transport') || '交通資訊'}</div><div class="section-content">${s.transport}</div>`;
    }
    document.getElementById("full-sections").innerHTML = sectionsHtml;

    // --- 底部按鈕 ---
    const btnGroup = document.getElementById("card-btn-group");
    const txtRoute = lang === 'en' ? 'Route' : '前往';
    const txtVoice = lang === 'en' ? 'Voice' : '語音';

    if (tags.includes('自訂')) { 
        btnGroup.innerHTML = `
            <button class="primary" onclick="window.rfApp.cards.openRouteMenu()"><i class="fas fa-directions"></i> ${txtRoute}</button>
            <button class="secondary" onclick="toggleTTS()"><i class="fas fa-volume-up"></i></button>
            <button class="secondary" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i></button>
            <button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i></button>
        `; 
    } else { 
        btnGroup.innerHTML = `
            <button class="primary" onclick="window.rfApp.cards.openRouteMenu()" style="flex: 2;"><i class="fas fa-directions"></i> ${txtRoute}</button>
            <button class="secondary" onclick="toggleTTS()" style="flex: 1;"><i class="fas fa-volume-up"></i> ${txtVoice}</button>
        `; 
    }
    
    // --- 註冊路線選單邏輯 ---
    window.rfApp.cards.openRouteMenu = (e) => {
        if(e) e.stopPropagation();
        const menu = document.getElementById('route-menu-container');
        if(!menu) return;
        const lat = s.lat, lng = s.lng;
        const name = encodeURIComponent(s.name);
        
        menu.innerHTML = `
            <div style="font-weight:bold; margin-bottom:10px; color:#555;">選擇前往方式：</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=driving" target="_blank" class="route-btn-item"><i class="fas fa-car"></i> 開車 (Driving)</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=motorcycle" target="_blank" class="route-btn-item"><i class="fas fa-motorcycle"></i> 機車 (Scooter)</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=transit" target="_blank" class="route-btn-item"><i class="fas fa-bus"></i> 大眾運輸 (Transit)</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=walking" target="_blank" class="route-btn-item"><i class="fas fa-walking"></i> 步行 (Walk)</a>
            <div class="route-close" onclick="document.getElementById('route-menu-container').classList.remove('active')">取消</div>
        `;
        menu.classList.add('active');
    };

    // 重設顯示狀態：先顯示 preview，隱藏 full
    document.getElementById("card-preview-zone").classList.remove('u-hidden');
    document.getElementById("card-full-zone").classList.add('u-hidden');
    document.getElementById("card-btn-group").classList.add('u-hidden');
}

// 🌟 展開卡片邏輯
window.rfApp.cards.expandCard = () => {
    const cardEl = document.getElementById("card");
    if(!cardEl || cardEl.classList.contains('expanded')) return;
    
    cardEl.classList.remove('preview');
    cardEl.classList.add('expanded');
    
    document.getElementById("card-preview-zone").classList.add('u-hidden');
    document.getElementById("card-full-zone").classList.remove('u-hidden');
    document.getElementById("card-btn-group").classList.remove('u-hidden');
};

export function closeCard() { 
    const cardEl = document.getElementById("card");
    if(!cardEl) return;
    
    // 如果是展開狀態，先縮回預覽；如果是預覽，則完全關閉
    if (cardEl.classList.contains('expanded')) {
        cardEl.classList.remove('expanded');
        cardEl.classList.add('preview');
        
        document.getElementById("card-preview-zone").classList.remove('u-hidden');
        document.getElementById("card-full-zone").classList.add('u-hidden');
        document.getElementById("card-btn-group").classList.add('u-hidden');
        
        const menu = document.getElementById('route-menu-container');
        if(menu) menu.classList.remove('active');
        if (typeof window.stopTTS === 'function') window.stopTTS();
        
    } else {
        cardEl.classList.remove("open", "preview", "expanded"); 
        cardEl.style.transform = ''; 
    }
}

export function initCardGestures() {
    initCardDOM(); // 初始化 DOM
    const cardEl = document.getElementById("card"); 
    if(!cardEl) return;

    let touchStartY = 0, isSwiping = false; 
    
    cardEl.addEventListener('touchstart', (e) => { 
        const fullZone = document.getElementById('card-full-zone');
        const isAtTop = !fullZone || fullZone.scrollTop <= 0;
        
        if(isAtTop && !e.target.closest('.route-menu-overlay')){ 
            touchStartY = e.touches[0].clientY; 
            isSwiping = true; 
            cardEl.style.transition = 'none'; 
        }
    }, {passive:true}); 
    
    cardEl.addEventListener('touchmove', (e) => { 
        if(isSwiping && e.touches[0].clientY > touchStartY){ 
            cardEl.style.transform = `translateY(${e.touches[0].clientY - touchStartY}px)`; 
        } else if (isSwiping && e.touches[0].clientY < touchStartY - 20) {
            // 上滑自動展開
            if (cardEl.classList.contains('preview')) {
                window.rfApp.cards.expandCard();
                isSwiping = false;
                cardEl.style.transform = '';
            }
        }
    }); 
    
    cardEl.addEventListener('touchend', (e) => { 
        if(isSwiping){ 
            isSwiping = false; 
            cardEl.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'; 
            if((e.changedTouches[0]?.clientY || 0) - touchStartY > 60) {
                closeCard(); 
            } else { 
                cardEl.style.transform = ''; 
            }
        }
    });
}
