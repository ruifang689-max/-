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
    const img = s.wikiImg || s.coverImg || `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="130"><rect width="100%" height="100%" fill="%23${svgColor.replace('#','')}"/><text x="50%" y="50%" fill="white" font-size="24" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">Ruifang</text></svg>`;
    const isCustom = s.tags && s.tags.includes('自訂');
    const foodIcon = isCustom ? 'fa-star' : 'fa-utensils';
    const foodLabel = isCustom ? t('chip_custom') : t('food');
    const foodText = isCustom ? t('history') : (s.food || '--');
    const safeName = s.name.replace(/"/g, '&quot;');

    return `
        <div class="preview-card" onclick="rfApp.ui.openCardByName('${safeName}')">
            <img class="preview-img" src="${img}" loading="lazy">
            <div class="preview-info">
                <div class="preview-header">
                    <span class="preview-title">${s.name}</span>
                    <span class="walk-badge"><i class="fas fa-walking"></i> ${calculateWalk(s.lat, s.lng)}</span>
                </div>
                <div class="preview-tag-box">
                    ${(s.tags || []).map(t => `<span class="mini-tag">${t}</span>`).join('')}
                </div>
                <div class="food-preview">
                    <i class="fas ${foodIcon}"></i> ${foodLabel}：${foodText}
                </div>
            </div>
        </div>
    `.replace(/\n/g, '').trim();
}

// 🌟 新增：開啟手機版底部小卡的方法
export function showBottomPreview(spot) {
    const bottomCard = document.getElementById('bottom-preview-card');
    const bottomContent = document.getElementById('bottom-preview-content');
    
    if (!bottomCard || !bottomContent) return;

    // 將內容塞入底部容器
    bottomContent.innerHTML = getPreviewHtml(spot);
    
    // 移除隱藏 class，加上顯示 class
    bottomCard.classList.remove('bottom-preview-hidden');
    bottomCard.classList.add('bottom-preview-visible');
}

// 🌟 新增：關閉手機版底部小卡的方法
export function hideBottomPreview() {
    const bottomCard = document.getElementById('bottom-preview-card');
    if (bottomCard) {
        bottomCard.classList.remove('bottom-preview-visible');
        bottomCard.classList.add('bottom-preview-hidden');
    }
}

// 掛載到全域，方便外部調用
if (typeof window !== 'undefined') {
    if(!window.rfApp) window.rfApp = {};
    if(!window.rfApp.ui) window.rfApp.ui = {};
    window.rfApp.ui.hideBottomPreview = hideBottomPreview;
    window.rfApp.ui.showBottomPreview = showBottomPreview;
}
