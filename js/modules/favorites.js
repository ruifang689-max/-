// js/modules/favorites.js (v624) - Template Clone 終極版
import { state, saveState } from '../core/store.js';

export function initFavorites() {
    
    const favPanel = document.getElementById("fav-list-panel");
    const tplListItem = document.getElementById('tpl-list-item');
    const tplFavManageItem = document.getElementById('tpl-fav-manage-item');

    // 1. 面板事件委託
    if (favPanel) {
        favPanel.addEventListener('click', (e) => {
            // 點擊收藏項目
            const item = e.target.closest('.list-item');
            if (item) {
                const name = item.getAttribute('data-name');
                if (name && window.rfApp && window.rfApp.search && typeof window.rfApp.search.triggerSearch === 'function') {
                    window.rfApp.search.triggerSearch(name);
                    favPanel.classList.remove('u-block'); favPanel.classList.add('u-hidden');
                }
                return;
            }

            // 點擊管理按鈕
            const manageBtn = e.target.closest('.manage-fav-btn');
            if (manageBtn) {
                favPanel.classList.remove('u-block'); favPanel.classList.add('u-hidden');
                window.rfApp.fav.openFavManage();
            }
        });
    }

    // 2. 管理視窗事件委託
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

    // 切換當前景點收藏狀態
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
    
    // 切換收藏列表顯示
    window.rfApp.fav.toggleFavList = () => { 
        if(!favPanel || !tplListItem) return; 
        if(favPanel.classList.contains('u-block')) { 
            favPanel.classList.remove('u-block'); favPanel.classList.add('u-hidden'); 
        } else { 
            favPanel.innerHTML = "";
            const fragment = document.createDocumentFragment();

            if(state.myFavs.length === 0) { 
                const emptyMsg = document.createElement('div');
                emptyMsg.style.cssText = "padding:15px; text-align:center; color:#888; font-size:13px;";
                emptyMsg.innerHTML = "尚無收藏景點<br>點擊卡片愛心加入！";
                fragment.appendChild(emptyMsg);
            } else { 
                state.myFavs.forEach(name => { 
                    const node = tplListItem.content.cloneNode(true);
                    node.querySelector('.list-item').setAttribute('data-name', name);
                    node.querySelector('.item-icon').classList.add('fa-heart');
                    node.querySelector('.item-icon').style.color = 'var(--danger)';
                    node.querySelector('.item-text').textContent = name;
                    fragment.appendChild(node);
                }); 
            } 
            
            const manageBtn = document.createElement('div');
            manageBtn.className = "manage-fav-btn";
            manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);";
            manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾";
            fragment.appendChild(manageBtn);

            favPanel.appendChild(fragment);
            favPanel.classList.remove('u-hidden'); favPanel.classList.add('u-block'); 
        } 
    };
    
    // 開啟管理視窗
    window.rfApp.fav.openFavManage = () => { 
        const m = document.getElementById('fav-manage-modal'); 
        if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); renderFavManageList(); } 
    };
    
    // 關閉管理視窗
    window.rfApp.fav.closeFavManage = () => { 
        const m = document.getElementById('fav-manage-modal'); 
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } 
    };
    
    // 渲染管理列表
    function renderFavManageList() { 
        const listEl = document.getElementById('fav-manage-list'); 
        if(!listEl || !tplFavManageItem) return; 
        
        listEl.innerHTML = "";
        
        if (state.myFavs.length === 0) { 
            listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; 
            return; 
        } 
        
        const fragment = document.createDocumentFragment();

        state.myFavs.forEach((name, idx) => { 
            const node = tplFavManageItem.content.cloneNode(true);
            node.querySelector('.fav-name').textContent = name;
            
            // 設定按鈕屬性
            const btnUp = node.querySelector('.btn-up');
            const btnDown = node.querySelector('.btn-down');
            const btnRemove = node.querySelector('.btn-remove');

            btnUp.setAttribute('data-index', idx);
            if(idx === 0) btnUp.disabled = true;

            btnDown.setAttribute('data-index', idx);
            if(idx === state.myFavs.length - 1) btnDown.disabled = true;

            btnRemove.setAttribute('data-name', name);

            fragment.appendChild(node);
        }); 
        
        listEl.appendChild(fragment);
    }
    
    // 移動收藏項目，dir: -1 上移, 1 下移
    window.rfApp.fav.moveFav = (idx, dir) => { 
        if (idx + dir < 0 || idx + dir >= state.myFavs.length) return; 
        const temp = state.myFavs[idx]; state.myFavs[idx] = state.myFavs[idx + dir]; state.myFavs[idx + dir] = temp; 
        if (typeof saveState !== 'undefined') saveState.favs(); 
        renderFavManageList(); 
    };
    
    // 這裡的 name 是為了確保即使有重複的景點名稱也能正確刪除（假設不會有重複名稱的情況）
    window.rfApp.fav.removeFavManage = (name) => { 
        state.myFavs = state.myFavs.filter(fav => fav !== name); 
        if (typeof saveState !== 'undefined') saveState.favs(); 
        renderFavManageList(); 
        if (state.targetSpot && state.targetSpot.name === name) {
            const icon = document.getElementById("card-fav-icon");
            if(icon) icon.className = "fas fa-heart";
        }
    };

    // 3. 對外暴露方法
    // 🌟 3. 向下相容橋樑 (Legacy Bridge)
    window.toggleCurrentFav = window.rfApp.fav.toggleCurrentFav;
    window.toggleFavList = window.rfApp.fav.toggleFavList;
    window.openFavManage = window.rfApp.fav.openFavManage;
    window.closeFavManage = window.rfApp.fav.closeFavManage;
    window.moveFav = window.rfApp.fav.moveFav;
    window.removeFavManage = window.rfApp.fav.removeFavManage;
}
