// js/modules/customSpots.js (加入本地圖片高壓縮與 Base64 轉換引擎)
import { state, saveState } from '../core/store.js';
import { addMarkerToMap } from './markers.js';
import { showCard } from './cards.js';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwqMFBi7x70o1xCOqg5ulyCVw118og5pAtJJk9eEq4NfFe23J56VeZiBLoTcXvYRPIZ/exec";

// ==========================================
// 🌟 核心壓縮引擎：將本機相片壓縮成輕量 Base64
// 預防 LocalStorage (5MB) 和 Firebase (1MB) 被原始照片塞爆
// ==========================================
function processImageFile(file, callback) {
    if (!file || !file.type.startsWith('image/')) {
        callback("");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600; // 壓縮至最大寬度 600px
            let width = img.width;
            let height = img.height;

            // 等比例縮放
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // 壓縮為 JPEG，品質 0.7，大幅降低容量 (通常只剩 50KB 左右)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

export function initCustomSpots() {
    // 🌟 攔截圖片選擇事件，並即時壓縮與預覽
    const handleImageInput = (inputId, previewId, stateKey) => {
        const inputEl = document.getElementById(inputId);
        // 確認輸入框是設定為檔案上傳類型
        if (inputEl && inputEl.type === 'file') {
            inputEl.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    processImageFile(file, (base64) => {
                        state[stateKey] = base64; // 將輕量代碼寫入暫存
                        const preview = document.getElementById(previewId);
                        if (preview) {
                            preview.src = base64;
                            preview.classList.remove('u-hidden');
                            preview.classList.add('u-block');
                        }
                    });
                }
            });
        }
    };

    // 綁定「新增景點」與「編輯景點」的圖片選擇器
    handleImageInput('custom-spot-img', 'add-image-preview', 'tempAddImageBase64');
    handleImageInput('edit-spot-img', 'edit-image-preview', 'tempEditImageBase64');

    if (state.mapInstance) {
        state.mapInstance.on('contextmenu', function(e) {
            const lat = e.latlng.lat; const lng = e.latlng.lng;
            const tempPopup = L.popup({ closeButton: false, autoClose: false, offset: [0, -10] })
                .setLatLng(e.latlng)
                .setContent("<div style='padding:8px; font-weight:bold; color:var(--primary); font-size:14px;'><i class='fas fa-spinner fa-spin'></i> 獲取詳細地址中...</div>")
                .openOn(state.mapInstance);
            
            const primaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`;
            const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-tw`;

            const showCustomModal = (addr) => {
                state.mapInstance.closePopup(tempPopup); 
                setTimeout(() => { 
                    state.tempCustomSpot = { lat, lng, addr }; 
                    const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                    const gmapNav = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                    
                    const addrHTML = `
                        <div style="font-weight: bold; font-size: 14px; line-height: 1.6; display: flex; align-items: flex-start; gap: 8px;">
                            <i class="fas fa-map-marker-alt" style="color: var(--danger); margin-top: 4px; flex-shrink: 0;"></i>
                            <a href="${mapLink}" target="_blank" style="color: var(--text-main); text-decoration: underline dashed #aaa; text-underline-offset: 4px; flex: 1; word-break: break-all;">
                                ${addr}
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 12px 0;">
                        <div style="display: flex; gap: 6px;">
                            <button onclick="rfApp.custom.copyAddr('${addr}')" style="flex: 1; padding: 8px 0; border: none; border-radius: 6px; background: var(--primary); color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;"><i class="fas fa-copy"></i> 複製</button>
                            <button onclick="if(typeof window.startNav === 'function') { window.startNav(${lat}, ${lng}); rfApp.custom.closeCustomSpotModal(); } else { window.open('${gmapNav}', '_blank'); }" style="flex: 1; padding: 8px 0; border: none; border-radius: 6px; background: #28a745; color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;"><i class="fas fa-route"></i> 導航</button>
                            <button onclick="rfApp.custom.shareAddr('${addr}', '${mapLink}')" style="flex: 1; padding: 8px 0; border: none; border-radius: 6px; background: var(--accent); color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;"><i class="fas fa-share-square"></i> 分享</button>
                        </div>
                    `;
                    const addrContainer = document.getElementById('custom-spot-addr');
                    if(addrContainer) addrContainer.innerHTML = addrHTML; 
                    const nameInput = document.getElementById('custom-spot-name');
                    if(nameInput) nameInput.value = ""; 

                    // 🌟 清空暫存，避免點選上一個景點的圖片殘留
                    state.tempAddImageBase64 = "";
                    const imgInput = document.getElementById('custom-spot-img');
                    if(imgInput) imgInput.value = "";
                    const addPreview = document.getElementById('add-image-preview');
                    if (addPreview) {
                        addPreview.removeAttribute('src');
                        addPreview.classList.remove('u-block');
                        addPreview.classList.add('u-hidden');
                    }

                    const m = document.getElementById('custom-spot-modal');
                    if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
                }, 150);
            };

            fetch(primaryUrl).then(res => { if(!res.ok) throw new Error(); return res.json(); }).then(data => {
                let addr = "瑞芳秘境";
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
                    let baseStr = uniqueParts.join('');
                    addr = `${baseStr}${village}${road}${houseNumber}`;
                    if (poi && !addr.includes(poi)) addr += ` (${poi})`;
                    if (!addr) addr = "瑞芳秘境";
                }
                showCustomModal(addr);
            }).catch(() => {
                fetch(fallbackUrl).then(res => res.json()).then(data => { 
                    let addr = "瑞芳秘境"; 
                    if(data) {
                        let city = data.principalSubdivision || ""; let dist = data.city || ""; let village = data.locality || ""; let road = "";
                        if (data.localityInfo) {
                            if (data.localityInfo.administrative) { const v = data.localityInfo.administrative.find(a => a.name.endsWith('里') || a.adminLevel === 10); if (v && v.name) village = v.name; }
                            if (data.localityInfo.informative) { const r = data.localityInfo.informative.find(i => i.name.endsWith('路') || i.name.endsWith('街') || i.name.endsWith('道') || i.description === 'road'); if (r && r.name) road = r.name; }
                        }
                        const parts = [city, dist].filter(Boolean); const uniqueParts = [...new Set(parts)];
                        addr = `${uniqueParts.join('')}${village}${road}` || "瑞芳秘境"; 
                    }
                    showCustomModal(addr);
                }).catch(() => showCustomModal("瑞芳秘境"));
            });
        });
    }

    window.rfApp.custom.closeCustomSpotModal = () => { const m = document.getElementById('custom-spot-modal'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };
    
    window.rfApp.custom.confirmCustomSpot = () => { 
        const spotName = document.getElementById('custom-spot-name').value.trim() || "我的秘境"; 
        const imgInput = document.getElementById('custom-spot-img');
        
        // 🌟 判斷優先權：如果有壓縮好的本機圖片，就用本機圖片；否則才檢查是否為文字網址
        let coverImgUrl = "";
        if (state.tempAddImageBase64) {
            coverImgUrl = state.tempAddImageBase64;
        } else if (imgInput && imgInput.type === 'text') {
            coverImgUrl = imgInput.value.trim();
        }

        let authCode = "";
        if (window.rfApp && window.rfApp.isDeveloper) {
            authCode = "689"; 
        }

        if (state.tempCustomSpot) { 
            const newSpot = { 
                name: spotName, 
                lat: state.tempCustomSpot.lat, 
                lng: state.tempCustomSpot.lng, 
                tags: ["自訂"], 
                highlights: `詳細地址：${state.tempCustomSpot.addr}`, 
                address: state.tempCustomSpot.addr, 
                food: "--", 
                history: "自訂標記", 
                transport: "自行前往", 
                coverImg: coverImgUrl,
                wikiImg: coverImgUrl, 
                authCode: authCode 
            };
            
            state.savedCustomSpots.push(newSpot); 
            if (typeof saveState !== 'undefined') saveState.customSpots(); 
            addMarkerToMap(newSpot); 
            showCard(newSpot); 
            
            if (typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_custom_saved'), 'success');

            if (authCode && GAS_WEB_APP_URL && GAS_WEB_APP_URL.includes('script.google.com')) {
                if (typeof window.showToast === 'function') window.showToast('正在驗證並同步至官方雲端...', 'info');

                fetch(GAS_WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(newSpot)
                });
            }
        } 
        window.rfApp.custom.closeCustomSpotModal(); 
    };

    window.rfApp.custom.copyAddr = (addr) => {
        navigator.clipboard.writeText(addr).then(() => {
            if (typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_copy_success'), 'info');
        });
    };

    window.rfApp.custom.shareAddr = (addr, link) => {
        if(navigator.share){ navigator.share({title:'瑞芳秘境', text:addr, url:link}).catch(()=>{}); } 
    };
    
    window.rfApp.custom.openEditModal = (name) => { 
        state.currentEditingSpotName = name; 
        const s = state.savedCustomSpots.find(x => x.name === name); 
        if(!s) return; 
        
        document.getElementById('edit-name').value = s.name; 
        document.getElementById('edit-highlights').value = s.highlights; 
        document.getElementById('edit-history').value = s.history; 
        const preview = document.getElementById('edit-image-preview');
        
        const imgUrl = s.wikiImg || s.coverImg || "";
        if(imgUrl) { 
            preview.classList.remove('u-hidden'); 
            preview.classList.add('u-block'); 
            preview.src = imgUrl; 
        } else { 
            preview.classList.remove('u-block'); 
            preview.classList.add('u-hidden'); 
            preview.removeAttribute('src'); 
        }
        
        const devUploadBtn = document.getElementById('dev-upload-btn');
        if (devUploadBtn) {
            devUploadBtn.style.display = (window.rfApp && window.rfApp.isDeveloper) ? 'block' : 'none';
        }

        const m = document.getElementById('edit-modal-overlay'); 
        if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
    };
    
    window.rfApp.custom.closeEditModal = () => { const m = document.getElementById('edit-modal-overlay'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };
    
    window.rfApp.custom.saveEditSpot = () => { 
        const newName = document.getElementById('edit-name').value.trim(); 
        if(!newName) return; 
        const savedIdx = state.savedCustomSpots.findIndex(x => x.name === state.currentEditingSpotName); 
        if(savedIdx === -1) return; 
        
        const s = state.savedCustomSpots[savedIdx]; 
        s.name = newName; 
        s.highlights = document.getElementById('edit-highlights').value; 
        s.history = document.getElementById('edit-history').value; 
        
        const preview = document.getElementById('edit-image-preview');
        const finalImgUrl = preview.classList.contains('u-hidden') ? "" : (preview.getAttribute('src') || "");
        
        s.wikiImg = finalImgUrl; 
        s.coverImg = finalImgUrl; 
        
        if (typeof saveState !== 'undefined') saveState.customSpots(); 
        if(s.markerObj) state.cluster.removeLayer(s.markerObj); 
        
        addMarkerToMap(s); window.rfApp.custom.closeEditModal(); showCard(s); 
        if (typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_custom_saved'), 'success');
    };
    
    window.rfApp.custom.deleteCustomSpot = (name) => { 
        if(!confirm(`確定要刪除「${name}」？無法復原喔！`)) return; 
        const spotIndex = state.savedCustomSpots.findIndex(s => s.name === name); 
        if (spotIndex > -1) { 
            if(state.savedCustomSpots[spotIndex].markerObj) state.cluster.removeLayer(state.savedCustomSpots[spotIndex].markerObj); 
            state.savedCustomSpots.splice(spotIndex, 1); 
            if (typeof saveState !== 'undefined') saveState.customSpots(); 
        } 
        if (state.myFavs.includes(name)) { 
            state.myFavs = state.myFavs.filter(fav => fav !== name); 
            if (typeof saveState !== 'undefined') saveState.favs(); 
        } 
        if(typeof window.closeCard === 'function') window.closeCard(); 
        if (typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_custom_deleted'), 'info');
    };

    window.rfApp.custom.uploadEditToCloud = () => {
        if (typeof window.showToast === 'function') {
            window.showToast("準備將修改同步至雲端...", "info");
        }
    };
    
    window.uploadEditToCloud = window.rfApp.custom.uploadEditToCloud;
    window.closeCustomSpotModal = window.rfApp.custom.closeCustomSpotModal;
    window.confirmCustomSpot = window.rfApp.custom.confirmCustomSpot;
    window.openEditModal = window.rfApp.custom.openEditModal;
    window.closeEditModal = window.rfApp.custom.closeEditModal;
    window.saveEditSpot = window.rfApp.custom.saveEditSpot;
    window.deleteCustomSpot = window.rfApp.custom.deleteCustomSpot;
}
