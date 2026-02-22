// js/modules/favorites.js (v622)
import { state, saveState } from '../core/store.js';

export function initFavorites() {
    
    // 🌟 1. 事件委託：初始化時只綁定一次監聽器！
    const favPanel = document.getElementById("fav-list-panel");
    if (favPanel) {
        favPanel.addEventListener('click', (e) => {
            // 處理點擊收藏景點
            const item = e.target.closest('.list-item');
            if (item) {
                const name = item.getAttribute('data-name');
                if (name && typeof window.rfApp.search.triggerSearch === 'function') {
                    window.rfApp.search.triggerSearch(name);
                    favPanel.classList.remove('u-block'); favPanel.classList.add('u-hidden');
                }
                return;
            }

            // 處理點擊管理按鈕
            const manageBtn = e.target.closest('.manage-fav-btn');
            if (manageBtn) {
                favPanel.classList.remove('u-block'); favPanel.classList.add('u-hidden');
                window.rfApp.fav.openFavManage();
            }
        });
    }

    const manageList = document.getElementById('fav-manage-list');
    if (manageList) {
        manageList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const index = parseInt(btn.getAttribute('data-index'));
            const name = btn.getAttribute('data-name');

            if (action === 'up') window.rfApp.fav.moveFav(index, -1);
            else if (action === 'down') window.rfApp.fav.moveFav(index, 1);
            else if (action === 'remove') window.rfApp.fav.removeFavManage(name);
        });
    }

    // 🌟 2. 定義 rfApp.fav 命名空間方法
    window.rfApp.fav.toggleCurrentFav = () => { 
        if(!state.targetSpot) return; 
        const idx = state.myFavs.indexOf(state.targetSpot.name); 
        if(idx === -1) state.myFavs.push(state.targetSpot.name); 
        else state.myFavs.splice(idx, 1); 
        
        if (typeof saveState !== 'undefined') saveState.favs(); 
        
        const favIcon = document.getElementById("card-fav-icon");
        if(favIcon) {
            favIcon.className = state.myFavs.includes(state.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; 
        }
    };
    
    window.rfApp.fav.toggleFavList = () => { 
        if(!favPanel) return; 
        if(favPanel.classList.contains('u-block')) { 
            favPanel.classList.remove('u-block'); favPanel.classList.add('u-hidden'); 
        } else { 
            // 🌟 效能優化：字串拼接渲染
            let htmlString = "";
            if(state.myFavs.length === 0) { 
                htmlString = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; 
            } else { 
                state.myFavs.forEach(name => { 
                    htmlString += `<div class="list-item" data-name="${name}"><span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span></div>`; 
                }); 
            } 
            htmlString += `<div class="manage-fav-btn" style="padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);"><i class='fas fa-cog'></i> 管理收藏夾</div>`; 
            
            favPanel.innerHTML = htmlString;
            favPanel.classList.remove('u-hidden'); favPanel.classList.add('u-block'); 
        } 
    };
    
    window.rfApp.fav.openFavManage = () => { 
        const m = document.getElementById('fav-manage-modal'); 
        if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); renderFavManageList(); } 
    };
    
    window.rfApp.fav.closeFavManage = () => { 
        const m = document.getElementById('fav-manage-modal'); 
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } 
    };
    
    function renderFavManageList() { 
        const listEl = document.getElementById('fav-manage-list'); 
        if(!listEl) return; 
        
        // 🌟 效能優化：字串拼接渲染管理清單
        if (state.myFavs.length === 0) { 
            listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; 
            return; 
        } 
        
        let htmlString = "";
        state.myFavs.forEach((name, idx) => { 
            // 如果沒有在 CSS 定義 .fav-manage-item 和 .fav-actions，可以用 inline style (為了無痛替換先保留)
            htmlString += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px;">
                <span style="font-weight:bold; color:var(--text-main); font-size:14px;">${name}</span>
                <div style="display:flex; gap:6px;">
                    <button data-action="up" data-index="${idx}" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button>
                    <button data-action="down" data-index="${idx}" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===state.myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button>
                    <button data-action="remove" data-name="${name}" style="padding:6px 10px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }); 
        listEl.innerHTML = htmlString;
    }
    
    window.rfApp.fav.moveFav = (idx, dir) => { 
        if (idx + dir < 0 || idx + dir >= state.myFavs.length) return; 
        const temp = state.myFavs[idx]; state.myFavs[idx] = state.myFavs[idx + dir]; state.myFavs[idx + dir] = temp; 
        if (typeof saveState !== 'undefined') saveState.favs(); 
        renderFavManageList(); 
    };
    
    window.rfApp.fav.removeFavManage = (name) => { 
        state.myFavs = state.myFavs.filter(fav => fav !== name); 
        if (typeof saveState !== 'undefined') saveState.favs(); 
        renderFavManageList(); 
        if (state.targetSpot && state.targetSpot.name === name) {
            const icon = document.getElementById("card-fav-icon");
            if(icon) icon.className = "fas fa-heart";
        }
    };

    // 🌟 3. 向下相容橋樑 (Legacy Bridge)
    window.toggleCurrentFav = window.rfApp.fav.toggleCurrentFav;
    window.toggleFavList = window.rfApp.fav.toggleFavList;
    window.openFavManage = window.rfApp.fav.openFavManage;
    window.closeFavManage = window.rfApp.fav.closeFavManage;
    window.moveFav = window.rfApp.fav.moveFav;
    window.removeFavManage = window.rfApp.fav.removeFavManage;
}
