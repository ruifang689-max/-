/**
 * js/modules/ui.js (v401)
 * 負責：設定、教學、PWA、收藏夾、自訂景點編輯
 */
// js/modules/ui.js
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';
import { triggerSearch } from './search.js';

export function initUI() {
    window.resetNorth = () => { state.mapInstance.flyTo([25.1032, 121.8224], 14); };
    window.goToStation = () => { state.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); };
    window.aiTrip = () => { 
        if(!state.userPos) return alert("等待 GPS 定位..."); 
        const sorted = spots.concat(state.savedCustomSpots).sort((a,b) => state.mapInstance.distance(state.userPos,[a.lat,a.lng]) - state.mapInstance.distance(state.userPos,[b.lat,b.lng])); 
        alert("🤖 AI 推薦最近景點：\n" + sorted.slice(0,5).map((s,i) => `${i+1}. ${s.name}`).join("\n")); 
    };

    window.openSettings = () => { document.getElementById('settings-modal-overlay').style.display = 'flex'; };
    window.closeSettings = () => { document.getElementById('settings-modal-overlay').style.display = 'none'; };
    window.toggleSkipIntro = (isChecked) => { localStorage.setItem('ruifang_skip_intro', isChecked ? 'true' : 'false'); };
    
    window.reopenTutorial = () => { window.closeSettings(); document.getElementById('tutorial-overlay').style.display = 'flex'; setTimeout(() => { document.getElementById('tutorial-overlay').style.opacity = '1'; }, 50); document.getElementById('tut-step-1').style.display = 'block'; document.getElementById('tut-step-2').style.display = 'none'; };
    window.enterMap = () => { document.getElementById('welcome-screen').style.opacity = '0'; setTimeout(() => { document.getElementById('welcome-screen').style.display = 'none'; document.getElementById('tutorial-overlay').style.display = 'flex'; setTimeout(() => { document.getElementById('tutorial-overlay').style.opacity = '1'; }, 50); }, 400); };
    window.nextTutorial = () => { document.getElementById('tut-step-1').style.display = 'none'; document.getElementById('tut-step-2').style.display = 'block'; };
    window.prevTutorial = () => { document.getElementById('tut-step-2').style.display = 'none'; document.getElementById('tut-step-1').style.display = 'block'; };
    window.finishTutorial = () => { document.getElementById('tutorial-overlay').style.opacity = '0'; setTimeout(() => { document.getElementById('tutorial-overlay').style.display = 'none'; localStorage.setItem('ruifang_welcomed', 'true'); if (state.mapInstance) state.mapInstance.invalidateSize(); }, 400); };

    let deferredPrompt;
    const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const btn = document.getElementById('install-btn-container'); if(btn) btn.style.display = 'block'; });
    
    window.installPWA = () => { if (isIos() && !isStandalone()) { document.getElementById('ios-instruction-modal').style.display = 'flex'; window.closeSettings(); return; } if (!deferredPrompt) return; document.getElementById('install-btn-container').style.display = 'none'; deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); };
    window.closeIosInstruction = () => { document.getElementById('ios-instruction-modal').style.display = 'none'; };

    window.shareSpot = () => { if(!state.targetSpot) return; const spotUrl = new URL(window.location.href.split('?')[0]); spotUrl.searchParams.set('spot', state.targetSpot.name); const shareData = { title: `瑞芳導覽 - ${state.targetSpot.name}`, text: `我在瑞芳發現了「${state.targetSpot.name}」！`, url: spotUrl.toString() }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 已複製景點連結！')); };
    window.shareAppMap = () => { const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); };

    window.toggleCurrentFav = () => { if(!state.targetSpot) return; const idx = state.myFavs.indexOf(state.targetSpot.name); if(idx === -1) state.myFavs.push(state.targetSpot.name); else state.myFavs.splice(idx, 1); saveState.favs(); document.getElementById("card-fav-icon").className = state.myFavs.includes(state.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; };
    window.toggleFavList = () => { const p = document.getElementById("fav-list-panel"); if(p.style.display === "block") { p.style.display = "none"; } else { p.innerHTML = ""; if(state.myFavs.length === 0) { p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; } else { state.myFavs.forEach(name => { const div = document.createElement("div"); div.className = "list-item"; div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; div.onclick = () => { triggerSearch(name); p.style.display = "none"; }; p.appendChild(div); }); } const manageBtn = document.createElement('div'); manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);"; manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾"; manageBtn.onclick = () => { p.style.display = "none"; window.openFavManage(); }; p.appendChild(manageBtn); p.style.display = "block"; } };
    window.openFavManage = () => { document.getElementById('fav-manage-modal').style.display = 'flex'; renderFavManageList(); };
    window.closeFavManage = () => { document.getElementById('fav-manage-modal').style.display = 'none'; };
    
    function renderFavManageList() { const listEl = document.getElementById('fav-manage-list'); listEl.innerHTML = ''; if (state.myFavs.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; return; } state.myFavs.forEach((name, idx) => { const item = document.createElement('div'); item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px;"; item.innerHTML = `<span style="font-weight:bold; color:var(--text-main); font-size:14px;">${name}</span> <div style="display:flex; gap:6px;"> <button onclick="moveFav(${idx}, -1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button> <button onclick="moveFav(${idx}, 1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===state.myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button> <button onclick="removeFavManage('${name}')" style="padding:6px 10px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button> </div>`; listEl.appendChild(item); }); }
    window.moveFav = (idx, dir) => { if (idx + dir < 0 || idx + dir >= state.myFavs.length) return; const temp = state.myFavs[idx]; state.myFavs[idx] = state.myFavs[idx + dir]; state.myFavs[idx + dir] = temp; saveState.favs(); renderFavManageList(); };
    window.removeFavManage = (name) => { state.myFavs = state.myFavs.filter(fav => fav !== name); saveState.favs(); renderFavManageList(); if (state.targetSpot && state.targetSpot.name === name) document.getElementById("card-fav-icon").className = "fas fa-heart"; };

    // ==========================================
    // 🌟 全新長按獲取詳細地址 & 自訂景點 Modal 邏輯
    // ==========================================
    let tempCustomSpot = null; // 暫存長按點的資訊

    window.closeCustomSpotModal = () => {
        document.getElementById('custom-spot-modal').style.display = 'none';
        tempCustomSpot = null;
    };

    window.confirmCustomSpot = () => {
        const nameInput = document.getElementById('custom-spot-name').value.trim();
        const spotName = nameInput || "我的秘境";
        if (tempCustomSpot) {
            const newSpot = { 
                name: spotName, 
                lat: tempCustomSpot.lat, 
                lng: tempCustomSpot.lng, 
                tags: ["自訂"], 
                highlights: `詳細地址：${tempCustomSpot.addr}`, 
                food: "--", 
                history: "自訂標記", 
                transport: "自行前往", 
                wikiImg: "" 
            };
            state.savedCustomSpots.push(newSpot); 
            saveState.customSpots(); 
            addMarkerToMap(newSpot); 
            showCard(newSpot);
        }
        window.closeCustomSpotModal();
    };

    state.mapInstance.on('contextmenu', function(e) {
        const lat = e.latlng.lat; const lng = e.latlng.lng;
        
        // 🌟 載入提示：藍色字體與旋轉圖示
        const tempPopup = L.popup({ closeButton: false, autoClose: false, offset: [0, -10] })
            .setLatLng(e.latlng)
            .setContent("<div style='padding:8px; font-weight:bold; color:var(--primary); font-size:14px;'><i class='fas fa-spinner fa-spin'></i> 獲取詳細地址中...</div>")
            .openOn(state.mapInstance);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW`)
        .then(res => res.json())
        .then(data => {
            let addr = "未知詳細地址"; 
            if(data && data.address) { 
                const a = data.address; 
                addr = (a.city || a.county || "") + (a.town || a.suburb || a.district || "") + (a.village || "") + (a.road || "") + (a.house_number ? a.house_number + "號" : ""); 
            }
            
            state.mapInstance.closePopup(tempPopup); 
            
            // 🌟 開啟專屬 Modal，取代 prompt
            setTimeout(() => { 
                tempCustomSpot = { lat, lng, addr };
                document.getElementById('custom-spot-addr').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${addr}`;
                document.getElementById('custom-spot-name').value = ""; // 清空上次輸入
                document.getElementById('custom-spot-modal').style.display = 'flex';
            }, 150);
        })
        .catch(() => { 
            state.mapInstance.closePopup(tempPopup); 
            setTimeout(() => { 
                tempCustomSpot = { lat, lng, addr: "無法連線獲取地址" };
                document.getElementById('custom-spot-addr').innerHTML = `<i class="fas fa-exclamation-triangle"></i> 無法連線獲取地址`;
                document.getElementById('custom-spot-name').value = ""; 
                document.getElementById('custom-spot-modal').style.display = 'flex';
            }, 150);
        });
    });

    window.openEditModal = (name) => { state.currentEditingSpotName = name; const s = state.savedCustomSpots.find(x => x.name === name); if(!s) return; document.getElementById('edit-name').value = s.name; document.getElementById('edit-highlights').value = s.highlights; document.getElementById('edit-history').value = s.history; document.getElementById('edit-image-preview').style.display = s.wikiImg ? "block" : "none"; document.getElementById('edit-image-preview').src = s.wikiImg || ""; document.getElementById('edit-modal-overlay').style.display = "flex"; };
    window.closeEditModal = () => { document.getElementById('edit-modal-overlay').style.display = "none"; };
    
    const fileInput = document.getElementById('edit-image');
    if(fileInput) { fileInput.addEventListener('change', function(e) { const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = event => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const scaleSize = 400 / img.width; canvas.width = 400; canvas.height = img.height * scaleSize; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); document.getElementById('edit-image-preview').src = canvas.toDataURL('image/jpeg', 0.7); document.getElementById('edit-image-preview').style.display = "block"; }; img.src = event.target.result; }; reader.readAsDataURL(file); }); }

    window.saveEditSpot = () => { const newName = document.getElementById('edit-name').value.trim(); if(!newName) return alert("名稱不能為空！"); const savedIdx = state.savedCustomSpots.findIndex(x => x.name === state.currentEditingSpotName); if(savedIdx === -1) return; const s = state.savedCustomSpots[savedIdx]; s.name = newName; s.highlights = document.getElementById('edit-highlights').value; s.history = document.getElementById('edit-history').value; s.wikiImg = document.getElementById('edit-image-preview').src; saveState.customSpots(); if(s.markerObj) state.cluster.removeLayer(s.markerObj); addMarkerToMap(s); window.closeEditModal(); showCard(s); };
    window.deleteCustomSpot = (name) => { if(!confirm(`確定要刪除「${name}」？無法復原喔！`)) return; const spotIndex = state.savedCustomSpots.findIndex(s => s.name === name); if (spotIndex > -1) { if(state.savedCustomSpots[spotIndex].markerObj) state.cluster.removeLayer(state.savedCustomSpots[spotIndex].markerObj); state.savedCustomSpots.splice(spotIndex, 1); saveState.customSpots(); } if (state.myFavs.includes(name)) { state.myFavs = state.myFavs.filter(fav => fav !== name); saveState.favs(); } closeCard(); alert('🗑️ 標記已刪除！'); };
}
