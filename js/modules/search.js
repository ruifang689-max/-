// js/modules/search.js
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';

export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    if(searchInput) searchInput.value = name; 
    if(clearBtn) clearBtn.style.display = "block"; // 有字就顯示清空鈕
    
    window.closeSuggest(); 
    
    const s = spots.concat(state.savedCustomSpots).find(x => x.name === name); 
    if(s) { 
        state.mapInstance.flyTo([s.lat, s.lng], 16); 
        setTimeout(() => showCard(s), 800); 
    } 
}

export function initSearch() {
    const searchInput = document.getElementById("search"); 
    const sugBox = document.getElementById("suggest");
    const clearBtn = document.getElementById("search-clear-btn");
    
    window.closeSuggest = () => { if(sugBox) sugBox.style.display = "none"; };
    
    // 🌟 新增：清空搜尋欄與收起推薦
    window.clearSearchInput = () => {
        if(searchInput) { searchInput.value = ""; }
        if(clearBtn) clearBtn.style.display = "none";
        window.closeSuggest(); 
    };
    
    window.renderDefaultSearch = () => { 
        const c = document.getElementById("suggest-content"); c.innerHTML = ""; 
        if(state.searchHistory.length > 0) { 
            c.innerHTML += `<div class="search-section-title"><span>🕒 歷史搜尋</span> <span class="clear-history-btn" onclick="clearHistory()"><i class="fas fa-trash"></i> 清除</span></div>`; 
            state.searchHistory.forEach(h => { c.innerHTML += `<div class="list-item" onclick="triggerSearch('${h}')"><span><i class="fas fa-history" style="color:#aaa;"></i> ${h}</span></div>`; }); 
        } 
        c.innerHTML += `<div class="search-section-title">⭐ 推薦景點</div>`; 
        ["九份老街", "猴硐貓村", "水湳洞陰陽海"].forEach(r => { c.innerHTML += `<div class="list-item" onclick="triggerSearch('${r}')"><span><i class="fas fa-fire" style="color:#e74c3c;"></i> ${r}</span></div>`; }); 
        if(sugBox) sugBox.style.display = "block"; 
    };

    window.clearHistory = () => { state.searchHistory = []; saveState.history(); window.renderDefaultSearch(); };
    window.triggerSearch = triggerSearch;

    // 點擊搜尋框
    searchInput.addEventListener('focus', () => { 
        if(!searchInput.value.trim()) {
            window.renderDefaultSearch(); 
        } else if (sugBox && sugBox.style.display === "none") {
            searchInput.dispatchEvent(new Event('input')); // 再次觸發過濾
        }
    });

    // 監聽輸入字元，動態顯示/隱藏Ｘ按鈕
    searchInput.addEventListener('input', function() { 
        const k = this.value.trim(); 
        if(clearBtn) clearBtn.style.display = k ? "block" : "none"; // 🌟 有字才顯示
        
        const c = document.getElementById("suggest-content"); 
        if(!k) { window.renderDefaultSearch(); return; } 
        
        c.innerHTML = ""; 
        const matches = spots.concat(state.savedCustomSpots).filter(s => s.name.includes(k) || s.tags.some(t => t.includes(k)) || (s.keywords && s.keywords.some(kw => kw.includes(k)))); 
        
        if(matches.length > 0) { 
            if(sugBox) sugBox.style.display = "block"; 
            matches.forEach(s => { 
                const div = document.createElement("div"); div.className = "list-item"; 
                div.innerHTML = `<span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span>`; 
                div.onclick = () => { 
                    state.searchHistory = state.searchHistory.filter(h => h !== s.name); state.searchHistory.unshift(s.name); if(state.searchHistory.length > 5) state.searchHistory.pop(); saveState.history();
                    triggerSearch(s.name); 
                }; c.appendChild(div); 
            }); 
        } else { 
            if(sugBox) sugBox.style.display = "none"; 
        } 
    });

    // 🌟 新增：點擊地圖他處時，自動關閉搜尋推薦
    document.addEventListener('click', (e) => {
        const topUi = document.getElementById('top-ui');
        // 如果點擊的地方不在頂部 UI 內，而且推薦框是打開的，就把它關掉
        if (topUi && !topUi.contains(e.target) && sugBox && sugBox.style.display === 'block') {
            window.closeSuggest();
        }
    });

    window.filterSpots = (category, element) => { 
        if(element) { document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); element.classList.add('active'); } 
        state.cluster.clearLayers(); 
        const filteredSpots = category === 'all' ? spots.concat(state.savedCustomSpots) : spots.concat(state.savedCustomSpots).filter(s => s.tags.includes(category)); 
        filteredSpots.forEach(addMarkerToMap); closeCard(); 
    };
}
