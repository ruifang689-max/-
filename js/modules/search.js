// js/modules/search.js (修復情境推薦空白與洗牌優化版 + 搜尋動線優化)

import { spots } from '../data/spots.js';
import { state, saveState } from '../core/store.js';
import { closeCard, showCard } from './cards.js'; // 🌟 合併引入
import { getContextualData } from './contextEngine.js'; 

// ==========================================
// 1. 搜尋模組初始化
// ==========================================
export function initSearch() {
    const searchInput = document.getElementById('search-input') || document.getElementById('search');
    const suggestBox = document.getElementById('suggest');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (!searchInput) return;

    // 動態 Placeholder
    const updatePlaceholder = () => {
        if (!searchInput) return;
        if (state.currentLang === 'zh' || !state.currentLang) {
            let ctx = { timeContext: { greeting: "您好" }, seasonContext: { keywords: ["風景"] } };
            try { if (typeof getContextualData === 'function') ctx = getContextualData() || ctx; } catch(e){}
            
            const keyword = (ctx.seasonContext?.keywords && ctx.seasonContext.keywords.length > 0) ? ctx.seasonContext.keywords[0] : '秘境';
            searchInput.placeholder = `${ctx.timeContext?.greeting || '您好'}！試試「${keyword}」`;
        } else {
            searchInput.placeholder = (window.rfApp.t ? window.rfApp.t('search_ph') : "🔍 Search...");
        }
    };

    updatePlaceholder();
    window.rfApp.search = window.rfApp.search || {};
    window.rfApp.search.updatePlaceholder = updatePlaceholder;

    // 監聽焦點與輸入
    searchInput.addEventListener('focus', () => {
        updateSearchUI(searchInput.value.trim().toLowerCase());
    });

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        if (clearBtn) {
            if (keyword) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); } 
            else { clearBtn.classList.add('u-hidden'); clearBtn.classList.remove('u-block'); }
        }
        updateSearchUI(keyword);
    });

    // 點擊外部關閉
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container') && !e.target.closest('#suggest') && e.target !== searchInput) {
            if (suggestBox) suggestBox.classList.add('u-hidden');
        }
    });

    // 綁定其他全域方法 (保留您原本的邏輯)
    window.rfApp.search.filterByCategory = (categoryText) => {
        if (searchInput) searchInput.value = categoryText;
        if (clearBtn) { clearBtn.classList.remove('u-hidden'); clearBtn.classList.add('u-block'); }
        updateSearchUI(categoryText.toLowerCase());
        
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

    // 保留向下相容的綁定
    window.filterByCategory = window.rfApp.search.filterByCategory;
    window.clearSearchInput = window.rfApp.search.clearSearchInput;
    window.closeSuggest = window.rfApp.search.closeSuggest;
    window.clearSearchHistory = () => {
        state.searchHistory.length = 0;
        if (typeof saveState !== 'undefined') saveState.history();
        updateSearchUI(searchInput ? searchInput.value.trim().toLowerCase() : '');
    };
    
    // 🌟 將 goToSpot 指向新的 triggerSearch，統一搜尋邏輯
    window.rfApp.search.goToSpot = triggerSearch;
    window.goToSpot = triggerSearch;
}

// ==========================================
// 2. 獨立的觸發搜尋方法 (移出 initSearch 外)
// ==========================================
// 🌟 在 triggerSearch 函數上方加入手機判斷函數
const isMobile = () => window.innerWidth <= 768;

export function triggerSearch(name) { 
    if (!name) return;

    const searchInput = document.getElementById("search-input") || document.getElementById("search");
    const sugBox = document.getElementById("suggest");
    
    if (searchInput) {
        searchInput.value = name; 
        searchInput.blur(); 
    }
    if (sugBox) {
        sugBox.classList.remove('u-block'); 
        sugBox.classList.add('u-hidden');
        sugBox.style.display = "none"; 
    }
    
    state.searchHistory = (state.searchHistory || []).filter(h => h !== name);
    state.searchHistory.unshift(name);
    if (state.searchHistory.length > 8) state.searchHistory.pop();
    if (typeof saveState !== 'undefined') saveState.history();

    const allSpots = [...(Array.isArray(spots) ? spots : []), ...(state.savedCustomSpots || [])];
    const s = allSpots.find(x => x && x.name === name); 
    
    if (s && state.mapInstance) { 
        closeCard();
        state.mapInstance.flyTo([s.lat, s.lng], 16, { duration: 1.5 }); 
        
        setTimeout(() => {
            if (s.markerObj) {
                // 🌟 新增：封裝處理預覽畫面的邏輯
                const handlePreview = () => {
                    if (isMobile() && window.rfApp.ui && window.rfApp.ui.showBottomPreview) {
                        // 📱 手機版：關閉傳統 Popup 並彈出底部小卡
                        s.markerObj.closePopup();
                        window.rfApp.ui.showBottomPreview(s);
                        
                        // 視角偏移，避免圖釘被底部小卡擋住
                        const latlng = s.markerObj.getLatLng();
                        const offset = state.mapInstance.getSize().y * 0.15;
                        const targetPoint = state.mapInstance.project(latlng).subtract([0, offset]);
                        const targetLatLng = state.mapInstance.unproject(targetPoint);
                        state.mapInstance.flyTo(targetLatLng, 16, { animate: true, duration: 0.5 });
                    } else {
                        // 💻 桌機版：直接彈出傳統 Popup
                        s.markerObj.openPopup();
                    }
                };

                // 判斷是否被叢集收合
                if (state.cluster && state.cluster.hasLayer(s.markerObj)) {
                    state.cluster.zoomToShowLayer(s.markerObj, handlePreview);
                } else {
                    handlePreview();
                }
            }
        }, 800); 
    } 
}

