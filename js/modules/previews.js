// js/modules/previews.js
import { state } from '../core/store.js';

function calculateWalk(lat, lng) {
    if (!state.userPos) return "--";
    const distance = state.mapInstance.distance(state.userPos, [lat, lng]);
    const mins = Math.round(distance / 80);
    return mins < 1 ? "1分內" : `約 ${mins} 分`;
}

export function getPreviewHtml(s) {
    const t = window.rfApp.t || (k => k); 
    const svgColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#333333';
    
    // 1. 生成安全的 SVG 預設圖
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="130"><rect width="100%" height="100%" fill="${svgColor}"/><text x="50%" y="50%" fill="white" font-size="24" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${s.name}</text></svg>`;
    const fallbackSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
    
    // 2. 處理雲端圖與防護佔位文字
    let cloudImg = s.wikiImg || s.coverImg || "";
    if (typeof cloudImg === 'string' && cloudImg.includes('[圖片太大')) {
        cloudImg = "";
    }

    // 3. 自動推算本地端圖片路徑 (去除括號，例如「九份老街 (基山街)」->「九份老街」)
    const baseName = s.name.split('(')[0].trim();
    const localImg = `./assets/images/spots/${baseName}.jpg`;

    // 4. 準備 onerror 的備援網址 (如果雲端有圖就用雲端，沒有就用 SVG)
    const fallbackSrc = cloudImg || fallbackSvg;

    const isCustom = s.tags && s.tags.includes('自訂');
    const foodIcon = isCustom ? 'fa-star' : 'fa-utensils';
    const foodLabel = isCustom ? t('chip_custom') : t('food');
    const foodText = isCustom ? t('history') : (s.food || '--');
    const safeName = s.name.replace(/"/g, '&quot;');

    // 🌟 魔法在此：src 先試著載入本地圖，失敗的話 onerror 會立刻換成 fallbackSrc
    return `
        <div class="preview-card" onclick="rfApp.ui.openCardByName('${safeName}')">
            <img class="preview-img" src="${localImg}" onerror="this.onerror=null; this.src='${fallbackSrc}';" loading="lazy">
            <div class="preview-info">
                <div class="preview-header">
                    <span class="preview-title">${s.name}</span>
                    <span class="walk-badge"><i class="fas fa-walking"></i> ${calculateWalk(s.lat, s.lng)}</span>
                </div>
                <div class="preview-tag-box">
                    ${(s.tags || []).map(tag => `<span class="mini-tag">${tag}</span>`).join('')}
                </div>
                <div class="food-preview">
                    <i class="fas ${foodIcon}"></i> ${foodLabel}：${foodText}
                </div>
            </div>
        </div>
    `.replace(/\n/g, '').trim();
}
