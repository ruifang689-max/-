// js/modules/cards.js (v680) - 資訊卡片重構與風格化版
import { state } from '../core/store.js';

// 🌟 1. 動態注入卡片專屬 CSS (包含風格化紋理與路線選單)
const injectCardCSS = () => {
    if (document.getElementById('card-style-v680')) return;
    const style = document.createElement('style');
    style.id = 'card-style-v680';
    style.innerHTML = `
        /* --- 風格化主題定義 --- */
        #card.theme-jiufen { --card-accent: #e74c3c; --card-bg: #fff5f5; } /* 九份：紅燈籠 */
        #card.theme-jinguashi { --card-accent: #d4ac0d; --card-bg: #fcfbf6; } /* 金瓜石：黃金 */
        #card.theme-houtong { --card-accent: #e67e22; --card-bg: #fffcf5; } /* 猴硐：貓橘 */
        #card.theme-shuinandong { --card-accent: #3498db; --card-bg: #f0f8ff; } /* 水湳洞：陰陽海藍 */
        #card.theme-default { --card-accent: var(--primary); --card-bg: #ffffff; }

        /* --- 卡片結構優化 --- */
        #card { background: var(--card-bg); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s; }
        .card-hero { position: relative; width: 100%; height: 220px; overflow: hidden; }
        .card-hero img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .card-hero::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 60px; background: linear-gradient(to top, var(--card-bg), transparent); }
        
        .card-header-overlay { position: absolute; bottom: 10px; left: 20px; right: 20px; z-index: 2; }
        .card-title-text { font-size: 24px; font-weight: 800; color: #2c3e50; text-shadow: 2px 2px 0px rgba(255,255,255,0.8); margin-bottom: 4px; }
        
        /* 標籤群組 */
        .card-tags-scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .info-tag { background: rgba(255,255,255,0.9); border: 1px solid var(--card-accent); color: var(--card-accent); font-size: 12px; padding: 2px 8px; border-radius: 12px; white-space: nowrap; font-weight: bold; }

        /* 資訊區塊 */
        .card-content-body { padding: 0 20px 80px 20px; }
        .info-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 14px; color: #555; line-height: 1.5; }
        .info-row i { color: var(--card-accent); width: 18px; text-align: center; margin-top: 3px; flex-shrink: 0; }
        .info-row a { color: var(--card-accent); text-decoration: none; border-bottom: 1px dashed; }
        
        .section-title { font-size: 16px; font-weight: bold; color: #333; margin: 20px 0 8px 0; display: flex; align-items: center; gap: 6px; }
        .section-title::before { content: ''; width: 4px; height: 16px; background: var(--card-accent); border-radius: 2px; }
        
        /* 路線選單 (Action Sheet) */
        .route-menu-overlay { position: absolute; bottom: 0; left: 0; width: 100%; background: white; border-radius: 20px 20px 0 0; box-shadow: 0 -5px 20px rgba(0,0,0,0.2); transform: translateY(100%); transition: transform 0.3s; z-index: 100; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .route-menu-overlay.active { transform: translateY(0); }
        .route-btn-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: #f8f9fa; border: 1px solid #eee; color: #333; font-weight: bold; text-decoration: none; }
        .route-btn-item:active { background: #e9ecef; transform: scale(0.98); }
        .route-btn-item i { font-size: 18px; color: var(--primary); }
        .route-close { text-align: center; padding: 10px; color: #888; font-size: 13px; margin-top: 5px; }

        /* 底部按鈕優化 */
        #card-btn-group { padding: 12px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(5px); border-top: 1px solid rgba(0,0,0,0.05); }
        #card-btn-group button { border-radius: 12px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: none; }
        #card-btn-group button.primary { background: var(--card-accent); color: white; }
    `;
    document.head.appendChild(style);
};

export function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400; const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(0, 0, 600, 400); 
    ctx.fillStyle = color; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 300, 200);
    return canvas.toDataURL('image/jpeg', 0.8);
}

