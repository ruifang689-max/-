// js/modules/cards.js (v661) - 國際化 UI 補完版
import { state, saveState } from '../core/store.js';

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
        imgEl.src = s.wikiImg || s.coverImg || getPlaceholderImage(s.name);
        imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); };
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
    
    // 🌟 引入全域翻譯，若找不到則回退為中文預設值
    const t = window.rfApp.t || (k => k); 

    const desc = s.description || s.highlights || "暫無介紹";
    const highlightsEl = document.getElementById("card-highlights");
    if (highlightsEl) highlightsEl.innerHTML = warningHtml + officialDetails + `<div>${desc}</div>`;
    
    const foodEl = document.getElementById("card-food"); 
    if(foodEl) { foodEl.style.display = "block"; foodEl.innerText = s.food || "--"; }
    
    const historyEl = document.getElementById("card-history"); 
    if(historyEl) { historyEl.style.display = "block"; historyEl.innerText = s.history || "--"; }
    
    const transportEl = document.getElementById("card-transport"); 
    // 加入翻譯
    const selfGuideTxt = state.currentLang === 'en' ? 'Go by yourself' : (state.currentLang === 'ja' ? '各自アクセス' : '自行前往');
    if(transportEl) { transportEl.style.display = "block"; transportEl.innerText = s.transport || selfGuideTxt; }
    
    const btnGroup = document.getElementById("card-btn-group");
    
    // 🌟 將按鈕文字也接上動態翻譯
    const txtNav = t('nav') || '導航';
    const txtVoice = state.currentLang === 'en' ? 'Voice' : (state.currentLang === 'ja' ? '音声' : '語音');
    const txtEdit = state.currentLang === 'en' ? 'Edit' : (state.currentLang === 'ja' ? '編集' : '編輯');
    const txtDel = state.currentLang === 'en' ? 'Delete' : (state.currentLang === 'ja' ? '削除' : '刪除');
    const txtAi = t('ai') || 'AI 行程';

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
            <button class="secondary" onclick="aiTrip()"><i class="fas fa-magic"></i> ${txtAi}</button>
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
