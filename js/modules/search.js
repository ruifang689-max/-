// js/modules/search.js (v642) - 情境感知與點擊修復完美融合版
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard } from './cards.js';
import { getContextualData } from './contextEngine.js?v=631'; // 🌟 引入情境大腦

let debounceTimer = null;
let searchWorker = null;

if (window.Worker) {
    searchWorker = new Worker('./js/workers/searchWorker.js?v=631');
}

export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    if(searchInput) searchInput.value = name; 
    if(clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } 
    if (window.rfApp.search && typeof window.rfApp.search.closeSuggest === 'function') { window.rfApp.search.closeSuggest(); }
    
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
    const tplListItem = document.getElementById('tpl-list-item');

    // 🌟 初始化時，根據時間動態更改輸入框的 Placeholder
    if (searchInput) {
        const ctx = getContextualData();
        searchInput.placeholder = `${ctx.timeContext.greeting} 試試「${ctx.seasonContext.keywords[0]}」`;
    }

    window.rfApp.search.closeSuggest = () => { 
        if(sugBox) { sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); }
    };

    window.rfApp.search.clearSearchInput = () => {
        if(searchInput) {
            searchInput.value = "";
            // 清除時恢復情境提示
            const ctx = getContextualData();
            searchInput.placeholder = `${ctx.timeContext.greeting} 試試「${ctx.seasonContext.keywords[0]}」`;
        }
        if(clearBtn) { clearBtn.classList.remove('u-block'); clearBtn.classList.add('u-hidden'); }
        window.rfApp.search.closeSuggest();
        if(typeof window.filterSpots === 'function') window.filterSpots('all', null);
    };

    window.rfApp.search.renderDefaultSearch = () => {
        if(!content || !sugBox || !tplListItem) return;
        content.innerHTML = ""; 
        const fragment = document.createDocumentFragment();
        
        // A. 歷史紀錄
        if (state.searchHistory && state.searchHistory.length > 0) {
            const title = document.createElement('div');
            title.className = "search-section-title";
            title.innerHTML = `🕒 最近搜尋 <span class="clear-history-btn" onclick="rfApp.search.clearHistory()">清除</span>`;
            fragment.appendChild(title);
            
            state.searchHistory.forEach(h => {
                const node = tplListItem.content.cloneNode(true);
                node.querySelector('.list-item').setAttribute('data-name', h);
                node.querySelector('.item-icon').classList.add('fa-history');
                node.querySelector('.item-icon').style.color = '#888';
                node.querySelector('.item-text').textContent = h;
                fragment.appendChild(node);
            });
        }
        
        // B. 快速分類
        const catTitle = document.createElement('div');
        catTitle.className = "search-section-title";
        catTitle.textContent = "🏷️ 快速分類";
        fragment.appendChild(catTitle);
        
        const catBox = document.createElement("div");
        catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
        const cats = ['美食', '自然', '歷史', '交通']; 
        cats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "chip"; btn.textContent = cat;
            
            // 🌟 修復關鍵：加上參數 e，並呼叫 e.stopPropagation()
            btn.onclick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡，完美解決無法關閉的 Bug
                if(searchInput) searchInput.value = cat; 
                if(typeof window.filterSpots === 'function') window.filterSpots(cat, null); 
                window.rfApp.search.closeSuggest();
            };
            catBox.appendChild(btn);
        });
        fragment.appendChild(catBox);
        
        // 🌟 C. 情境探索推薦
        const ctx = getContextualData();
        const targetTags = [ctx.timeContext.suggestTag, ...ctx.seasonContext.keywords];
        
        const recTitle = document.createElement('div');
        recTitle.className = "search-section-title";
        recTitle.style.color = "var(--accent)";
        recTitle.innerHTML = `🎁 探索推薦：${ctx.seasonContext.season}的${ctx.timeContext.suggestTag}`;
        fragment.appendChild(recTitle);
        
        const allSpots = spots.concat(state.savedCustomSpots || []);
        const matched = allSpots.filter(s => 
            targetTags.some(tag => 
                (s.tags || []).includes(tag) || 
                (s.keywords || []).some(k => k.includes(tag)) ||
                (s.name || '').includes(tag)
            )
        );
        
        const finalPool = matched.length > 0 ? matched : allSpots;
        const shuffled = finalPool.sort(() => 0.5 - Math.random()).slice(0, 5);
        
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

    window.rfApp.search.clearHistory = () => {
        state.searchHistory = [];
        if (typeof saveState !== 'undefined') saveState.history();
        window.rfApp.search.renderDefaultSearch();
    };

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
            } else { window.rfApp.search.closeSuggest(); }
        };
    }

    if (content) {
        content.addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (!item) return;
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
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(!k) { window.rfApp.search.renderDefaultSearch(); return; }
                const allSpots = spots.concat(state.savedCustomSpots || []);
                if (searchWorker) {
                    searchWorker.postMessage({ action: 'search', keyword: k, spotsData: allSpots });
                } else {
                    const matches = allSpots.filter(s => 
                        (s.name || '').toLowerCase().includes(k) || 
                        (s.tags || []).some(t => t.toLowerCase().includes(k)) ||
                        (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
                    );
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
                }
            }, 300);
        });
    }

    document.addEventListener('click', (e) => {
        if (sugBox && !sugBox.classList.contains('u-hidden')) {
            if (!sugBox.contains(e.target) && e.target !== searchInput) window.rfApp.search.closeSuggest();
        }
    });

    window.closeSuggest = window.rfApp.search.closeSuggest;
    window.clearSearchInput = window.rfApp.search.clearSearchInput;
    window.renderDefaultSearch = window.rfApp.search.renderDefaultSearch;
    window.clearHistory = window.rfApp.search.clearHistory;
    window.rfApp.search.triggerSearch = triggerSearch; 
}