// 掛載到全域
if (typeof window !== 'undefined') {
    if(!window.rfApp) window.rfApp = {};
    if(!window.rfApp.search) window.rfApp.search = {};
    window.rfApp.search.triggerSearch = triggerSearch;
    window.triggerSearch = triggerSearch;
}

// ==========================================
// 3. 核心 UI 渲染引擎 (保持原樣)
// ==========================================
function updateSearchUI(keyword) {
    const suggestBox = document.getElementById('suggest');
    const suggestContent = document.getElementById('suggest-content');
    if (!suggestBox || !suggestContent) return;

    suggestBox.classList.remove('u-hidden');
    suggestBox.classList.add('u-block');
    // 強制顯示
    suggestBox.style.display = 'block';

    const isZh = (!state.currentLang || state.currentLang === 'zh');
    const t = window.rfApp.t || (k => k); 

    let historyHtml = '';
    if (!keyword && state.searchHistory && state.searchHistory.length > 0) {
        historyHtml = `
            <div style="padding: 10px 15px; font-size: 13px; color: var(--text-sub); font-weight: bold; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fas fa-history"></i> ${isZh ? '最近搜尋' : 'Recent'}</span>
                <span onclick="clearSearchHistory()" style="color: var(--danger); font-size: 12px; font-weight: normal; cursor: pointer;">${t('清除')}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 15px 15px 15px; border-bottom: 1px solid var(--divider-color);">
                ${state.searchHistory.map(h => `<span data-name="${h.replace(/"/g, '&quot;')}" onclick="triggerSearch(this.getAttribute('data-name'))" style="background: var(--divider-color); color: var(--text-main); padding: 5px 12px; border-radius: 15px; font-size: 13px; cursor: pointer; transition: 0.2s;">${h}</span>`).join('')}
            </div>
        `;
    }

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
        <div style="padding: 10px 15px; font-size: 13px; color: #f39c12; font-weight: bold; border-bottom: ${keyword ? 'none' : '1px solid var(--divider-color)'};">
            <i class="fas fa-compass"></i> ${t('快速分類')}
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 5px 15px 15px 15px; border-bottom: 1px solid var(--divider-color);">
            ${categoryButtonsHtml}
        </div>
    `;

    let resultsHtml = '';
    const allSpots = [...spots, ...(state.savedCustomSpots || [])].filter(s => s && s.name);

    if (!keyword) {
        let ctx = { timeContext: {}, seasonContext: {} };
        try { if (typeof getContextualData === 'function') ctx = getContextualData() || ctx; } catch(e) {}
        
        const suggestTag = ctx.timeContext?.suggestTag || '秘境';
        const season = ctx.seasonContext?.season || '當季';
        const keywords = ctx.seasonContext?.keywords || [];
        
        const targetTags = [suggestTag, ...keywords].filter(Boolean);
        const recTitle = isZh ? `🎁 ${season}的${suggestTag}推薦` : `🎁 Recommended`;
        
        const matched = allSpots.filter(s => 
            targetTags.some(tag => (s.tags || []).includes(tag) || (s.name || '').includes(tag))
        );
        
        const baseList = matched.length > 0 ? matched : allSpots;
        const shuffled = baseList.map(value => ({ value, sort: Math.random() }))
                                 .sort((a, b) => a.sort - b.sort)
                                 .map(({ value }) => value)
                                 .slice(0, 5);

        if (shuffled.length > 0) {
            resultsHtml = `<div style="padding: 10px 15px; font-size: 13px; color: var(--accent); font-weight: bold; border-bottom: 1px solid var(--divider-color);">${recTitle}</div>`;
            resultsHtml += buildSpotListHtml(shuffled, ''); 
        }

    } else {
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

    suggestContent.innerHTML = historyHtml + categoryHtml + resultsHtml;
}

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
        
        const safeName = spot.name.replace(/"/g, '&quot;');

        // 🌟 將原本的 goToSpot 改為統一呼叫 triggerSearch
        return `
            <div class="search-result-item" data-name="${safeName}" onclick="triggerSearch(this.getAttribute('data-name'))" style="padding: 12px 15px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;">
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
