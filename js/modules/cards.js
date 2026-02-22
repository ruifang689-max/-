// js/modules/cards.js (v629) - 語音導覽修復版
import { state, saveState } from '../core/store.js';
import { translations } from '../data/lang.js';

export function getPlaceholderImage(text) {
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200; const ctx = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#007bff';
    ctx.fillStyle = color; ctx.fillRect(0, 0, 400, 200); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 200, 100);
    return canvas.toDataURL('image/jpeg', 0.8);
}

// =========================================
// 🌟 核心新功能：切換語音導覽 (TTS)
// 改為標準的 export 函數，避免模組載入順序錯誤
// =========================================
export function toggleTTS() {
    // 檢查瀏覽器支援度
    if (!window.speechSynthesis) {
        if(typeof window.showToast === 'function') window.showToast('您的瀏覽器不支援語音功能', 'error');
        return;
    }
    
    // 如果正在播放，就當作「停止鍵」使用
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if(typeof window.showToast === 'function') window.showToast('🔇 語音導覽已停止', 'info');
        return;
    }

    const s = state.targetSpot;
    if (!s) return;
    
    // 抓取要朗讀的內容，並用 Regex 過濾掉 HTML 標籤，確保發音正常
    const rawText = (s.description || s.highlights || s.history || "暫無詳細介紹").replace(/<[^>]*>?/gm, '');
    const textToSpeak = `${s.name}。${rawText}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // 根據目前的語系設定發音口音
    const langMap = { 'zh': 'zh-TW', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR' };
    utterance.lang = langMap[state.currentLang] || 'zh-TW';
    utterance.rate = 0.95; // 稍微放慢語速，讓長輩也聽得清楚
    
    window.speechSynthesis.speak(utterance);
    
    // 搭配我們剛做的 Toast 提示系統
    if(typeof window.showToast === 'function') window.showToast('🔊 語音導覽播放中...', 'success');
}

// 🌟 將函數掛載到全域，讓 HTML 字串的 onclick 可以直接呼叫
window.toggleTTS = toggleTTS;

export function showCard(s) { 
    state.targetSpot = s; 
    document.getElementById("card-fav-icon").className = (state.myFavs || []).includes(s.name) ? "fas fa-heart active" : "fas fa-heart"; 
    document.getElementById("title").innerText = s.name; 
    
    // 圖片懶載入
    const imgEl = document.getElementById('img');
    if (imgEl) {
        imgEl.loading = "lazy";
        imgEl.src = s.wikiImg || getPlaceholderImage(s.name);
        imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); };
    }
    
    // 標籤處理
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
    
    const desc = s.description || s.highlights || "暫無介紹";
    const highlightsEl = document.getElementById("card-highlights");
    if (highlightsEl) highlightsEl.innerHTML = warningHtml + officialDetails + `<div>${desc}</div>`;
    
    const foodEl = document.getElementById("card-food"); 
    if(foodEl) { foodEl.style.display = "block"; foodEl.innerText = s.food || "--"; }
    
    const historyEl = document.getElementById("card-history"); 
    if(historyEl) { historyEl.style.display = "block"; historyEl.innerText = s.history || "--"; }
    
    const transportEl = document.getElementById("card-transport"); 
    if(transportEl) { transportEl.style.display = "block"; transportEl.innerText = s.transport || "自行前往"; }
    
    // =========================================
    // 🌟 按鈕渲染 (語音導覽按鈕改為直接呼叫 toggleTTS)
    // =========================================
    const t = translations[state.currentLang] || translations['zh'];
    const btnGroup = document.getElementById("card-btn-group");
    
    if (tags.includes('自訂')) { 
        btnGroup.innerHTML = `
            <button onclick="startNav()" style="flex: 1;"><i class="fas fa-location-arrow"></i> ${t.nav || '導航'}</button>
            <button class="secondary" onclick="toggleTTS()"><i class="fas fa-volume-up"></i> 語音</button>
            <button class="secondary" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i> 編輯</button>
            <button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i> 刪除</button>
        `; 
    } else { 
        btnGroup.innerHTML = `
            <button onclick="startNav()"><i class="fas fa-location-arrow"></i> ${t.nav || '導航'}</button>
            <button class="secondary" onclick="toggleTTS()"><i class="fas fa-volume-up"></i> 語音</button>
            <button class="secondary" onclick="aiTrip()"><i class="fas fa-magic"></i> ${t.ai || 'AI 行程'}</button>
        `; 
    }
    
    document.getElementById("card").classList.add("open"); 
    document.getElementById("card").style.transform = ''; 
}

export function closeCard() { 
    document.getElementById("card").classList.remove("open"); 
    document.getElementById("card").style.transform = ''; 
    // 🌟 貼心設計：關閉卡片時立刻中斷語音，避免背景一直碎碎念
    if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function initCardGestures() {
    const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; 
    cardEl.addEventListener('touchstart', (e) => { if(cardEl.scrollTop===0){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }},{passive:true}); 
    cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); 
    cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});
}
