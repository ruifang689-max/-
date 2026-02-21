import { state, saveState } from '../core/store.js';
import { triggerSearch } from './search.js';

export function initFavorites() {
    window.toggleCurrentFav = () => { 
        if(!state.targetSpot) return; 
        const idx = state.myFavs.indexOf(state.targetSpot.name); 
        if(idx === -1) state.myFavs.push(state.targetSpot.name); 
        else state.myFavs.splice(idx, 1); 
        saveState.favs(); 
        document.getElementById("card-fav-icon").className = state.myFavs.includes(state.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; 
    };
    
    window.toggleFavList = () => { 
        const p = document.getElementById("fav-list-panel"); 
        if(!p) return; 
        if(p.classList.contains('u-block')) { 
            p.classList.remove('u-block'); p.classList.add('u-hidden'); 
        } else { 
            p.innerHTML = ""; 
            if(state.myFavs.length === 0) { 
                p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; 
            } else { 
                state.myFavs.forEach(name => { 
                    const div = document.createElement("div"); div.className = "list-item"; 
                    div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; 
                    div.onclick = () => { triggerSearch(name); p.classList.remove('u-block'); p.classList.add('u-hidden'); }; 
                    p.appendChild(div); 
                }); 
            } 
            const manageBtn = document.createElement('div'); 
            manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);"; 
            manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾"; 
            manageBtn.onclick = () => { p.classList.remove('u-block'); p.classList.add('u-hidden'); window.openFavManage(); }; 
            p.appendChild(manageBtn); 
            p.classList.remove('u-hidden'); p.classList.add('u-block'); 
        } 
    };
    
    window.openFavManage = () => { const m = document.getElementById('fav-manage-modal'); if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); renderFavManageList(); } };
    window.closeFavManage = () => { const m = document.getElementById('fav-manage-modal'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };
    
    function renderFavManageList() { 
        const listEl = document.getElementById('fav-manage-list'); 
        if(!listEl) return; listEl.innerHTML = ''; 
        if (state.myFavs.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; return; } 
        state.myFavs.forEach((name, idx) => { 
            const item = document.createElement('div'); 
            item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px;"; 
            item.innerHTML = `<span style="font-weight:bold; color:var(--text-main); font-size:14px;">${name}</span> 
            <div style="display:flex; gap:6px;"> 
                <button onclick="moveFav(${idx}, -1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button> 
                <button onclick="moveFav(${idx}, 1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===state.myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button> 
                <button onclick="removeFavManage('${name}')" style="padding:6px 10px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button> 
            </div>`; 
            listEl.appendChild(item); 
        }); 
    }
    
    window.moveFav = (idx, dir) => { 
        if (idx + dir < 0 || idx + dir >= state.myFavs.length) return; 
        const temp = state.myFavs[idx]; state.myFavs[idx] = state.myFavs[idx + dir]; state.myFavs[idx + dir] = temp; 
        saveState.favs(); renderFavManageList(); 
    };
    
    window.removeFavManage = (name) => { 
        state.myFavs = state.myFavs.filter(fav => fav !== name); 
        saveState.favs(); renderFavManageList(); 
        if (state.targetSpot && state.targetSpot.name === name) {
            const icon = document.getElementById("card-fav-icon");
            if(icon) icon.className = "fas fa-heart";
        }
    };
}
