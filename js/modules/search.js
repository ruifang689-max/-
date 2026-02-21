// js/modules/search.js (v406)
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';

// 🌟 確保這個函式有被 export，且沒有語法錯誤
export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    if(searchInput) searchInput.value = name; 
    if(clearBtn) clearBtn.style.display = "block"; 
    
    // 檢查 window.closeSuggest 是否存在，避免報錯
    if (typeof window.closeSuggest === 'function') window.closeSuggest();
    
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
    
    window.clearSearchInput = () => {
        if(searchInput) { searchInput.value = ""; }
        if(clearBtn) clearBtn.style.display = "none";
        window.closeSuggest(); 
    };
    
// =========================================
// 🌟 預設搜尋推薦：渲染歷史紀錄與分類
// =========================================
window.renderDefaultSearch = () => {
    const c = document.getElementById("suggest-content");
    const sugBox = document.getElementById("suggest");
    if(!c || !sugBox) return;
    
    c.innerHTML = "";
    
    // 1. 渲染歷史紀錄
    if (state.searchHistory && state.searchHistory.length > 0) {
        c.innerHTML += `<div class="search-section-title">🕒 最近搜尋 <span class="clear-history-btn" onclick="clearHistory()">清除</span></div>`;
        state.searchHistory.forEach(h => {
            const div = document.createElement("div"); div.className = "list-item";
            div.innerHTML = `<span><i class="fas fa-history" style="color:#888; margin-right:5px;"></i> ${h}</span>`;
            div.onclick = () => { 
                document.getElementById("search").value = h; 
                if (typeof triggerSearch === 'function') triggerSearch(h); 
                sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); // 狀態驅動關閉
            };
            c.appendChild(div);
        });
    }
    
    // 2. 渲染快速分類
    c.innerHTML += `<div class="search-section-title">🏷️ 快速分類</div>`;
    // 抓取獨一無二的 tags 或給定預設分類
    const cats = ['美食', '自然', '歷史', '交通']; 
    const catBox = document.createElement("div");
    catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
    cats.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "chip"; btn.innerText = cat;
        btn.onclick = () => { 
            document.getElementById("search").value = cat; 
            window.filterSpots(cat, null); // 觸發過濾
            sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); // 狀態驅動關閉
        };
        catBox.appendChild(btn);
    });
    c.appendChild(catBox);
    
    // 🌟 狀態驅動：顯示建議框
    sugBox.classList.remove('u-hidden');
    sugBox.classList.add('u-block');
};

// 清除歷史紀錄
window.clearHistory = () => {
    state.searchHistory = [];
    if (typeof saveState !== 'undefined') saveState.history();
    window.renderDefaultSearch();
};

// =========================================
// 🌟 點擊地圖空白處，自動關閉搜尋建議框
// =========================================
document.addEventListener('click', (e) => {
    const sugBox = document.getElementById("suggest");
    const searchInput = document.getElementById("search");
    
    // 如果點擊的地方不是搜尋框，也不是建議框裡面的東西，就把它關掉
    if (sugBox && !sugBox.classList.contains('u-hidden')) {
        if (!sugBox.contains(e.target) && e.target !== searchInput) {
            sugBox.classList.remove('u-block');
            sugBox.classList.add('u-hidden');
        }
    }
});

    window.filterSpots = (category, element) => {
    if(element) { 
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); 
        element.classList.add('active'); 
    }
    if(state.cluster) state.cluster.clearLayers(); 
    
    // 🌟 防呆重點在這裡：加上 (s.tags || [])
    const filteredSpots = category === 'all' 
        ? spots.concat(state.savedCustomSpots || []) 
        // 🌟 防呆：確保 tags 存在，否則視為空陣列
        : spots.concat(state.savedCustomSpots || []).filter(s => (s.tags || []).includes(category)); 
        
    filteredSpots.forEach(s => {
        if (typeof window.addMarkerToMap === 'function' || typeof addMarkerToMap !== 'undefined') {
            addMarkerToMap(s);
        }
    }); 
    if (typeof window.closeCard === 'function') window.closeCard();
};
}
