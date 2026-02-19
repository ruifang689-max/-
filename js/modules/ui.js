/**
 * js/modules/ui.js (v504)
 * 負責：UI 介面交互、設定、教學、PWA、收藏夾、自訂景點編輯
 */
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { translations } from '../data/lang.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';
import { triggerSearch } from './search.js';

export function initUI() {

    // =========================================
    // 1. 語言設定 (Language)
    // =========================================
    window.applyLanguage = (lang) => {
        state.currentLang = lang;
        localStorage.setItem('ruifang_lang', lang);
        const t = translations[lang] || translations['zh'];
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t[key];
                else {
                    const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/);
                    el.innerHTML = iconMatch ? iconMatch[0] + ' ' + t[key] : t[key];
                }
            }
        });

        const searchInput = document.getElementById('search');
        if(searchInput) searchInput.placeholder = t.search_ph;
        
        const addrText = document.getElementById('addr-text');
        if(addrText && addrText.innerText.includes("...")) addrText.innerText = t.locating;

        const startupSelect = document.getElementById('lang-select-startup');
        const settingsSelect = document.getElementById('lang-select-settings');
        if(startupSelect) startupSelect.value = lang;
        if(settingsSelect) settingsSelect.value = lang;

        if(state.targetSpot && document.getElementById("card").classList.contains("open")) {
            showCard(state.targetSpot);
        }
    };

    // =========================================
    // 2. 主題顏色 (Theme)
    // =========================================
    window.toggleThemeDropdown = () => {
        const list = document.getElementById('theme-options-list');
        if(list) list.classList.toggle('open');
    };

    // 點擊空白處自動關閉下拉選單 (支援多個客製化選單)
    document.addEventListener('click', (e) => {
        // 主題選單
        const themeWrapper = document.getElementById('theme-custom-select');
        const themeList = document.getElementById('theme-options-list');
        if (themeWrapper && !themeWrapper.contains(e.target) && themeList && themeList.classList.contains('open')) {
            themeList.classList.remove('open');
        }
        
        // 字體選單
        const fontWrapper = document.getElementById('font-custom-select');
        const fontList = document.getElementById('font-options-list');
        if (fontWrapper && !fontWrapper.contains(e.target) && fontList && fontList.classList.contains('open')) {
            fontList.classList.remove('open');
        }
    });
    
    window.selectThemeOption = (value, colorHex, text) => {
        const list = document.getElementById('theme-options-list');
        if(list) list.classList.remove('open');
        window.changeTheme(value);
    };

    // 🌟 1. 切換主題邏輯(藍色判斷)
    window.changeTheme = (color) => { 
        if (color === 'custom') { 
            document.getElementById('custom-color-picker').style.display = 'block'; 
            document.getElementById('custom-color-picker').click(); 
        } else if (color === 'default') {
            document.getElementById('custom-color-picker').style.display = 'none'; 
            window.applyCustomTheme('#007bff', false);
            localStorage.setItem('ruifang_theme', 'default');
        } else { 
            document.getElementById('custom-color-picker').style.display = 'none'; 
            window.applyCustomTheme(color, true);
        } 
    };

    // =========================================
    // 🌟 新增：字體選擇 (Font)
    // =========================================
    window.toggleFontDropdown = () => {
        const list = document.getElementById('font-options-list');
        if(list) list.classList.toggle('open');
    };

    window.selectFontOption = (value, text) => {
        const list = document.getElementById('font-options-list');
        if(list) list.classList.remove('open');
        window.changeFont(value, text);
    };

    window.changeFont = (fontValue, fontText) => {
        // 移除所有字體 Class
        document.body.classList.remove('font-iansui', 'font-huninn');
        
        // 加入對應的字體 Class
        if (fontValue === 'iansui') {
            document.body.classList.add('font-iansui');
        } else if (fontValue === 'huninn') {
            document.body.classList.add('font-huninn');
        }
        
        // 儲存設定
        localStorage.setItem('ruifang_font', fontValue);
        
        // 更新 UI 顯示文字
        const textSpan = document.getElementById('current-font-text');
        if (textSpan) textSpan.innerText = fontText || '系統預設 (黑體)';
    };

    // 🌟 2. 套用主題邏輯
    window.applyCustomTheme = (color, syncIntro = false) => { 
        document.documentElement.style.setProperty('--primary', color); 
        document.documentElement.style.setProperty('--logo-border', color); 
        
        // 核心動態邏輯判斷
        if (color === '#007bff' && !syncIntro) {
            // 【系統預設狀態】：
            // 主題色：藍色
            // 次標題：橘色
            // 下拉框外框：🌟 綠色 (#27ae60) <--- 這裡改成您指定的綠色！
            document.documentElement.style.setProperty('--accent', '#e67e22'); 
            document.documentElement.style.setProperty('--dynamic-border', '#27ae60'); 
        } else {
            // 【使用者換色狀態】：全部跟隨主題色
            document.documentElement.style.setProperty('--accent', color); 
            document.documentElement.style.setProperty('--dynamic-border', color); 
        }

        // 開幕動畫顏色同步邏輯
        if (syncIntro) {
            document.documentElement.style.setProperty('--intro-color', color);
            if(color !== '#007bff') localStorage.setItem('ruifang_theme', color); 
        } else {
            document.documentElement.style.setProperty('--intro-color', '#111111'); 
        }

        // 更新色塊 UI
        const colorSwatch = document.getElementById('current-theme-color');
        const textSpan = document.getElementById('current-theme-text');
        if (colorSwatch && textSpan) {
            colorSwatch.style.background = color;
            const themeMap = { '#007bff': '活力藍', '#333333': '極簡黑', '#28a745': '自然綠', '#27ae60': '森林綠', '#f39c12': '溫暖橘', '#e67e22': '夕陽橘', '#8e44ad': '神秘紫', '#e84393': '櫻花粉' };
            if (color === '#007bff' && !syncIntro) textSpan.innerText = '系統主題色 (預設)';
            else textSpan.innerText = themeMap[color] || `自訂顏色 (${color})`;
        }
    };

    // =========================================
    // 3. 畫面切換與基本按鈕 (修復卡在開幕畫面的關鍵)
    // =========================================
    window.enterMap = () => { 
        const welcome = document.getElementById('welcome-screen');
        const tutorial = document.getElementById('tutorial-overlay');
        if(welcome) welcome.style.opacity = '0'; 
        setTimeout(() => { 
            if(welcome) welcome.style.display = 'none'; 
            if(tutorial) {
                tutorial.style.display = 'flex'; 
                setTimeout(() => { tutorial.style.opacity = '1'; }, 50); 
            }
        }, 400); 
    };

    window.resetNorth = () => { state.mapInstance.flyTo([25.1032, 121.8224], 14); };
    window.goToStation = () => { state.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); };

    // =========================================
    // 4. 設定 Modal 與教學
    // =========================================
    window.openSettings = () => { document.getElementById('settings-modal-overlay').style.display = 'flex'; };
    window.closeSettings = () => { document.getElementById('settings-modal-overlay').style.display = 'none'; };
    window.toggleSkipIntro = (isChecked) => { localStorage.setItem('ruifang_skip_intro', isChecked ? 'true' : 'false'); };
    
    window.reopenTutorial = () => { 
        window.closeSettings(); 
        document.getElementById('tutorial-overlay').style.display = 'flex'; 
        setTimeout(() => { document.getElementById('tutorial-overlay').style.opacity = '1'; }, 50); 
        document.getElementById('tut-step-1').style.display = 'block'; 
        document.getElementById('tut-step-2').style.display = 'none'; 
    };
    
    window.nextTutorial = () => { document.getElementById('tut-step-1').style.display = 'none'; document.getElementById('tut-step-2').style.display = 'block'; };
    window.prevTutorial = () => { document.getElementById('tut-step-2').style.display = 'none'; document.getElementById('tut-step-1').style.display = 'block'; };
    window.finishTutorial = () => { 
        const tut = document.getElementById('tutorial-overlay');
        if(tut) tut.style.opacity = '0'; 
        setTimeout(() => { 
            if(tut) tut.style.display = 'none'; 
            localStorage.setItem('ruifang_welcomed', 'true'); 
            if (state.mapInstance) state.mapInstance.invalidateSize(); 
        }, 400); 
    };

    // =========================================
    // 5. PWA 安裝與分享
    // =========================================
    let deferredPrompt;
    const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const btn = document.getElementById('install-btn-container'); if(btn) btn.style.display = 'block'; });
    
    window.installPWA = () => {
        if (isIos() && !isStandalone()) { document.getElementById('ios-instruction-modal').style.display = 'flex'; window.closeSettings(); return; }
        if (!deferredPrompt) return; 
        document.getElementById('install-btn-container').style.display = 'none'; 
        deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    };
    window.closeIosInstruction = () => { document.getElementById('ios-instruction-modal').style.display = 'none'; };

    window.shareSpot = () => { 
        if(!state.targetSpot) return; 
        const spotUrl = new URL(window.location.href.split('?')[0]); spotUrl.searchParams.set('spot', state.targetSpot.name); 
        const shareData = { title: `瑞芳導覽 - ${state.targetSpot.name}`, text: `我在瑞芳發現了「${state.targetSpot.name}」！`, url: spotUrl.toString() }; 
        if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 已複製景點連結！')); 
    };
    window.shareAppMap = () => { 
        const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' }; 
        if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); 
    };

    // =========================================
    // 6. 收藏夾管理
    // =========================================
    window.toggleCurrentFav = () => { 
        if(!state.targetSpot) return; 
        const idx = state.myFavs.indexOf(state.targetSpot.name); 
        if(idx === -1) state.myFavs.push(state.targetSpot.name); else state.myFavs.splice(idx, 1); 
        saveState.favs(); 
        document.getElementById("card-fav-icon").className = state.myFavs.includes(state.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; 
    };
    window.toggleFavList = () => { 
        const p = document.getElementById("fav-list-panel"); 
        if(!p) return;
        if(p.style.display === "block") { p.style.display = "none"; } else { 
            p.innerHTML = ""; 
            if(state.myFavs.length === 0) { p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; } 
            else { 
                state.myFavs.forEach(name => { 
                    const div = document.createElement("div"); div.className = "list-item"; 
                    div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; 
                    div.onclick = () => { triggerSearch(name); p.style.display = "none"; }; 
                    p.appendChild(div); 
                }); 
            } 
            const manageBtn = document.createElement('div'); manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);"; manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾"; manageBtn.onclick = () => { p.style.display = "none"; window.openFavManage(); }; p.appendChild(manageBtn); p.style.display = "block"; 
        } 
    };
    window.openFavManage = () => { document.getElementById('fav-manage-modal').style.display = 'flex'; renderFavManageList(); };
    window.closeFavManage = () => { document.getElementById('fav-manage-modal').style.display = 'none'; };
    
    function renderFavManageList() { 
        const listEl = document.getElementById('fav-manage-list'); 
        if(!listEl) return;
        listEl.innerHTML = ''; 
        if (state.myFavs.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; return; } 
        state.myFavs.forEach((name, idx) => { 
            const item = document.createElement('div'); item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px;"; 
            item.innerHTML = `<span style="font-weight:bold; color:var(--text-main); font-size:14px;">${name}</span> <div style="display:flex; gap:6px;"> <button onclick="moveFav(${idx}, -1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button> <button onclick="moveFav(${idx}, 1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===state.myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button> <button onclick="removeFavManage('${name}')" style="padding:6px 10px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button> </div>`; 
            listEl.appendChild(item); 
        }); 
    }
    window.moveFav = (idx, dir) => { if (idx + dir < 0 || idx + dir >= state.myFavs.length) return; const temp = state.myFavs[idx]; state.myFavs[idx] = state.myFavs[idx + dir]; state.myFavs[idx + dir] = temp; saveState.favs(); renderFavManageList(); };
    window.removeFavManage = (name) => { state.myFavs = state.myFavs.filter(fav => fav !== name); saveState.favs(); renderFavManageList(); if (state.targetSpot && state.targetSpot.name === name) document.getElementById("card-fav-icon").className = "fas fa-heart"; };

    // =========================================
    // 7. 自訂景點編輯與新增
    // =========================================
    window.closeCustomSpotModal = () => { document.getElementById('custom-spot-modal').style.display = 'none'; };
    window.confirmCustomSpot = () => {
        const nameInput = document.getElementById('custom-spot-name').value.trim();
        const spotName = nameInput || "我的秘境";
        
        if (state.tempCustomSpot) {
            const newSpot = { name: spotName, lat: state.tempCustomSpot.lat, lng: state.tempCustomSpot.lng, tags: ["自訂"], highlights: `詳細地址：${state.tempCustomSpot.addr}`, food: "--", history: "自訂標記", transport: "自行前往", wikiImg: "" };
            state.savedCustomSpots.push(newSpot); saveState.customSpots(); addMarkerToMap(newSpot); showCard(newSpot);
        }
        window.closeCustomSpotModal();
    };

    window.openEditModal = (name) => { 
        state.currentEditingSpotName = name; 
        const s = state.savedCustomSpots.find(x => x.name === name); if(!s) return; 
        document.getElementById('edit-name').value = s.name; 
        document.getElementById('edit-highlights').value = s.highlights; 
        document.getElementById('edit-history').value = s.history; 
        document.getElementById('edit-image-preview').style.display = s.wikiImg ? "block" : "none"; 
        document.getElementById('edit-image-preview').src = s.wikiImg || ""; 
        document.getElementById('edit-modal-overlay').style.display = "flex"; 
    };
    window.closeEditModal = () => { document.getElementById('edit-modal-overlay').style.display = "none"; };
    
    const fileInput = document.getElementById('edit-image');
    if(fileInput) { 
        fileInput.addEventListener('change', function(e) { 
            const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); 
            reader.onload = event => { 
                const img = new Image(); 
                img.onload = () => { 
                    const canvas = document.createElement('canvas'); const scaleSize = 400 / img.width; canvas.width = 400; canvas.height = img.height * scaleSize; 
                    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
                    document.getElementById('edit-image-preview').src = canvas.toDataURL('image/jpeg', 0.7); 
                    document.getElementById('edit-image-preview').style.display = "block"; 
                }; 
                img.src = event.target.result; 
            }; 
            reader.readAsDataURL(file); 
        }); 
    }

    window.saveEditSpot = () => { 
        const newName = document.getElementById('edit-name').value.trim(); if(!newName) return alert("名稱不能為空！"); 
        const savedIdx = state.savedCustomSpots.findIndex(x => x.name === state.currentEditingSpotName); if(savedIdx === -1) return; 
        const s = state.savedCustomSpots[savedIdx]; 
        s.name = newName; s.highlights = document.getElementById('edit-highlights').value; 
        s.history = document.getElementById('edit-history').value; s.wikiImg = document.getElementById('edit-image-preview').src; 
        saveState.customSpots(); 
        if(s.markerObj) state.cluster.removeLayer(s.markerObj); 
        addMarkerToMap(s); window.closeEditModal(); showCard(s); 
    };

    window.deleteCustomSpot = (name) => { 
        if(!confirm(`確定要刪除「${name}」？無法復原喔！`)) return; 
        const spotIndex = state.savedCustomSpots.findIndex(s => s.name === name); 
        if (spotIndex > -1) { 
            if(state.savedCustomSpots[spotIndex].markerObj) state.cluster.removeLayer(state.savedCustomSpots[spotIndex].markerObj); 
            state.savedCustomSpots.splice(spotIndex, 1); saveState.customSpots(); 
        } 
        if (state.myFavs.includes(name)) { state.myFavs = state.myFavs.filter(fav => fav !== name); saveState.favs(); } 
        closeCard(); alert('🗑️ 標記已刪除！'); 
    };

    // =========================================
    // 8. 系統啟動套用設定
    // =========================================
    window.applyLanguage(state.currentLang);

    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { 
        window.applyCustomTheme('#007bff', false); 
    } else { 
        window.applyCustomTheme(savedTheme, true); 
    }
}

    // =========================================
    // 9. 🌟 系統啟動時的初始化 (Apply Init Config)
    // =========================================
    window.applyLanguage(state.currentLang);

    // 載入主題
    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { 
        window.applyCustomTheme('#007bff', false); 
    } else { 
        window.applyCustomTheme(savedTheme, true); 
    }

    // 🌟 載入字體
    const savedFont = localStorage.getItem('ruifang_font') || 'default';
    const fontMap = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'huninn': '粉圓' };
    window.changeFont(savedFont, fontMap[savedFont]);
