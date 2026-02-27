// js/modules/search.js (修復與 UX 優化版)

import { spots } from '../data/spots.js';
import { state, saveState } from '../core/store.js';
import { showCard } from './cards.js';

export function initSearch() {
    const searchInput = document.getElementById('search-input');
    const suggestBox = document.getElementById('suggest');
    
    if (!searchInput) return;

    // 1. 取得焦點時，顯示預設選單 (歷史紀錄 + 快速分類)
    searchInput.addEventListener('focus', () => {
        const keyword = searchInput.value.trim().toLowerCase();
        updateSearchUI(keyword);
    });

    // 2. 監聽輸入事件，達成「即時搜尋 (Live Search)」
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        updateSearchUI(keyword);
    });

    // 3. 點擊外部自動關閉搜尋結果
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container') && !e.target.closest('#suggest')) {
            if (suggestBox) suggestBox.classList.add('u-hidden');
        }
    });

    // 4. 將方法掛載到全域，允許其他模組呼叫
    window.rfApp.search.triggerSearch = (keyword) => {
        if (searchInput) searchInput.value = keyword;
        updateSearchUI(keyword.toLowerCase());
    };

    // 5. 快速分類按鈕點擊事件
    window.rfApp.search.filterByCategory = (categoryText) => {
        if (searchInput) searchInput.value = categoryText;
        updateSearchUI(categoryText.toLowerCase());
    };

    // 6. 導航到景點並開啟卡片
    window.rfApp.search.goToSpot = (spotName) => {
        const spot = spots.find(s => s.name === spotName);
        if (!spot) return;

        // 儲存搜尋歷史 (最多記 8 筆)
        if (!state.searchHistory.includes(spotName)) {
            state.searchHistory.unshift(spotName);
            if (state.searchHistory.length > 8) state.searchHistory.pop();
            if (typeof saveState !== 'undefined') saveState.history();
        }

        // 關閉搜尋框並移除手機鍵盤焦點
        if (suggestBox) suggestBox.classList.add('u-hidden');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
        }

        // 飛到該點並打開卡片
        if (state.mapInstance && spot.lat && spot.lng) {
            state.mapInstance.flyTo([spot.lat, spot.lng], 16, { duration: 1.5 });
            
            // 如果圖釘被叢集 (Cluster) 摺疊，強制展開並顯示彈出氣泡
            if (state.cluster && spot.markerObj) {
                state.cluster.zoomToShowLayer(spot.markerObj, () => {
                    spot.markerObj.openPopup();
                });
            } else if (spot.markerObj) {
                spot.markerObj.openPopup();
            }
            
            showCard(spot);
        }
    };

    // 暴露給 HTML 點擊事件使用
    window.goToSpot = window.rfApp.search.goToSpot;
    window.filterByCategory = window.rfApp.search.filterByCategory;
    window.clearSearchHistory = () => {
        state.searchHistory.length = 0;
        if (typeof saveState !== 'undefined') saveState.history();
        updateSearchUI(searchInput.value.trim().toLowerCase());
    };
}

