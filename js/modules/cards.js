import { state, saveState } from '../core/store.js';
import { translations } from '../data/lang.js';

export function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200; const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';
    ctx.fillStyle = color; ctx.fillRect(0, 0, 400, 200); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 200, 100);
    return canvas.toDataURL('image/jpeg', 0.8);
}

export function showCard(s) { 
    state.targetSpot = s; 
    document.getElementById("card-fav-icon").className = state.myFavs.includes(s.name) ? "fas fa-heart active" : "fas fa-heart"; 
    document.getElementById("title").innerText = s.name; 
    
    // 1. 圖片處理
    const imgEl = document.getElementById("img"); 
    imgEl.src = s.wikiImg || s.brochureUrl || getPlaceholderImage(s.name); 
    imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); }; 
    
    // 2. 標籤處理 (相容舊版自訂 tags 陣列，或新版官方 category 字串)
    const tags = s.tags ? s.tags : (s.category ? [s.category] : []);
    document.getElementById("card-tags").innerHTML = tags.map(t => `<span class="info-tag">${t}</span>`).join(''); 
    
    // =========================================
    // 🌟 3. 核心優化：渲染官方詳細資訊與警告橫幅
    // =========================================
    const warningHtml = s.warning ? `<div class="warning-banner"><i class="fas fa-exclamation-triangle"></i><span>${s.warning}</span></div>` : '';
    const detailHtml = `
        ${warningHtml}
        <div class="spot-detail-info">
            ${s.address ? `<div><i class="fas fa-map-marker-alt"></i> ${s.address}</div>` : ''}
            ${s.openTime ? `<div><i class="fas fa-clock"></i> ${s.openTime}</div>` : ''}
            ${s.tel && s.tel !== '無' ? `<div><i class="fas fa-phone"></i> <a href="tel:${s.tel}">${s.tel}</a></div>` : ''}
        </div>
        <div style="line-height: 1.6; margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(0,0,0,0.1);">
            ${s.description || s.highlights || "暫無官方介紹"}
        </div>
    `;
    
    // 將豐富的官方資訊統一塞入 highlights 區塊
    const highlightsEl = document.getElementById("card-highlights");
    if (highlightsEl) highlightsEl.innerHTML = detailHtml;
    
    // 隱藏舊版的獨立文字欄位 (避免版面錯亂)
    const foodEl = document.getElementById("card-food"); if(foodEl) foodEl.style.display = "none"; 
    const historyEl = document.getElementById("card-history"); if(historyEl) historyEl.style.display = "none"; 
    const transportEl = document.getElementById("card-transport"); if(transportEl) transportEl.style.display = "none"; 
    
    // =========================================
    // 4. 渲染按鈕
    // =========================================
    const t = translations[state.currentLang] || translations['zh'];
    const btnGroup = document.getElementById("card-btn-group");
    
    // 判斷是否為使用者自訂景點
    if (tags.includes('自訂')) { 
        btnGroup.innerHTML = `<button onclick="startNav()" style="flex: 1.2;"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="secondary" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i> 編輯</button><button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i> 刪除</button>`; 
    } else { 
        btnGroup.innerHTML = `<button onclick="startNav()"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="secondary" onclick="aiTrip()"><i class="fas fa-magic"></i> ${t.ai}</button>`; 
    }
    
    // 5. 展開卡片
    document.getElementById("card").classList.add("open"); 
    document.getElementById("card").style.transform = ''; 
}

export function closeCard() { 
    document.getElementById("card").classList.remove("open"); 
    document.getElementById("card").style.transform = ''; 
}

export function initCardGestures() {
    const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; 
    cardEl.addEventListener('touchstart', (e) => { if(cardEl.scrollTop===0){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }},{passive:true}); 
    cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); 
    cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});
}
