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
