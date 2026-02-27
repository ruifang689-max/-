// js/modules/search.js (v661) - 多國語言、關鍵字搜尋修復版
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard } from './cards.js';
import { getContextualData } from './contextEngine.js?v=653'; 

let debounceTimer = null;
let searchWorker = null;

if (window.Worker) {
    searchWorker = new Worker('./js/workers/searchWorker.js?v=651'); 
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

    // 🌟 1. 動態 Placeholder (支援多國語言)
    const updatePlaceholder = () => {
        if (searchInput) {
            if (state.currentLang === 'zh' || !state.currentLang) {
                const ctx = getContextualData();
                searchInput.placeholder = `${ctx.timeContext.greeting} 試試「${ctx.seasonContext.keywords[0]}」`;
            } else {
                // 如果翻譯引擎還沒載入，就用預設英文
                searchInput.placeholder = (window.rfApp.t ? window.rfApp.t('search_ph') : "🔍 Search...");
            }
        }
    };
    
    updatePlaceholder();
    window.rfApp.search.updatePlaceholder = updatePlaceholder;

    window.rfApp.search.closeSuggest = () => { 
        if(sugBox) { sugBox.classList.remove('u-block'); sugBox.classList.add('u-hidden'); }
    };

    window.rfApp.search.clearSearchInput = () => {
        if(searchInput) {
            searchInput.value = "";
            updatePlaceholder();
        }
        if(clearBtn) { clearBtn.classList.remove('u-block'); clearBtn.classList.add('u-hidden'); }
        window.rfApp.search.closeSuggest();
        if(typeof window.filterSpots === 'function') window.filterSpots('all', null);
    };

    window.rfApp.search.renderDefaultSearch = () => {
        if(!content || !sugBox || !tplListItem) return;
        content.innerHTML = ""; 
        const fragment = document.createDocumentFragment();
        
        const isZh = (!state.currentLang || state.currentLang === 'zh');
        const t = window.rfApp.t || (k => k); // 取得翻譯函數
        
        // A. 歷史紀錄
        if (state.searchHistory && state.searchHistory.length > 0) {
            const title = document.createElement('div');
            title.className = "search-section-title";
            // 簡單的標題翻譯
            const histTitle = isZh ? '🕒 最近搜尋' : '🕒 Recent';
            const clearText = isZh ? '清除' : 'Clear';
            title.innerHTML = `🕒 ${t('最近搜尋')} <span class="clear-history-btn" onclick="rfApp.search.clearHistory()">${t('清除')}</span>`;
            fragment.appendChild(title);
            state.searchHistory.forEach(h => {
                const node = tplListItem.content.cloneNode(true);
                node.querySelector('.list-item').setAttribute('data-name', h);
                node.querySelector('.item-icon').classList.add('fa-history');
                node.querySelector('.item-text').textContent = h;
                fragment.appendChild(node);
            });
        }
        
        // B. 快速分類 (支援多國語言)
        const catTitle = document.createElement('div');
        catTitle.className = "search-section-title";
       catTitle.textContent = `🏷️ ${t('快速分類')}`; // 🌟 讓動態引擎去翻譯
        fragment.appendChild(catTitle);
        
        const catBox = document.createElement("div");
        catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
        
        // 定義分類鍵值與中文標籤的對應
        const quickCats = [
            { key: 'chip_food', tag: '美食', fallback: '🍜 Food' },
            { key: 'chip_nature', tag: '自然', fallback: '⛰️ Nature' },
            { key: 'chip_history', tag: '歷史', fallback: '🏛️ History' },
            { key: 'transport', tag: '交通', fallback: '🚌 Transport' }
        ];
        
        quickCats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "chip"; 
            
            // 嘗試取得翻譯
            let displayText = window.rfApp.t ? window.rfApp.t(cat.key) : '';
            if (!displayText || displayText === cat.key) {
                displayText = isZh ? cat.tag : cat.fallback;
                if (isZh && displayText === '美食') displayText = '🍜 美食';
                if (isZh && displayText === '自然') displayText = '⛰️ 自然';
                if (isZh && displayText === '歷史') displayText = '🏛️ 歷史';
                if (isZh && displayText === '交通') displayText = '🚌 交通';
            }
            btn.textContent = displayText;
            
            btn.onclick = (e) => {
                e.stopPropagation(); 
                if(searchInput) { 
                    // 填入搜尋框時，過濾掉 Emoji，讓畫面乾淨
                    const cleanText = displayText.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\s/g, '').replace(/[🍜⛰️🏛️🚌📍🌟]/g, '').trim();
                    searchInput.value = cleanText; 
                    searchInput.blur(); 
                    if(clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
                }
                window.rfApp.search.closeSuggest();
                // 🌟 重要：傳給過濾器的永遠是「中文 Tag」，確保能找到資料！
                setTimeout(() => { if(typeof window.filterSpots === 'function') window.filterSpots(cat.tag, null); }, 50);
            };
            catBox.appendChild(btn);
        });
        fragment.appendChild(catBox);
        
        // C. 情境感知推薦
        const ctx = getContextualData();
        const targetTags = [ctx.timeContext.suggestTag, ...ctx.seasonContext.keywords];
        const recTitle = document.createElement('div');
        recTitle.className = "search-section-title";
        recTitle.style.color = "var(--accent)";
        recTitle.innerHTML = isZh ? `🎁 ${ctx.seasonContext.season}的${ctx.timeContext.suggestTag}推薦` : `🎁 Recommended`;
        fragment.appendChild(recTitle);
        
        const allSpots = spots.concat(state.savedCustomSpots || []);
        const matched = allSpots.filter(s => 
            targetTags.some(tag => 
                (s.tags || []).includes(tag) || (s.name || '').includes(tag)
            )
        );
        const shuffled = (matched.length > 0 ? matched : allSpots).sort(() => 0.5 - Math.random()).slice(0, 5);
        shuffled.forEach(s => {
            const node = tplListItem.content.cloneNode(true);
            node.querySelector('.list-item').setAttribute('data-name', s.name);
            node.querySelector('.item-icon').classList.add('fa-star');
            node.querySelector('.item-icon').style.color = 'var(--accent)';
            node.querySelector('.item-text').textContent = s.name;
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
            if (document.activeElement !== searchInput) return;
            const matches = e.data.result;
            if (matches && matches.length > 0) {
                content.innerHTML = "";
                const fragment = document.createDocumentFragment();
                matches.forEach(s => {
                    const node = tplListItem.content.cloneNode(true);
                    node.querySelector('.list-item').setAttribute('data-name', s.name);
                    node.querySelector('.item-icon').classList.add('fa-map-marker-alt');
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
        searchInput.addEventListener('focus', () => { if(!searchInput.value.trim()) window.rfApp.search.renderDefaultSearch(); });
        searchInput.addEventListener('input', function() {
            const k = this.value.trim().toLowerCase();
            if (clearBtn) { if (k) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); } }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(!k) { window.rfApp.search.renderDefaultSearch(); return; }
                const allSpots = spots.concat(state.savedCustomSpots || []);
                
                // 🌟 2. 關鍵 Bug 修復：必須把 keywords 也傳給 Worker，否則搜尋會壞掉！
                const plainSpots = allSpots.map(s => ({ 
                    name: s.name, 
                    tags: s.tags || [],
                    keywords: s.keywords || [] 
                }));
                
                if (searchWorker) { searchWorker.postMessage({ action: 'search', keyword: k, spotsData: plainSpots }); }
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
