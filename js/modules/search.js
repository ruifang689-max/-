// js/modules/search.js (v627) - Web Worker 效能版
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard } from './cards.js';

let debounceTimer = null;
let searchWorker = null;

// 🌟 初始化 Worker (只建立一次)
if (window.Worker) {
    searchWorker = new Worker('./js/workers/searchWorker.js?v=627');
}

// 🌟 觸發搜尋並顯示結果
export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    // 🌟 更新搜尋輸入框和清除按鈕狀態
    if(searchInput) searchInput.value = name; 
    if(clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } 
    
    // 🌟 關閉搜尋建議框
    if (window.rfApp.search && typeof window.rfApp.search.closeSuggest === 'function') {
        window.rfApp.search.closeSuggest();
    }
    
    // 🌟 在內建和自定義景點中尋找匹配的景點
    const s = spots.concat(state.savedCustomSpots || []).find(x => x.name === name); 
    if(s) { 
        state.mapInstance.flyTo([s.lat, s.lng], 16); 
        setTimeout(() => showCard(s), 800); 
    } 
}

// 🌟 初始化搜尋功能
export function initSearch() {
    const searchInput = document.getElementById("search"); 
    const sugBox = document.getElementById("suggest");
    const clearBtn = document.getElementById("search-clear-btn");
    const content = document.getElementById("suggest-content");
    const tplListItem = document.getElementById('tpl-list-item');

    // 🌟 關閉搜尋建議框
    window.rfApp.search.closeSuggest = () => { 
        if(sugBox) { sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); }
    };

    // 🌟 清除搜尋輸入框
    window.rfApp.search.clearSearchInput = () => {
        if(searchInput) searchInput.value = "";
        if(clearBtn) { clearBtn.classList.remove('u-block'); clearBtn.classList.add('u-hidden'); }
        window.rfApp.search.closeSuggest();
        if(typeof window.filterSpots === 'function') window.filterSpots('all', null);
    };

    // 🌟 預設搜尋建議內容
    window.rfApp.search.renderDefaultSearch = () => {
        if(!content || !sugBox || !tplListItem) return;
        content.innerHTML = ""; 
        
        const fragment = document.createDocumentFragment();
        
        // A. 歷史紀錄 (如果有歷史紀錄，先顯示歷史紀錄區塊)
        if (state.searchHistory && state.searchHistory.length > 0) {
            const title = document.createElement('div');
            title.className = "search-section-title";
            title.innerHTML = `🕒 最近搜尋 <span class="clear-history-btn" onclick="rfApp.search.clearHistory()">清除</span>`;
            fragment.appendChild(title);
            
            // 建立歷史紀錄項目
            state.searchHistory.forEach(h => {
                const node = tplListItem.content.cloneNode(true);
                node.querySelector('.list-item').setAttribute('data-name', h);
                node.querySelector('.item-icon').classList.add('fa-history');
                node.querySelector('.item-icon').style.color = '#888';
                node.querySelector('.item-text').textContent = h;
                fragment.appendChild(node);
            });
        }
        
        // B. 快速分類 (隨機推薦分類標題)
        const catTitle = document.createElement('div');
        catTitle.className = "search-section-title";
        catTitle.textContent = "🏷️ 快速分類";
        fragment.appendChild(catTitle);
        
        // 建立分類按鈕
        const catBox = document.createElement("div");
        catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
        const cats = ['美食', '自然', '歷史', '交通']; 
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
        
        // C. 隨機推薦 (從熱門分類中隨機選一個)
        const recCats = ['美食', '自然', '歷史']; 
        const randomCat = recCats[Math.floor(Math.random() * recCats.length)];
        const recTitle = document.createElement('div');
        recTitle.className = "search-section-title";
        recTitle.style.color = "var(--accent)";
        recTitle.textContent = `🎁 探索推薦：${randomCat}`;
        fragment.appendChild(recTitle);

        // 從內建和自定義景點中隨機挑選符合分類的項目
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
        // 一次性插入 DOM
        content.appendChild(fragment);
        sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
    };

    // 🌟 清除搜尋歷史
    window.rfApp.search.clearHistory = () => {
        state.searchHistory = [];
        if (typeof saveState !== 'undefined') saveState.history();
        window.rfApp.search.renderDefaultSearch();
    };

    // 🌟 綁定 Worker 接收訊息事件
    if (searchWorker) {
        searchWorker.onmessage = function(e) {
            const matches = e.data.result;
            
            if (matches && matches.length > 0) {
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
            } else { 
                window.rfApp.search.closeSuggest(); 
            }
        };
    }
    // 🌟 建議項目點擊事件 (事件委派)
    if (content) {
        content.addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (!item) return;
            // 🌟 點擊建議項目後的處理
            const spotName = item.getAttribute('data-name');
            if (spotName) {
                state.searchHistory = (state.searchHistory || []).filter(h => h !== spotName);
                state.searchHistory.unshift(spotName);
                if(state.searchHistory.length > 5) state.searchHistory.pop();
                if(typeof saveState !== 'undefined') saveState.history();
                
                triggerSearch(spotName);
            }
        });
    }

    // 🌟 輸入框監聽器
    if(searchInput) {
        searchInput.addEventListener('focus', () => {
            if(!searchInput.value.trim()) window.rfApp.search.renderDefaultSearch();
        });
        // 🌟 輸入事件監聽器（帶防抖）
        searchInput.addEventListener('input', function() {
            const k = this.value.trim().toLowerCase();
            // 顯示或隱藏清除按鈕
            if (clearBtn) {
                if (k) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
                else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); }
            }
            // 防抖處理
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(!k) { 
                    window.rfApp.search.renderDefaultSearch(); 
                    return; 
                }
                // 合併內建與自定義景點資料
                const allSpots = spots.concat(state.savedCustomSpots || []);
                
                if (searchWorker) {
                    // 發送給小幫手
                    searchWorker.postMessage({ action: 'search', keyword: k, spotsData: allSpots });
                } else {
                    // 備用方案 (舊手機)
                    const matches = allSpots.filter(s => 
                        (s.name || '').toLowerCase().includes(k) || 
                        (s.tags || []).some(t => t.toLowerCase().includes(k)) ||
                        (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
                    );
                    // 直接渲染結果
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
                        // 一次性插入 DOM
                        content.appendChild(fragment);
                        sugBox.classList.remove('u-hidden'); sugBox.classList.add('u-block');
                    } else { window.rfApp.search.closeSuggest(); }
                }
            }, 300);
        });
    }

    // 🌟 點擊外部關閉建議框
    document.addEventListener('click', (e) => {
        if (sugBox && !sugBox.classList.contains('u-hidden')) {
            if (!sugBox.contains(e.target) && e.target !== searchInput) window.rfApp.search.closeSuggest();
        }
    });

    // 🌟 將方法掛載到全局
    window.closeSuggest = window.rfApp.search.closeSuggest;
    window.clearSearchInput = window.rfApp.search.clearSearchInput;
    window.renderDefaultSearch = window.rfApp.search.renderDefaultSearch;
    window.clearHistory = window.rfApp.search.clearHistory;
    window.rfApp.search.triggerSearch = triggerSearch; 
}
