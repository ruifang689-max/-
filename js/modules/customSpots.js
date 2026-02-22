// js/modules/customSpots.js (v706) - 國際化翻譯與新地圖架構整合版
import { state, saveState } from '../core/store.js';
import { showCard } from './cards.js';

export function initCustomSpots() {
    window.rfApp = window.rfApp || {};
    window.rfApp.custom = window.rfApp.custom || {};
    
    // 取得翻譯輔助函數
    const getT = (key) => window.rfApp.t ? window.rfApp.t(key) : key;

    // 1. 綁定地圖長按事件 (新增景點)
    if (state.mapInstance) {
        state.mapInstance.on('contextmenu', function(e) {
            const lat = e.latlng.lat; 
            const lng = e.latlng.lng;
            
            // 顯示載入中的 Popup
            const loadingText = getT('locating_addr') || "獲取詳細地址中...";
            const tempPopup = L.popup({ closeButton: false, autoClose: false, offset: [0, -10] })
                .setLatLng(e.latlng)
                .setContent(`<div style='padding:8px; font-weight:bold; color:var(--primary); font-size:14px;'><i class='fas fa-spinner fa-spin'></i> ${loadingText}</div>`)
                .openOn(state.mapInstance);
            
            // 雙重 API 逆向地理編碼
            const primaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${state.currentLang || 'zh-TW'}&email=ruifang689@gmail.com`;
            const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${state.currentLang || 'zh-tw'}`;

            const showCustomModal = (addr) => {
                state.mapInstance.closePopup(tempPopup); 
                setTimeout(() => { 
                    state.tempCustomSpot = { lat, lng, addr }; 
                    const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                    
                    const btnCopy = getT('btn_copy') || '複製';
                    const btnNav = getT('btn_route') || '導航';
                    const btnShare = getT('btn_share') || '分享';

                    const addrHTML = `
                        <div style="font-weight: bold; font-size: 14px; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px;">
                            <i class="fas fa-map-marker-alt" style="color: var(--danger); margin-top: 4px; flex-shrink: 0;"></i>
                            <a href="${mapLink}" target="_blank" style="color: var(--text-main); text-decoration: underline dashed #aaa; text-underline-offset: 4px; flex: 1; word-break: break-all;">
                                ${addr}
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 12px 0;">
                        <div style="display: flex; gap: 6px;">
                            <button onclick="rfApp.custom.copyAddr('${addr}')" class="btn-sm-action" style="background: var(--primary);"><i class="fas fa-copy"></i> ${btnCopy}</button>
                            <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank'); rfApp.custom.closeCustomSpotModal();" class="btn-sm-action" style="background: #28a745;"><i class="fas fa-route"></i> ${btnNav}</button>
                            <button onclick="rfApp.custom.shareAddr('${addr}', '${mapLink}')" class="btn-sm-action" style="background: var(--accent);"><i class="fas fa-share-square"></i> ${btnShare}</button>
                        </div>
                    `;
                    const addrContainer = document.getElementById('custom-spot-addr');
                    if(addrContainer) addrContainer.innerHTML = addrHTML; 
                    
                    const nameInput = document.getElementById('custom-spot-name');
                    if(nameInput) nameInput.value = ""; 
                    
                    const m = document.getElementById('custom-spot-modal');
                    if(m) { m.classList.remove('u-hidden'); m.style.display = 'flex'; }
                }, 150);
            };

            const defaultSpotName = getT('custom_spot_default') || "瑞芳秘境";

            // 執行 API 請求
            fetch(primaryUrl).then(res => { if(!res.ok) throw new Error(); return res.json(); }).then(data => {
                let addr = defaultSpotName;
                if (data && data.address) {
                    const a = data.address;
                    const city = a.city || a.county || a.state || "";
                    const dist = a.town || a.suburb || a.district || "";
                    const village = a.village || a.hamlet || a.neighbourhood || "";
                    const road = a.road || a.pedestrian || "";
                    let houseNumber = a.house_number || "";
                    if (houseNumber && !houseNumber.includes('號')) houseNumber += '號';
                    const poi = a.amenity || a.building || a.shop || a.tourism || "";
                    
                    const parts = [city, dist].filter(Boolean);
                    const uniqueParts = [...new Set(parts)];
                    addr = `${uniqueParts.join('')}${village}${road}${houseNumber}`;
                    if (poi && !addr.includes(poi)) addr += ` (${poi})`;
                    if (!addr) addr = defaultSpotName;
                }
                showCustomModal(addr);
            }).catch(() => {
                fetch(fallbackUrl).then(res => res.json()).then(data => { 
                    let addr = defaultSpotName; 
                    if(data) {
                        let city = data.principalSubdivision || ""; let dist = data.city || ""; let village = data.locality || ""; let road = "";
                        // 解析 BigDataCloud
                        if (data.localityInfo) {
                            if (data.localityInfo.administrative) { const v = data.localityInfo.administrative.find(a => a.name.endsWith('里') || a.adminLevel === 10); if (v && v.name) village = v.name; }
                            if (data.localityInfo.informative) { const r = data.localityInfo.informative.find(i => i.name.endsWith('路') || i.name.endsWith('街') || i.name.endsWith('道') || i.description === 'road'); if (r && r.name) road = r.name; }
                        }
                        const parts = [city, dist].filter(Boolean); const uniqueParts = [...new Set(parts)];
                        addr = `${uniqueParts.join('')}${village}${road}` || defaultSpotName; 
                    }
                    showCustomModal(addr);
                }).catch(() => showCustomModal(defaultSpotName));
            });
        });
    }

    // --- 全域方法綁定 ---
    window.rfApp.custom.closeCustomSpotModal = () => { 
        const m = document.getElementById('custom-spot-modal'); 
        if(m) { m.style.display = 'none'; m.classList.add('u-hidden'); } 
    };
    
    // 儲存新增的景點
    window.rfApp.custom.confirmCustomSpot = () => { 
        const spotName = document.getElementById('custom-spot-name').value.trim() || (getT('my_secret_spot') || "我的秘境"); 
        if (state.tempCustomSpot) { 
            const newSpot = { 
                name: spotName, 
                lat: state.tempCustomSpot.lat, 
                lng: state.tempCustomSpot.lng, 
                tags: ["自訂"], 
                highlights: `${getT('addr_detail') || '詳細地址'}：${state.tempCustomSpot.addr}`, 
                food: "--", 
                history: getT('custom_tag') || "自訂標記", 
                transport: getT('self_transport') || "自行前往", 
                wikiImg: "" 
            }; 
            
            state.savedCustomSpots.push(newSpot); 
            // 🌟 觸發地圖重新過濾與繪製 (來自 main.js 的全域函數)
            if (typeof window.filterSpots === 'function') window.filterSpots('all', null);
            
            showCard(newSpot); 
            if (typeof window.showToast === 'function') window.showToast(getT('toast_custom_saved') || '已儲存自訂景點', 'success');
        } 
        window.rfApp.custom.closeCustomSpotModal(); 
    };

    window.rfApp.custom.copyAddr = (addr) => {
        navigator.clipboard.writeText(addr).then(() => {
            if (typeof window.showToast === 'function') window.showToast(getT('toast_copy_success') || '地址已複製', 'info');
        });
    };

    window.rfApp.custom.shareAddr = (addr, link) => {
        if(navigator.share){ navigator.share({title: getT('custom_spot_default') || '瑞芳秘境', text: addr, url: link}).catch(()=>{}); } 
    };
    
    // 開啟編輯視窗
    window.rfApp.custom.openEditModal = (name) => { 
        state.currentEditingSpotName = name; 
        const s = state.savedCustomSpots.find(x => x.name === name); 
        if(!s) return; 
        document.getElementById('edit-name').value = s.name; 
        document.getElementById('edit-highlights').value = s.highlights; 
        document.getElementById('edit-history').value = s.history; 
        
        const preview = document.getElementById('edit-image-preview');
        if(s.wikiImg) { 
            preview.style.display = 'block'; preview.src = s.wikiImg; 
        } else { 
            preview.style.display = 'none'; preview.src = ""; 
        }
        
        const m = document.getElementById('edit-modal-overlay'); 
        if(m) { m.classList.remove('u-hidden'); m.style.display = 'flex'; }
    };
    
    window.rfApp.custom.closeEditModal = () => { 
        const m = document.getElementById('edit-modal-overlay'); 
        if(m) { m.style.display = 'none'; m.classList.add('u-hidden'); } 
    };
    
    // 儲存編輯
    window.rfApp.custom.saveEditSpot = () => { 
        const newName = document.getElementById('edit-name').value.trim(); 
        if(!newName) return; 
        const savedIdx = state.savedCustomSpots.findIndex(x => x.name === state.currentEditingSpotName); 
        if(savedIdx === -1) return; 
        
        const s = state.savedCustomSpots[savedIdx]; 
        s.name = newName; 
        s.highlights = document.getElementById('edit-highlights').value; 
        s.history = document.getElementById('edit-history').value; 
        s.wikiImg = document.getElementById('edit-image-preview').src; 
        
        // Proxy 會自動存檔，我們只需觸發重繪
        if (typeof window.filterSpots === 'function') window.filterSpots('all', null);
        
        window.rfApp.custom.closeEditModal(); 
        showCard(s); 
        if (typeof window.showToast === 'function') window.showToast(getT('toast_custom_saved') || '已儲存', 'success');
    };
    
    // 刪除景點
    window.rfApp.custom.deleteCustomSpot = (name) => { 
        const msg = getT('confirm_delete') || `確定要刪除「${name}」？無法復原喔！`;
        if(!confirm(msg)) return; 
        
        const spotIndex = state.savedCustomSpots.findIndex(s => s.name === name); 
        if (spotIndex > -1) { 
            // 透過 splice 觸發 Proxy 自動存檔
            state.savedCustomSpots.splice(spotIndex, 1); 
        } 
        if (state.myFavs.includes(name)) { 
            state.myFavs = state.myFavs.filter(fav => fav !== name); 
        } 
        
        // 觸發重繪
        if (typeof window.filterSpots === 'function') window.filterSpots('all', null);
        if(typeof window.closeCard === 'function') window.closeCard(); 
        
        if (typeof window.showToast === 'function') window.showToast(getT('toast_custom_deleted') || '已刪除', 'info');
    };

    // 掛載給 HTML 呼叫
    window.closeCustomSpotModal = window.rfApp.custom.closeCustomSpotModal;
    window.confirmCustomSpot = window.rfApp.custom.confirmCustomSpot;
    window.openEditModal = window.rfApp.custom.openEditModal;
    window.closeEditModal = window.rfApp.custom.closeEditModal;
    window.saveEditSpot = window.rfApp.custom.saveEditSpot;
    window.deleteCustomSpot = window.rfApp.custom.deleteCustomSpot;

    // 加入內部小樣式
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-sm-action { flex: 1; padding: 8px 0; border: none; border-radius: 6px; color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s; }
        .btn-sm-action:active { transform: scale(0.95); opacity: 0.8; }
    `;
    document.head.appendChild(style);
}
