// js/modules/search.js (v624)
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard } from './cards.js';

let debounceTimer = null;

// 🌟 核心搜尋觸發
export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    // 🌟 直接將搜尋名稱填入輸入框，並顯示清除按鈕
    if(searchInput) searchInput.value = name; 
    if(clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } 
    
    // 🌟 關閉建議框
    if (window.rfApp.search && typeof window.rfApp.search.closeSuggest === 'function') {
        window.rfApp.search.closeSuggest();
    }
    
    // 🌟 嘗試找到對應的景點並飛行過去
    const s = spots.concat(state.savedCustomSpots || []).find(x => x.name === name); 
    if(s) { 
        state.mapInstance.flyTo([s.lat, s.lng], 16); 
        setTimeout(() => showCard(s), 800); 
    } 
}

// 🌟 搜尋模組初始化
export function initSearch() {
    const searchInput = document.getElementById("search"); 
    const sugBox = document.getElementById("suggest");
    const clearBtn = document.getElementById("search-clear-btn");
    const content = document.getElementById("suggest-content");
    
    // 🌟 取得 HTML 中定義的 Template
    const tplListItem = document.getElementById('tpl-list-item');

    // 🌟 定義命名空間方法
    window.rfApp.search.closeSuggest = () => { 
        if(sugBox) { sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); }
    };

    // 🌟 清除搜尋輸入框並重置狀態
    window.rfApp.search.clearSearchInput = () => {
        if(searchInput) searchInput.value = "";
        if(clearBtn) { clearBtn.classList.remove('u-block'); clearBtn.classList.add('u-hidden'); }
        window.rfApp.search.closeSuggest();
        if(typeof window.filterSpots === 'function') window.filterSpots('all', null);
    };

    // 🌟 核心渲染：使用 DocumentFragment 結合 Template
    window.rfApp.search.renderDefaultSearch = () => {
        if(!content || !sugBox || !tplListItem) return;
        content.innerHTML = ""; 
        
        // 🌟 使用 DocumentFragment 來批次處理 DOM 操作，提升效能
        const fragment = document.createDocumentFragment();
        
        // A. 歷史紀錄 (只有在有歷史紀錄的情況下才顯示這個區塊)
        if (state.searchHistory && state.searchHistory.length > 0) {
            const title = document.createElement('div');
            title.className = "search-section-title";
            title.innerHTML = `🕒 最近搜尋 <span class="clear-history-btn" onclick="rfApp.search.clearHistory()">清除</span>`;
            fragment.appendChild(title);
            
            // 依序建立歷史紀錄項目
            state.searchHistory.forEach(h => {
                const node = tplListItem.content.cloneNode(true);
                node.querySelector('.list-item').setAttribute('data-name', h);
                node.querySelector('.item-icon').classList.add('fa-history');
                node.querySelector('.item-icon').style.color = '#888';
                node.querySelector('.item-text').textContent = h;
                fragment.appendChild(node);
            });
        }
        
        // B. 快速分類 (因為只有外觀不同的按鈕，保留 createElement)
        const catTitle = document.createElement('div');
        catTitle.className = "search-section-title";
        catTitle.textContent = "🏷️ 快速分類";
        fragment.appendChild(catTitle);
        
            // 使用 flexbox 來排列分類按鈕，並且允許換行
        const catBox = document.createElement("div");
        catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
        const cats = ['美食', '自然', '歷史', '交通']; 
            // 依序建立分類按鈕
        cats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "chip"; btn.textContent = cat;
            btn.onclick = () => {
                if(searchInput) searchInput.value = cat; 
                if(typeof window.filterSpots === 'function') window.filterSpots(cat, null); 
                window.rfApp.search.closeSuggest();
            };
            catBox.appendChild(btn);
        });
        fragment.appendChild(catBox);
        
        // C. 隨機推薦
        const recCats = ['美食', '自然', '歷史']; 
        const randomCat = recCats[Math.floor(Math.random() * recCats.length)];
        const recTitle = document.createElement('div');
        recTitle.className = "search-section-title";
        recTitle.style.color = "var(--accent)";
        recTitle.textContent = `🎁 探索推薦：${randomCat}`;
        fragment.appendChild(recTitle);
        
        // 從景點資料中隨機挑選符合推薦分類的項目，並且打亂順序後取前5個
        const matched = spots.concat(state.savedCustomSpots || []).filter(s => (s.tags || []).includes(randomCat));
        const shuffled = matched.sort(() => 0.5 - Math.random()).slice(0, 5);
        shuffled.forEach(s => {
            const node = tplListItem.content.cloneNode(true);
            node.querySelector('.list-item').setAttribute('data-name', s.name);
            node.querySelector('.item-icon').classList.add('fa-star');
            node.querySelector('.item-icon').style.color = 'var(--accent)';
            node.querySelector('.item-text').textContent = s.name;
            node.querySelector('.item-arrow').classList.remove('u-hidden');
            fragment.appendChild(node);
        });
        
        content.appendChild(fragment);
        sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
    };

    // 🌟 清除搜尋歷史紀錄
    window.rfApp.search.clearHistory = () => {
        state.searchHistory = [];
        if (typeof saveState !== 'undefined') saveState.history();
        window.rfApp.search.renderDefaultSearch();
    };

    // 🌟 事件委託 (Event Delegation)
    if (content) {
        content.addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (!item) return;

            const spotName = item.getAttribute('data-name');
            if (spotName) {
                // 儲存搜尋歷史（最新的在前，最多保留5筆）
                state.searchHistory = (state.searchHistory || []).filter(h => h !== spotName);
                state.searchHistory.unshift(spotName);
                if(state.searchHistory.length > 5) state.searchHistory.pop();
                if(typeof saveState !== 'undefined') saveState.history();
                
                // 觸發搜尋行為
                triggerSearch(spotName);
            }
        });
    }

    // 🌟 4. 輸入框監聽器
    if(searchInput) {
        searchInput.addEventListener('focus', () => {
            if(!searchInput.value.trim()) window.rfApp.search.renderDefaultSearch();
        });

        // 🌟 使用防抖機制來優化搜尋體驗
        searchInput.addEventListener('input', function() {
            const k = this.value.trim().toLowerCase();
            if (clearBtn) {
                if (k) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
                else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); }
            }

            // 防抖動作：等待使用者停止輸入 300ms 後再執行搜尋
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(!k) { window.rfApp.search.renderDefaultSearch(); return; }
                const matches = spots.concat(state.savedCustomSpots || []).filter(s => 
                    (s.name || '').toLowerCase().includes(k) || 
                    (s.tags || []).some(t => t.toLowerCase().includes(k)) ||
                    (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
                );
                
                // 🌟 使用 Template 和 DocumentFragment 來渲染搜尋結果，提升效能
                if(matches.length > 0) {
                    content.innerHTML = "";
                    const fragment = document.createDocumentFragment();
                    matches.forEach(s => {
                        const node = tplListItem.content.cloneNode(true);
                        node.querySelector('.list-item').setAttribute('data-name', s.name);
                        node.querySelector('.item-icon').classList.add('fa-map-marker-alt');
                        node.querySelector('.item-icon').style.color = 'var(--primary)';
                        node.querySelector('.item-text').textContent = s.name;
                        fragment.appendChild(node);
                    });
                    content.appendChild(fragment);
                    sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
                } else { window.rfApp.search.closeSuggest(); }
            }, 300);
        });
    }

    // 點擊外部關閉建議框
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
