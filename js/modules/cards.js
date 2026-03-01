// js/modules/cards.js (自動推算本地圖片版)
import { state } from '../core/store.js';
import { spots } from '../data/spots.js';

export function openCardByName(name) { 
    // 合併官方景點與自訂景點來搜尋
    const allSpots = [...spots, ...(state.savedCustomSpots || [])];
    const s = allSpots.find(x => x.name === name); 
    if(s) showCard(s); 
}

export function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200; const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';
    ctx.fillStyle = color; ctx.fillRect(0, 0, 400, 200); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 200, 100);
    return canvas.toDataURL('image/jpeg', 0.8);
}

export function showCard(s) { 
    state.targetSpot = s; 
    document.getElementById("card-fav-icon").className = (state.myFavs || []).includes(s.name) ? "fas fa-heart active" : "fas fa-heart"; 
    document.getElementById("title").innerText = s.name; 
    
    const imgEl = document.getElementById('img');
    if (imgEl) {
        imgEl.loading = "lazy";
        
        // 1. 處理雲端圖與防護佔位文字
        let cloudImg = s.wikiImg || s.coverImg || "";
        if (typeof cloudImg === 'string' && cloudImg.includes('[圖片太大')) {
            cloudImg = ""; 
        }
        
        // 2. 自動推算本地端圖片路徑 (去除括號)
        const baseName = s.name.split('(')[0].trim();
        const localImg = `./assets/images/spots/${baseName}.jpg`;
        
        // 3. 先嘗試載入本地圖片，如果失敗 (觸發 onerror)，自動換成雲端圖或預設圖
        imgEl.src = localImg;
        imgEl.onerror = () => { 
            imgEl.onerror = null; // 避免死迴圈
            imgEl.src = cloudImg || getPlaceholderImage(s.name); 
        };
    }
    
    const tags = s.tags ? (Array.isArray(s.tags) ? s.tags : [s.tags]) : (s.category ? [s.category] : []);
    document.getElementById("card-tags").innerHTML = tags.map(t => `<span class="info-tag">${t}</span>`).join(''); 
    
    const warningHtml = s.warning ? `<div class="warning-banner"><i class="fas fa-exclamation-triangle"></i><span>${s.warning}</span></div>` : '';
    const officialDetails = (s.address || s.openTime || (s.tel && s.tel !== '無')) ? `
        <div class="spot-detail-info" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--glass);">
            ${s.address ? `<div><i class="fas fa-map-marker-alt"></i> ${s.address}</div>` : ''}
            ${s.openTime ? `<div><i class="fas fa-clock"></i> ${s.openTime}</div>` : ''}
            ${s.tel && s.tel !== '無' ? `<div><i class="fas fa-phone"></i> <a href="tel:${s.tel}">${s.tel}</a></div>` : ''}
        </div>
    ` : '';
    
    const t = window.rfApp.t || (k => k); 

    const desc = s.description || s.highlights || "暫無介紹";
    const highlightsEl = document.getElementById("card-highlights");
    if (highlightsEl) highlightsEl.innerHTML = warningHtml + officialDetails + `<div>${t(desc)}</div>`;
    
    const foodEl = document.getElementById("card-food"); 
    if(foodEl) { foodEl.style.display = "block"; foodEl.innerText = t(s.food) || "--"; }
    
    const historyEl = document.getElementById("card-history"); 
    if(historyEl) { historyEl.style.display = "block"; historyEl.innerText = t(s.history) || "--"; }
    
    const transportEl = document.getElementById("card-transport"); 
    if(transportEl) { transportEl.style.display = "block"; transportEl.innerText = t(s.transport) || t('self_transport'); }
    
    const btnGroup = document.getElementById("card-btn-group");
    
    const txtNav = t('nav') || '導航';
    const txtVoice = t('btn_voice') || '語音介紹';
    const txtEdit = t('編輯'); 
    const txtDel = t('刪除');  
    const txtAi = t('ai') || '智慧推薦';

    if (tags.includes('自訂')) { 
        btnGroup.innerHTML = `
            <button onclick="startNav()" style="flex: 1;"><i class="fas fa-location-arrow"></i> ${txtNav}</button>
            <button class="secondary" onclick="toggleTTS()"><i class="fas fa-volume-up"></i> ${txtVoice}</button>
            <button class="secondary" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i> ${txtEdit}</button>
            <button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i> ${txtDel}</button>
        `; 
    } else { 
        btnGroup.innerHTML = `
            <button onclick="startNav()"><i class="fas fa-location-arrow"></i> ${txtNav}</button>
            <button class="secondary" onclick="toggleTTS()"><i class="fas fa-volume-up"></i> ${txtVoice}</button>
            <button class="secondary" onclick="rfApp.route.addSpot('${s.name}')"><i class="fas fa-plus-circle"></i> 加入行程</button>
        `; 
    }
    
    document.getElementById("card").classList.add("open"); 
    document.getElementById("card").style.transform = ''; 
}

export function closeCard() { 
    document.getElementById("card").classList.remove("open"); 
    document.getElementById("card").style.transform = ''; 
    if (typeof window.stopTTS === 'function') window.stopTTS();
}

export function initCardGestures() {
    const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; 
    cardEl.addEventListener('touchstart', (e) => { if(cardEl.scrollTop===0){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }},{passive:true}); 
    cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); 
    cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});
}
