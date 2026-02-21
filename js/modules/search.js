// js/modules/search.js (v601)
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';

export function triggerSearch(name) { 
    const searchInput = document.getElementById("search"); 
    const clearBtn = document.getElementById("search-clear-btn");
    
    if(searchInput) searchInput.value = name; 
    
    // 🌟 狀態驅動：顯示清除按鈕
    if(clearBtn) { 
        clearBtn.classList.remove('u-hidden');
        clearBtn.classList.add('u-block'); 
    } 
    
    if (typeof window.closeSuggest === 'function') window.closeSuggest();
    
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
    
    // 🌟 狀態驅動：關閉推薦框
    window.closeSuggest = () => { 
        if(sugBox) {
            sugBox.classList.remove('u-block');
            sugBox.classList.add('u-hidden');
        }
    };
    
    // 🌟 狀態驅動：清除輸入框與按鈕
    window.clearSearchInput = () => {
        if(searchInput) { searchInput.value = ""; }
        if(clearBtn) { 
            clearBtn.classList.remove('u-block');
            clearBtn.classList.add('u-hidden');
        }
        window.closeSuggest(); 
        window.filterSpots('all', null); // 清除後地圖恢復全部圖釘
    };
    
    // =========================================
    // 🌟 預設搜尋推薦：歷史紀錄、快速分類與隨機推薦
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
                    triggerSearch(h); 
                    window.closeSuggest();
                };
                c.appendChild(div);
            });
        }
        
        // 2. 渲染快速分類
        c.innerHTML += `<div class="search-section-title">🏷️ 快速分類</div>`;
        const cats = ['美食', '自然', '歷史', '交通']; 
        const catBox = document.createElement("div");
        catBox.style.cssText = "display:flex; gap:8px; padding:10px 15px; flex-wrap:wrap;";
        cats.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = "chip"; btn.innerText = cat;
            btn.onclick = () => { 
                document.getElementById("search").value = cat; 
                window.filterSpots(cat, null); 
                window.closeSuggest();
            };
            catBox.appendChild(btn);
        });
        c.appendChild(catBox);
        
        // 🌟 3. 新增：隨機分類探索推薦 (每次點開都有不同驚喜)
        const recCats = ['美食', '自然', '歷史']; 
        const randomCat = recCats[Math.floor(Math.random() * recCats.length)];
        c.innerHTML += `<div class="search-section-title" style="color: var(--accent);">🎁 探索推薦：${randomCat}</div>`;
        
        // 過濾出符合隨機分類的景點
        const matchedSpots = spots.concat(state.savedCustomSpots || []).filter(s => (s.tags || []).includes(randomCat));
        // 將陣列隨機洗牌，並只取出前 5 筆，避免清單過長
        const shuffledSpots = matchedSpots.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        shuffledSpots.forEach(s => {
            const div = document.createElement("div"); 
            div.className = "list-item";
            // 🌟 加上星星圖示與右側小箭頭，質感滿分
            div.innerHTML = `
                <span><i class="fas fa-star" style="color:var(--accent); margin-right:8px;"></i> ${s.name}</span> 
                <i class="fas fa-chevron-right" style="color:#ccc; font-size:12px;"></i>
            `;
            div.onclick = () => { 
                document.getElementById("search").value = s.name; 
                triggerSearch(s.name); 
                window.closeSuggest();
            };
            c.appendChild(div);
        });
        
        // 🌟 狀態驅動：顯示建議框
        sugBox.classList.remove('u-hidden');
        sugBox.classList.add('u-block');
    };

    window.clearHistory = () => {
        state.searchHistory = [];
        if (typeof saveState !== 'undefined') saveState.history();
        window.renderDefaultSearch();
    };

    // 點擊地圖空白處自動關閉推薦
    document.addEventListener('click', (e) => {
        if (sugBox && !sugBox.classList.contains('u-hidden')) {
            if (!sugBox.contains(e.target) && e.target !== searchInput) {
                window.closeSuggest();
            }
        }
    });

    window.filterSpots = (category, element) => {
        if(element) { 
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); 
            element.classList.add('active'); 
        }
        if(state.cluster) state.cluster.clearLayers(); 
        
        const filteredSpots = category === 'all' 
            ? spots.concat(state.savedCustomSpots || []) 
            : spots.concat(state.savedCustomSpots || []).filter(s => (s.tags || []).includes(category)); 
            
        filteredSpots.forEach(s => {
            if (typeof window.addMarkerToMap === 'function' || typeof addMarkerToMap !== 'undefined') {
                addMarkerToMap(s);
            }
        }); 
        if (typeof window.closeCard === 'function') window.closeCard();
    };

    // =========================================
    // 🌟 最關鍵的一步：補回監聽器！
    // =========================================
    if(searchInput) {
        // 1. 點擊輸入框時，顯示預設推薦
        searchInput.addEventListener('focus', () => {
            if(!searchInput.value.trim()) {
                window.renderDefaultSearch();
            } else if (sugBox && sugBox.classList.contains('u-hidden')) {
                searchInput.dispatchEvent(new Event('input'));
            }
        });

        // 2. 打字時，進行即時搜尋過濾
        searchInput.addEventListener('input', function() {
            const k = this.value.trim().toLowerCase();

            // 切換清除按鈕顯示狀態
            if (clearBtn) {
                if (k) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
                else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); }
            }

            const c = document.getElementById("suggest-content");
            if(!k) { window.renderDefaultSearch(); return; }

            c.innerHTML = "";
            const matches = spots.concat(state.savedCustomSpots || []).filter(s => 
                (s.name || '').toLowerCase().includes(k) || 
                (s.tags || []).some(t => t.toLowerCase().includes(k)) || 
                (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
            );

            if(matches.length > 0) {
                sugBox.classList.remove('u-hidden'); 
                sugBox.classList.add('u-block');
                
                matches.forEach(s => {
                    const div = document.createElement("div"); div.className = "list-item";
                    div.innerHTML = `<span><i class="fas fa-map-marker-alt" style="color:var(--primary)"></i> ${s.name}</span>`;
                    div.onclick = () => {
                        // 儲存搜尋歷史
                        state.searchHistory = (state.searchHistory || []).filter(h => h !== s.name);
                        state.searchHistory.unshift(s.name);
                        if(state.searchHistory.length > 5) state.searchHistory.pop();
                        if(typeof saveState !== 'undefined') saveState.history();

                        triggerSearch(s.name);
                    };
                    c.appendChild(div);
                });
            } else {
                window.closeSuggest();
            }
        });
    }
}
