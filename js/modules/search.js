// js/modules/search.js (v619)
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard } from './cards.js';

let debounceTimer = null; // 用於搜尋防抖

// 🌟 核心搜尋觸發：地圖飛過去並打開卡片
export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    if(searchInput) searchInput.value = name; 
    if(clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } 
    
    if (window.rfApp.search && typeof window.rfApp.search.closeSuggest === 'function') {
        window.rfApp.search.closeSuggest();
    }
    
    const s = spots.concat(state.savedCustomSpots || []).find(x => x.name === name); 
    if(s) { 
        state.mapInstance.flyTo([s.lat, s.lng], 16); 
        setTimeout(() => showCard(s), 800); 
    } 
}

export function initSearch() {
    const searchInput = document.getElementById("search"); 
    const sugBox = document.getElementById("suggest");
    const clearBtn = document.getElementById("search-clear-btn");
    const content = document.getElementById("suggest-content");

    // 🌟 1. 定義 rfApp.search 命名空間下的方法
    window.rfApp.search.closeSuggest = () => { 
        if(sugBox) { sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); }
    };

    window.rfApp.search.clearSearchInput = () => {
        if(searchInput) searchInput.value = "";
        if(clearBtn) { clearBtn.classList.remove('u-block'); clearBtn.classList.add('u-hidden'); }
        window.rfApp.search.closeSuggest();
        // 如果有 filterSpots 功能也可在此呼叫
        if(typeof window.filterSpots === 'function') window.filterSpots('all', null);
    };

    window.rfApp.search.renderDefaultSearch = () => {
        if(!content || !sugBox) return;
        content.innerHTML = "";
        
        // A. 渲染歷史紀錄
        if (state.searchHistory && state.searchHistory.length > 0) {
            content.innerHTML += `<div class="search-section-title">🕒 最近搜尋 <span class="clear-history-btn" onclick="rfApp.search.clearHistory()">清除</span></div>`;
            state.searchHistory.forEach(h => {
                const div = document.createElement("div"); div.className = "list-item";
                div.innerHTML = `<span><i class="fas fa-history" style="color:#888; margin-right:5px;"></i> ${h}</span>`;
                div.onclick = () => triggerSearch(h);
                content.appendChild(div);
            });
        }
        
        // B. 渲染快速分類
        content.innerHTML += `<div class="search-section-title">🏷️ 快速分類</div>`;
        const cats = ['美食', '自然', '歷史', '交通']; 
        const catBox = document.createElement("div");
        catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
        cats.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = "chip"; btn.innerText = cat;
            btn.onclick = () => { 
                if(searchInput) searchInput.value = cat; 
                if(typeof window.filterSpots === 'function') window.filterSpots(cat, null); 
                window.rfApp.search.closeSuggest();
            };
            catBox.appendChild(btn);
        });
        content.appendChild(catBox);
        
        // C. 渲染隨機推薦
        const recCats = ['美食', '自然', '歷史']; 
        const randomCat = recCats[Math.floor(Math.random() * recCats.length)];
        content.innerHTML += `<div class="search-section-title" style="color: var(--accent);">🎁 探索推薦：${randomCat}</div>`;
        const matched = spots.concat(state.savedCustomSpots || []).filter(s => (s.tags || []).includes(randomCat));
        const shuffled = matched.sort(() => 0.5 - Math.random()).slice(0, 5);
        shuffled.forEach(s => {
            const div = document.createElement("div"); div.className = "list-item";
            div.innerHTML = `<span><i class="fas fa-star" style="color:var(--accent); margin-right:8px;"></i> ${s.name}</span><i class="fas fa-chevron-right" style="color:#ccc; font-size:12px;"></i>`;
            div.onclick = () => triggerSearch(s.name);
            content.appendChild(div);
        });
        
        sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
    };

    window.rfApp.search.clearHistory = () => {
        state.searchHistory = [];
        if (typeof saveState !== 'undefined') saveState.history();
        window.rfApp.search.renderDefaultSearch();
    };

    // 🌟 2. 綁定監聽器
    if(searchInput) {
        searchInput.addEventListener('focus', () => {
            if(!searchInput.value.trim()) window.rfApp.search.renderDefaultSearch();
        });

        searchInput.addEventListener('input', function() {
            const k = this.value.trim().toLowerCase();
            if (clearBtn) {
                if (k) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
                else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); }
            }

            // 防抖搜尋邏輯
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(!k) { window.rfApp.search.renderDefaultSearch(); return; }
                const matches = spots.concat(state.savedCustomSpots || []).filter(s => 
                    (s.name || '').toLowerCase().includes(k) || 
                    (s.tags || []).some(t => t.toLowerCase().includes(k)) ||
                    (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
                );

                if(matches.length > 0) {
                    content.innerHTML = "";
                    sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
                    matches.forEach(s => {
                        const div = document.createElement("div"); div.className = "list-item";
                        div.innerHTML = `<span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span>`;
                        div.onclick = () => {
                            state.searchHistory = (state.searchHistory || []).filter(h => h !== s.name);
                            state.searchHistory.unshift(s.name);
                            if(state.searchHistory.length > 5) state.searchHistory.pop();
                            if(typeof saveState !== 'undefined') saveState.history();
                            triggerSearch(s.name);
                        };
                        content.appendChild(div);
                    });
                } else { window.rfApp.search.closeSuggest(); }
            }, 300);
        });
    }

    // 點擊外部關閉
    document.addEventListener('click', (e) => {
        if (sugBox && !sugBox.classList.contains('u-hidden')) {
            if (!sugBox.contains(e.target) && e.target !== searchInput) window.rfApp.search.closeSuggest();
        }
    });

    // 🌟 3. 向下相容橋樑 (Legacy Bridge)
    window.closeSuggest = window.rfApp.search.closeSuggest;
    window.clearSearchInput = window.rfApp.search.clearSearchInput;
    window.renderDefaultSearch = window.rfApp.search.renderDefaultSearch;
    window.clearHistory = window.rfApp.search.clearHistory;
    window.rfApp.search.triggerSearch = triggerSearch; // 註冊到命名空間
}