// 🌟 核心 UI 渲染引擎：動態組合「歷史紀錄」、「快速分類」與「搜尋結果」
function updateSearchUI(keyword) {
    const suggestBox = document.getElementById('suggest');
    const suggestContent = document.getElementById('suggest-content');
    if (!suggestBox || !suggestContent) return;

    suggestBox.classList.remove('u-hidden');

    // --- 區塊 A：歷史紀錄 (僅在未輸入關鍵字時顯示) ---
    let historyHtml = '';
    if (!keyword && state.searchHistory && state.searchHistory.length > 0) {
        historyHtml = `
            <div style="padding: 10px 15px; font-size: 13px; color: var(--text-sub); font-weight: bold; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fas fa-history"></i> 最近搜尋</span>
                <span onclick="clearSearchHistory()" style="color: var(--danger); font-size: 12px; font-weight: normal; cursor: pointer;">清除</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 15px 15px 15px; border-bottom: 1px solid var(--divider-color);">
                ${state.searchHistory.map(h => `<span onclick="goToSpot('${h}')" style="background: var(--divider-color); color: var(--text-main); padding: 5px 12px; border-radius: 15px; font-size: 13px; cursor: pointer; transition: 0.2s;">${h}</span>`).join('')}
            </div>
        `;
    }

    // --- 區塊 B：快速分類 (永遠顯示，且置頂) ---
    const categoryHtml = `
        <div style="padding: 10px 15px; font-size: 13px; color: var(--text-sub); font-weight: bold; border-bottom: ${keyword ? 'none' : '1px solid var(--divider-color)'};">
            <i class="fas fa-compass"></i> 快速分類
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 5px 15px 15px 15px; border-bottom: 1px solid var(--divider-color);">
            <div onclick="filterByCategory('美食')" style="text-align: center; cursor: pointer; transition: transform 0.2s;">
                <div style="width: 45px; height: 45px; background: #fff3e0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px auto; color: #ff9800; font-size: 18px;"><i class="fas fa-utensils"></i></div>
                <span style="font-size: 12px; color: var(--text-main);">美食</span>
            </div>
            <div onclick="filterByCategory('歷史')" style="text-align: center; cursor: pointer; transition: transform 0.2s;">
                <div style="width: 45px; height: 45px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px auto; color: #4caf50; font-size: 18px;"><i class="fas fa-monument"></i></div>
                <span style="font-size: 12px; color: var(--text-main);">歷史</span>
            </div>
            <div onclick="filterByCategory('自然')" style="text-align: center; cursor: pointer; transition: transform 0.2s;">
                <div style="width: 45px; height: 45px; background: #e3f2fd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px auto; color: #2196f3; font-size: 18px;"><i class="fas fa-leaf"></i></div>
                <span style="font-size: 12px; color: var(--text-main);">自然</span>
            </div>
            <div onclick="filterByCategory('打卡')" style="text-align: center; cursor: pointer; transition: transform 0.2s;">
                <div style="width: 45px; height: 45px; background: #fce4ec; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px auto; color: #e91e63; font-size: 18px;"><i class="fas fa-camera"></i></div>
                <span style="font-size: 12px; color: var(--text-main);">打卡</span>
            </div>
        </div>
    `;

    // --- 區塊 C：搜尋結果 (顯示在分類下方) ---
    let resultsHtml = '';
    if (keyword) {
        // 多維度搜尋比對
        const results = spots.filter(spot => {
            const nameMatch = spot.name && spot.name.toLowerCase().includes(keyword);
            const tagMatch = spot.tags && spot.tags.some(t => t.toLowerCase().includes(keyword));
            const highlightMatch = spot.highlights && spot.highlights.toLowerCase().includes(keyword);
            const descMatch = spot.description && spot.description.toLowerCase().includes(keyword);
            const categoryMatch = spot.category && spot.category.toLowerCase().includes(keyword);
            return nameMatch || tagMatch || highlightMatch || descMatch || categoryMatch;
        });

        if (results.length === 0) {
            resultsHtml = `<div style="padding: 20px; text-align: center; color: var(--text-sub);">找不到與 <strong style="color:var(--danger)">${keyword}</strong> 相關的景點 😢</div>`;
        } else {
            resultsHtml = `<div style="padding: 10px 15px; font-size: 13px; color: var(--primary); font-weight: bold; background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--divider-color);">
                            <i class="fas fa-list-ul"></i> 搜尋結果 (${results.length} 筆)
                        </div>`;
            
            results.forEach(spot => {
                const mainTag = spot.tags && spot.tags.length > 0 ? spot.tags[0] : (spot.category || '秘境');
                
                // 關鍵字高光效果 (紅色粗體)
                let highlightedName = spot.name;
                try {
                    const regex = new RegExp(keyword, 'gi');
                    highlightedName = spot.name.replace(regex, match => `<span style="color: var(--danger); font-weight: 900;">${match}</span>`);
                } catch (e) {}
                
                resultsHtml += `
                    <div class="search-result-item" onclick="goToSpot('${spot.name}')" style="padding: 12px 15px; border-bottom: 1px solid var(--divider-color); cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;">
                        <div style="width: 45px; height: 45px; border-radius: 8px; background: var(--divider-color); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            ${spot.coverImg ? `<img src="${spot.coverImg}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fas fa-map-marker-alt" style="color: var(--primary); font-size: 20px;"></i>`}
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
            });
        }
    }

    // 組合 HTML 並寫入 DOM
    suggestContent.innerHTML = historyHtml + categoryHtml + resultsHtml;
}
