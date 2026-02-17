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
    const imgEl = document.getElementById("img"); imgEl.src = s.wikiImg || getPlaceholderImage(s.name); imgEl.onerror = () => { imgEl.src = getPlaceholderImage(s.name); }; 
    document.getElementById("card-tags").innerHTML = s.tags.map(t => `<span class="info-tag">${t}</span>`).join(''); 
    document.getElementById("card-food").innerText = s.food || "--"; document.getElementById("card-highlights").innerText = s.highlights || "暫無介紹"; 
    document.getElementById("card-history").innerText = s.history || "無"; document.getElementById("card-transport").innerText = s.transport || "自行前往"; 
    
    // 渲染按鈕
    const t = translations[state.currentLang] || translations['zh'];
    const btnGroup = document.getElementById("card-btn-group");
    if (s.tags.includes('自訂')) { btnGroup.innerHTML = `<button onclick="startNav()" style="flex: 1.2;"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="secondary" onclick="openEditModal('${s.name}')"><i class="fas fa-edit"></i> 編輯</button><button class="danger" onclick="deleteCustomSpot('${s.name}')"><i class="fas fa-trash-alt"></i> 刪除</button>`; } 
    else { btnGroup.innerHTML = `<button onclick="startNav()"><i class="fas fa-location-arrow"></i> ${t.nav}</button><button class="secondary" onclick="aiTrip()"><i class="fas fa-magic"></i> ${t.ai}</button>`; }
    
    document.getElementById("card").classList.add("open"); 
    document.getElementById("card").style.transform = ''; 
}

export function closeCard() { document.getElementById("card").classList.remove("open"); document.getElementById("card").style.transform = ''; }

export function initCardGestures() {
    const cardEl = document.getElementById("card"); let touchStartY = 0, isSwiping = false; 
    cardEl.addEventListener('touchstart', (e) => { if(cardEl.scrollTop===0){ touchStartY=e.touches[0].clientY; isSwiping=true; cardEl.style.transition='none'; }},{passive:true}); 
    cardEl.addEventListener('touchmove', (e) => { if(isSwiping && e.touches[0].clientY > touchStartY){ cardEl.style.transform=`translateY(${e.touches[0].clientY - touchStartY}px)`; }}); 
    cardEl.addEventListener('touchend', (e) => { if(isSwiping){ isSwiping=false; cardEl.style.transition='transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)'; if((e.changedTouches[0]?.clientY || 0) - touchStartY > 100) closeCard(); else cardEl.style.transform=''; }});
}