// 🌟 根據景點標籤決定主題風格
const getCardTheme = (tags) => {
    const t = (tags || []).join('');
    if (t.includes('九份')) return 'theme-jiufen';
    if (t.includes('金瓜石') || t.includes('黃金')) return 'theme-jinguashi';
    if (t.includes('猴硐') || t.includes('貓')) return 'theme-houtong';
    if (t.includes('水湳洞') || t.includes('陰陽海')) return 'theme-shuinandong';
    return 'theme-default';
};

export function showCard(s) { 
    injectCardCSS();
    state.targetSpot = s; 
    
    // 1. 設定主題色
    const cardEl = document.getElementById("card");
    const tags = s.tags ? (Array.isArray(s.tags) ? s.tags : [s.tags]) : [];
    cardEl.className = getCardTheme(tags); // 清除舊 class 並套用新 theme

    // 2. 準備翻譯與資料
    const t = window.rfApp.t || (k => k); 
    const lang = state.currentLang || 'zh';
    
    // 3. 建構 HTML 內容 (v680 結構)
    const imgUrl = s.wikiImg || s.coverImg || getPlaceholderImage(s.name);
    
    // 警告與狀態
    const warningHtml = s.warning ? `<div class="warning-banner" style="background:#fff3cd; color:#856404; padding:10px; border-radius:8px; margin-bottom:15px; font-size:13px; display:flex; gap:8px;"><i class="fas fa-exclamation-triangle"></i><span>${s.warning}</span></div>` : '';
    
    // 詳細資訊欄 (地址、電話、時間)
    let infoHtml = '';
    if (s.address) infoHtml += `<div class="info-row"><i class="fas fa-map-marker-alt"></i> <span onclick="window.rfApp.custom.copyAddr('${s.address}')" style="cursor:pointer;">${s.address} <i class="far fa-copy" style="font-size:11px; width:auto; margin-left:4px; opacity:0.6;"></i></span></div>`;
    if (s.openTime) infoHtml += `<div class="info-row"><i class="fas fa-clock"></i> <span>${s.openTime}</span></div>`;
    if (s.tel && s.tel !== '無') infoHtml += `<div class="info-row"><i class="fas fa-phone"></i> <a href="tel:${s.tel}">${s.tel}</a></div>`;
    
    // 主要敘述
    const desc = s.description || s.highlights || (lang === 'zh' ? "暫無詳細介紹，建議親自前往探索。" : "No description available.");
    
    // 分類區塊 (歷史、美食、交通)
    let sectionsHtml = '';
    if (s.history && s.history !== "暫無歷史資訊" && s.history !== "--") {
        sectionsHtml += `<div class="section-title">${t('history') || '歷史背景'}</div><div style="font-size:14px; color:#666; text-align:justify;">${s.history}</div>`;
    }
    if (s.food && s.food !== "--") {
        sectionsHtml += `<div class="section-title">${t('food') || '推薦美食'}</div><div style="font-size:14px; color:#666;">${s.food}</div>`;
    }
    if (s.transport && s.transport !== "自行前往" && s.transport !== "--") {
        sectionsHtml += `<div class="section-title">${t('transport') || '交通資訊'}</div><div style="font-size:14px; color:#666;">${s.transport}</div>`;
    }

    // 4. 寫入 DOM
    // Hero 區
    const imgEl = document.getElementById('img');
    if(imgEl) { imgEl.src = imgUrl; imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); }; }
    
    // 標題與標籤
    document.getElementById("title").innerText = s.name;
    document.getElementById("title").className = "card-title-text"; // 套用新樣式
    document.getElementById("card-tags").innerHTML = `<div class="card-tags-scroll">${tags.map(tag => `<span class="info-tag">${tag}</span>`).join('')}</div>`;
    
    // 愛心狀態
    document.getElementById("card-fav-icon").className = (state.myFavs || []).includes(s.name) ? "fas fa-heart active" : "fas fa-heart"; 

    // 內容區
    const highlightsEl = document.getElementById("card-highlights");
    if (highlightsEl) {
        highlightsEl.innerHTML = `
            ${warningHtml}
            <div style="margin-bottom:15px;">${infoHtml}</div>
            <div style="font-size:15px; line-height:1.6; color:#333;">${desc}</div>
            ${sectionsHtml}
            <div id="route-menu-container" class="route-menu-overlay"></div>
        `;
    }
    
    // 隱藏舊版獨立區塊 (因為都整合進 sectionsHtml 了)
    ['card-food', 'card-history', 'card-transport'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    // 5. 按鈕群組 (P2-3 路線規劃整合)
    const btnGroup = document.getElementById("card-btn-group");
    const txtNav = t('nav') || '導航'; // 這裡改為「前往」意象
    const txtRoute = lang === 'en' ? 'Route' : '前往';
    const txtVoice = lang === 'en' ? 'Voice' : '語音';
    const txtEdit = lang === 'en' ? 'Edit' : '編輯';
    const txtDel = lang === 'en' ? 'Delete' : '刪除';

    if (tags.includes('自訂')) { 
        btnGroup.innerHTML = `
            <button class="primary" onclick="window.rfApp.cards.openRouteMenu()" style="flex: 1.2;"><i class="fas fa-directions"></i> ${txtRoute}</button>
            <button class="secondary" onclick="toggleTTS()"><i class="fas fa-volume-up"></i></button>
            <button class="secondary" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i></button>
            <button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i></button>
        `; 
    } else { 
        btnGroup.innerHTML = `
            <button class="primary" onclick="window.rfApp.cards.openRouteMenu()" style="flex: 2;"><i class="fas fa-directions"></i> ${txtRoute}</button>
            <button class="secondary" onclick="toggleTTS()" style="flex: 1;"><i class="fas fa-volume-up"></i> ${txtVoice}</button>
            <button class="secondary" onclick="shareSpot()" style="flex: 0.8;"><i class="fas fa-share-alt"></i></button>
        `; 
    }
    
    // 6. 註冊路線選單邏輯
    window.rfApp.cards.openRouteMenu = () => {
        const menu = document.getElementById('route-menu-container');
        if(!menu) return;
        
        // 產生 Google Maps 連結
        const lat = s.lat, lng = s.lng;
        const name = encodeURIComponent(s.name);
        
        menu.innerHTML = `
            <div style="font-weight:bold; margin-bottom:10px; color:#555;">選擇前往方式：</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=driving" target="_blank" class="route-btn-item"><i class="fas fa-car"></i> 開車 (Driving)</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=motorcycle" target="_blank" class="route-btn-item"><i class="fas fa-motorcycle"></i> 機車 (Scooter)</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=transit" target="_blank" class="route-btn-item"><i class="fas fa-bus"></i> 大眾運輸 (Bus/Train)</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}&travelmode=walking" target="_blank" class="route-btn-item"><i class="fas fa-walking"></i> 步行 (Walk)</a>
            <div class="route-close" onclick="document.getElementById('route-menu-container').classList.remove('active')">取消</div>
        `;
        menu.classList.add('active');
    };

    // 7. 開啟卡片動畫
    cardEl.classList.add("open"); 
    cardEl.style.transform = ''; 
}

export function closeCard() { 
    const cardEl = document.getElementById("card");
    cardEl.classList.remove("open"); 
    cardEl.style.transform = ''; 
    // 關閉時也隱藏選單
    const menu = document.getElementById('route-menu-container');
    if(menu) menu.classList.remove('active');
    
    if (typeof window.stopTTS === 'function') window.stopTTS();
}

// 註冊到全域
window.rfApp = window.rfApp || {};
window.rfApp.cards = { openRouteMenu: null }; // 佔位

export function initCardGestures() {
    const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; 
    cardEl.addEventListener('touchstart', (e) => { 
        // 只有在最頂端且不是點擊選單時才觸發下滑關閉
        if(cardEl.scrollTop===0 && !e.target.closest('.route-menu-overlay')){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }
    },{passive:true}); 
    cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); 
    cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});
}
