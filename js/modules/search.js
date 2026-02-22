// js/modules/search.js (v621)
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard } from './cards.js';

let debounceTimer = null;

// 🌟 核心搜尋觸發
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

    // 🌟 1. 定義命名空間方法
    window.rfApp.search.closeSuggest = () => { 
        if(sugBox) { sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); }
    };

    window.rfApp.search.clearSearchInput = () => {
        if(searchInput) searchInput.value = "";
        if(clearBtn) { clearBtn.classList.remove('u-block'); clearBtn.classList.add('u-hidden'); }
        window.rfApp.search.closeSuggest();
        if(typeof window.filterSpots === 'function') window.filterSpots('all', null);
    };

    // 🌟 2. 渲染邏輯：完全捨棄 createElement，改用純 HTML 字串與 data-name 屬性
    window.rfApp.search.renderDefaultSearch = () => {
        if(!content || !sugBox) return;
        
        // 使用字串拼接，速度比 DOM 操作快數倍
        let htmlString = "";
        
        // A. 歷史紀錄
        if (state.searchHistory && state.searchHistory.length > 0) {
            htmlString += `<div class="search-section-title">🕒 最近搜尋 <span class="clear-history-btn" onclick="rfApp.search.clearHistory()">清除</span></div>`;
            state.searchHistory.forEach(h => {
                // 加上 data-name 屬性供事件委託辨識
                htmlString += `<div class="list-item" data-name="${h}"><span><i class="fas fa-history" style="color:#888; margin-right:5px;"></i> ${h}</span></div>`;
            });
        }
        
        // B. 快速分類 (維持 Button onclick，因數量極少且邏輯單純)
        htmlString += `<div class="search-section-title">🏷️ 快速分類</div>`;
        htmlString += `<div style="display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;">`;
        const cats = ['美食', '自然', '歷史', '交通']; 
        cats.forEach(cat => {
            htmlString += `<button class="chip" onclick="if(document.getElementById('search')){document.getElementById('search').value='${cat}'}; if(typeof window.filterSpots==='function') window.filterSpots('${cat}', null); window.rfApp.search.closeSuggest();">${cat}</button>`;
        });
        htmlString += `</div>`;
        
        // C. 隨機推薦
        const recCats = ['美食', '自然', '歷史']; 
        const randomCat = recCats[Math.floor(Math.random() * recCats.length)];
        htmlString += `<div class="search-section-title" style="color: var(--accent);">🎁 探索推薦：${randomCat}</div>`;
        
        const matched = spots.concat(state.savedCustomSpots || []).filter(s => (s.tags || []).includes(randomCat));
        const shuffled = matched.sort(() => 0.5 - Math.random()).slice(0, 5);
        shuffled.forEach(s => {
            // 加上 data-name 屬性
            htmlString += `<div class="list-item" data-name="${s.name}"><span><i class="fas fa-star" style="color:var(--accent); margin-right:8px;"></i> ${s.name}</span><i class="fas fa-chevron-right" style="color:#ccc; font-size:12px;"></i></div>`;
        });
        
        // 一次性寫入 DOM
        content.innerHTML = htmlString;
        sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
    };

    window.rfApp.search.clearHistory = () => {
        state.searchHistory = [];
        if (typeof saveState !== 'undefined') saveState.history();
        window.rfApp.search.renderDefaultSearch();
    };

    // 🌟 3. 極限效能：事件委託 (Event Delegation) 綁定在父元素
    if (content) {
        content.addEventListener('click', (e) => {
            // 尋找被點擊元素最近的 .list-item 祖先
            const item = e.target.closest('.list-item');
            if (!item) return; // 如果點到的不是清單項目，就略過

            // 從自訂屬性取得景點名稱
            const spotName = item.getAttribute('data-name');
            if (spotName) {
                // 儲存搜尋歷史
                state.searchHistory = (state.searchHistory || []).filter(h => h !== spotName);
                state.searchHistory.unshift(spotName);
                if(state.searchHistory.length > 5) state.searchHistory.pop();
                if(typeof saveState !== 'undefined') saveState.history();
                
                // 觸發搜尋
                triggerSearch(spotName);
            }
        });
    }

    // 🌟 4. 輸入框監聽器
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

            // 防抖
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(!k) { window.rfApp.search.renderDefaultSearch(); return; }
                const matches = spots.concat(state.savedCustomSpots || []).filter(s => 
                    (s.name || '').toLowerCase().includes(k) || 
                    (s.tags || []).some(t => t.toLowerCase().includes(k)) ||
                    (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
                );

                if(matches.length > 0) {
                    let htmlString = "";
                    matches.forEach(s => {
                        // 🌟 搜尋結果也改用字串拼接與 data-name
                        htmlString += `<div class="list-item" data-name="${s.name}"><span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span></div>`;
                    });
                    content.innerHTML = htmlString;
                    sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
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

    // 🌟 5. 向下相容橋樑 (Legacy Bridge)
    window.closeSuggest = window.rfApp.search.closeSuggest;
    window.clearSearchInput = window.rfApp.search.clearSearchInput;
    window.renderDefaultSearch = window.rfApp.search.renderDefaultSearch;
    window.clearHistory = window.rfApp.search.clearHistory;
    window.rfApp.search.triggerSearch = triggerSearch; 
}
