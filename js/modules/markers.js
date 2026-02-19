import { state } from '../core/store.js';
import { spots } from '../data/spots.js';
import { showCard, getPlaceholderImage } from './cards.js';

function calculateWalk(lat, lng) { if(!state.userPos) return "--"; const mins = Math.round(state.mapInstance.distance(state.userPos, [lat, lng]) / 80); return mins < 1 ? "1分內" : `約 ${mins} 分`; }

const createCustomPin = (tags, name) => { 
    let cls = 'fa-map-marker-alt', col = '#007bff'; 
    if (tags.includes('美食')) { cls = 'fa-utensils'; col = '#e67e22'; } else if (tags.includes('歷史')) { cls = 'fa-landmark'; col = '#8e44ad'; } else if (tags.includes('自然')) { cls = 'fa-leaf'; col = '#27ae60'; } else if (tags.includes('自訂')) { cls = 'fa-star'; col = '#ff4757'; } 
    return L.divIcon({ className: 'custom-pin-wrap', html: `<div class="gmap-pin" style="background-color:${col}"><i class="fas ${cls}"></i></div><div class="pin-label">${name}</div>`, iconSize: [32,32], iconAnchor: [16,16], popupAnchor: [0,-25] }); 
};

export function addMarkerToMap(s) {
    const queryTitle = s.wikiTitle !== undefined ? s.wikiTitle : s.name;
    
    // =========================================
    // 🌟 圖資庫邏輯：自建高清圖庫優先 -> 維基百科(強制放大版) -> 預設佔位圖
    // =========================================
    if (s.coverImg) {
        // 1. 如果有設定專屬高清圖，直接採用！
        s.wikiImg = s.coverImg; 
    } else if (!s.tags.includes('自訂') && !s.wikiImg && queryTitle !== "") { 
        // 2. 如果沒有，才去呼叫維基百科 API
        fetch(`https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryTitle)}`)
            .then(r => r.json())
            .then(d => { 
                let imgUrl = d.thumbnail?.source;
                if (imgUrl) {
                    // 🌟 畫質升級黑科技：維基預設給 320px，我們利用正則表達式，把網址裡的尺寸強制改成 640px！
                    imgUrl = imgUrl.replace(/\/\d+px-/, '/640px-');
                }
                s.wikiImg = imgUrl; 
            })
            .catch(() => {}); 
    }
    const m = L.marker([s.lat, s.lng], { icon: createCustomPin(s.tags, s.name) });
    m.bindPopup(() => {
        const img = s.wikiImg || getPlaceholderImage(s.name);
        const foodIcon = s.tags.includes('自訂') ? 'fa-star' : 'fa-utensils'; const foodText = s.tags.includes('自訂') ? '自訂地點' : `特色：${s.food || '--'}`;
        return `<div class="preview-card"><img class="preview-img" src="${img}" onerror="this.src='${getPlaceholderImage(s.name)}'"><div class="preview-info"><div class="preview-header"><span class="preview-title">${s.name}</span><span class="walk-badge"><i class="fas fa-walking"></i> ${calculateWalk(s.lat, s.lng)}</span></div><div class="preview-tag-box">${s.tags.map(t=>`<span class="mini-tag">${t}</span>`).join('')}</div><div class="food-preview"><i class="fas ${foodIcon}"></i> ${foodText}</div></div></div>`;
    }, { closeButton: false, offset: [0, -5] });

    m.on('mouseover', function() { this.openPopup(); }); m.on('mouseout', function() { this.closePopup(); }); 
    m.on('click', function(e) { L.DomEvent.stopPropagation(e); this.closePopup(); showCard(s); }); 
    s.markerObj = m; state.cluster.addLayer(m);
}

export function renderAllMarkers() {
    state.cluster.clearLayers();
    spots.forEach(addMarkerToMap); 
    state.savedCustomSpots.forEach(addMarkerToMap);
}
