// js/modules/search.js (終極融合版：多國語言 + 情境感知 + 即時高光搜尋)

import { spots } from '../data/spots.js';
import { state, saveState } from '../core/store.js';
import { showCard } from './cards.js';
import { getContextualData } from './contextEngine.js'; 

export function initSearch() {
    // 支援舊版與新版的 ID 命名
    const searchInput = document.getElementById('search-input') || document.getElementById('search');
    const suggestBox = document.getElementById('suggest');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (!searchInput) return;

    // 🌟 1. 動態 Placeholder (結合情境引擎與多國語言)
    const updatePlaceholder = () => {
        if (!searchInput) return;
        if (state.currentLang === 'zh' || !state.currentLang) {
            const ctx = getContextualData();
            searchInput.placeholder = `${ctx.timeContext.greeting} 試試「${ctx.seasonContext.keywords[0]}」`;
        } else {
            searchInput.placeholder = (window.rfApp.t ? window.rfApp.t('search_ph') : "🔍 Search...");
        }
    };

    updatePlaceholder();
    window.rfApp.search = window.rfApp.search || {};
    window.rfApp.search.updatePlaceholder = updatePlaceholder;

    // 2. 監聽焦點與輸入，觸發即時 UI 更新
    searchInput.addEventListener('focus', () => {
        const keyword = searchInput.value.trim().toLowerCase();
        updateSearchUI(keyword);
    });

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        if (clearBtn) {
            if (keyword) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } 
            else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); }
        }
        updateSearchUI(keyword);
    });

    // 3. 點擊外部關閉搜尋框
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container') && !e.target.closest('#suggest') && e.target !== searchInput) {
            if (suggestBox) suggestBox.classList.add('u-hidden');
        }
    });

    // 4. 全域控制功能
    window.rfApp.search.triggerSearch = (keyword) => {
        if (searchInput) searchInput.value = keyword;
        if (clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
        updateSearchUI(keyword.toLowerCase());
    };

    window.rfApp.search.filterByCategory = (categoryText) => {
        if (searchInput) searchInput.value = categoryText;
        if (clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
        updateSearchUI(categoryText.toLowerCase());
        
        // 同時連動地圖上的圖釘過濾
        setTimeout(() => { if(typeof window.filterSpots === 'function') window.filterSpots(categoryText, null); }, 50);
    };

    window.rfApp.search.closeSuggest = () => { 
        if(suggestBox) { suggestBox.classList.remove('u-block'); suggestBox.classList.add('u-hidden'); }
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

    window.rfApp.search.goToSpot = (spotName) => {
        const allSpots = spots.concat(state.savedCustomSpots || []);
        const spot = allSpots.find(s => s.name === spotName);
        if (!spot) return;

        // 儲存搜尋歷史
        state.searchHistory = (state.searchHistory || []).filter(h => h !== spotName);
        state.searchHistory.unshift(spotName);
        if (state.searchHistory.length > 8) state.searchHistory.pop();
        if (typeof saveState !== 'undefined') saveState.history();

        window.rfApp.search.closeSuggest();
        if (searchInput) searchInput.blur();

        // 飛到景點並展開卡片與叢集
        if (state.mapInstance && spot.lat && spot.lng) {
            state.mapInstance.flyTo([spot.lat, spot.lng], 16, { duration: 1.5 });
            if (state.cluster && spot.markerObj) {
                state.cluster.zoomToShowLayer(spot.markerObj, () => spot.markerObj.openPopup());
            } else if (spot.markerObj) {
                spot.markerObj.openPopup();
            }
            showCard(spot);
        }
    };

    // 暴露給 HTML 按鈕使用
    window.goToSpot = window.rfApp.search.goToSpot;
    window.filterByCategory = window.rfApp.search.filterByCategory;
    window.clearSearchInput = window.rfApp.search.clearSearchInput;
    window.closeSuggest = window.rfApp.search.closeSuggest;
    window.clearSearchHistory = () => {
        state.searchHistory.length = 0;
        if (typeof saveState !== 'undefined') saveState.history();
        updateSearchUI(searchInput ? searchInput.value.trim().toLowerCase() : '');
    };
}

// 🌟 核心 UI 渲染引擎：動態組合所有區塊
function updateSearchUI(keyword) {
    const suggestBox = document.getElementById('suggest');
    const suggestContent = document.getElementById('suggest-content');
    if (!suggestBox || !suggestContent) return;

    suggestBox.classList.remove('u-hidden');
    suggestBox.classList.add('u-block');

    const isZh = (!state.currentLang || state.currentLang === 'zh');
    const t = window.rfApp.t || (k => k); 

    // --- 區塊 A：歷史紀錄 (僅在未輸入關鍵字時顯示) ---
    let historyHtml = '';
    if (!keyword && state.searchHistory && state.searchHistory.length > 0) {
        historyHtml = `
            <div style="padding: 10px 15px; font-size: 13px; color: var(--text-sub); font-weight: bold; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fas fa-history"></i> ${isZh ? '最近搜尋' : 'Recent'}</span>
                <span onclick="clearSearchHistory()" style="color: var(--danger); font-size: 12px; font-weight: normal; cursor: pointer;">${t('清除')}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 15px 15px 15px; border-bottom: 1px solid var(--divider-color);">
                ${state.searchHistory.map(h => `<span onclick="goToSpot('${h}')" style="background: var(--divider-color); color: var(--text-main); padding: 5px 12px; border-radius: 15px; font-size: 13px; cursor: pointer; transition: 0.2s;">${h}</span>`).join('')}
            </div>
        `;
    }

    // --- 區塊 B：快速分類 (支援多國語言，永遠顯示) ---
    const quickCats = [
        { key: 'chip_food', tag: '美食', icon: 'fa-utensils', bg: '#fff3e0', color: '#ff9800', fallback: 'Food' },
        { key: 'chip_nature', tag: '自然', icon: 'fa-leaf', bg: '#e3f2fd', color: '#2196f3', fallback: 'Nature' },
        { key: 'chip_history', tag: '歷史', icon: 'fa-monument', bg: '#e8f5e9', color: '#4caf50', fallback: 'History' },
        { key: 'transport', tag: '交通', icon: 'fa-bus', bg: '#f3e5f5', color: '#9c27b0', fallback: 'Transport' }
    ];

    let categoryButtonsHtml = quickCats.map(cat => {
        let displayText = window.rfApp.t ? window.rfApp.t(cat.key) : '';
        if (!displayText || displayText === cat.key) displayText = isZh ? cat.tag : cat.fallback;
        
        return `
            <div onclick="filterByCategory('${cat.tag}')" style="text-align: center; cursor: pointer; transition: transform 0.2s;">
                <div style="width: 45px; height: 45px; background: ${cat.bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px auto; color: ${cat.color}; font-size: 18px;"><i class="fas ${cat.icon}"></i></div>
                <span style="font-size: 12px; color: var(--text-main);">${displayText}</span>
            </div>
        `;
    }).join('');

    const categoryHtml = `
        <div style="padding: 10px 15px; font-size: 13px; color: var(--text-sub); font-weight: bold; border-bottom: ${keyword ? 'none' : '1px solid var(--divider-color)'};">
            <i class="fas fa-compass"></i> ${t('快速分類')}
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 5px 15px 15px 15px; border-bottom: 1px solid var(--divider-color);">
            ${categoryButtonsHtml}
        </div>
    `;

    // --- 區塊 C：情境感知推薦 或 搜尋結果 ---
    let resultsHtml = '';
    const allSpots = spots.concat(state.savedCustomSpots || []);

    if (!keyword) {
        // 【無關鍵字】：顯示情境推薦 (融合自 contextEngine)
        const ctx = getContextualData();
        const targetTags = [ctx.timeContext.suggestTag, ...ctx.seasonContext.keywords];
        const recTitle = isZh ? `🎁 ${ctx.seasonContext.season}的${ctx.timeContext.suggestTag}推薦` : `🎁 Recommended`;
        
        const matched = allSpots.filter(s => 
            targetTags.some(tag => (s.tags || []).includes(tag) || (s.name || '').includes(tag))
        );
        const shuffled = (matched.length > 0 ? matched : allSpots).sort(() => 0.5 - Math.random()).slice(0, 5);

        resultsHtml = `<div style="padding: 10px 15px; font-size: 13px; color: var(--accent); font-weight: bold; border-bottom: 1px solid var(--divider-color);">${recTitle}</div>`;
        resultsHtml += buildSpotListHtml(shuffled, ''); // 不需高光

    } else {
        // 【有關鍵字】：顯示即時多維度搜尋結果
        const results = allSpots.filter(spot => {
            const nameMatch = spot.name && spot.name.toLowerCase().includes(keyword);
            const tagMatch = spot.tags && spot.tags.some(t => t.toLowerCase().includes(keyword));
            const highlightMatch = spot.highlights && spot.highlights.toLowerCase().includes(keyword);
            const descMatch = spot.description && spot.description.toLowerCase().includes(keyword);
            const categoryMatch = spot.category && spot.category.toLowerCase().includes(keyword);
            const keywordMatch = spot.keywords && spot.keywords.some(k => k.toLowerCase().includes(keyword));
            return nameMatch || tagMatch || highlightMatch || descMatch || categoryMatch || keywordMatch;
        });

        if (results.length === 0) {
            resultsHtml = `<div style="padding: 20px; text-align: center; color: var(--text-sub);">${isZh ? '找不到與' : 'No results for'} <strong style="color:var(--danger)">${keyword}</strong> ${isZh ? '相關的景點 😢' : '😢'}</div>`;
        } else {
            resultsHtml = `<div style="padding: 10px 15px; font-size: 13px; color: var(--primary); font-weight: bold; background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--divider-color);">
                            <i class="fas fa-list-ul"></i> ${isZh ? '搜尋結果' : 'Results'} (${results.length})
                        </div>`;
            resultsHtml += buildSpotListHtml(results, keyword);
        }
    }

    // 組合最終 HTML 並寫入 DOM
    suggestContent.innerHTML = historyHtml + categoryHtml + resultsHtml;
}

// 輔助函數：建立景點清單的 HTML (支援縮圖與關鍵字高光)
function buildSpotListHtml(spotsArray, keyword) {
    return spotsArray.map(spot => {
        const mainTag = spot.tags && spot.tags.length > 0 ? spot.tags[0] : (spot.category || '秘境');
        
        let highlightedName = spot.name;
        if (keyword) {
            try {
                const regex = new RegExp(keyword, 'gi');
                highlightedName = spot.name.replace(regex, match => `<span style="color: var(--danger); font-weight: 900;">${match}</span>`);
            } catch (e) {}
        }
        
        return `
            <div class="search-result-item" onclick="goToSpot('${spot.name}')" style="padding: 12px 15px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;">
                <div style="width: 45px; height: 45px; border-radius: 8px; background: var(--divider-color); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${spot.coverImg ? `<img src="${spot.coverImg}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas ${keyword ? 'fa-map-marker-alt' : 'fa-star'}" style="color: ${keyword ? 'var(--primary)' : 'var(--accent)'}; font-size: 20px;"></i>`}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; color: var(--text-main); font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">
                        ${highlightedName}
                    </div>
                    <div style="font-size: 12px; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <span style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 6px; font-weight: bold;">${mainTag}</span>
                        ${spot.highlights || spot.description || '點擊查看詳細資訊'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
