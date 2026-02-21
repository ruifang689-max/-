/**
 * js/modules/ui.js
 * 負責：UI 交互、主題、字體、導覽流程、功能列收展 (狀態驅動版)
 */
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { translations } from '../data/lang.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';
import { triggerSearch } from './search.js';

export function initPanelGestures() {}

export function initUI() {

    // 🌟 狀態驅動：進入地圖
    window.enterMap = () => { 
        ['intro', 'welcome-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('u-fade-out');
                setTimeout(() => el.classList.add('u-hidden'), 400); 
            }
        });

        const functionPanel = document.getElementById("side-function-zone");
        if(functionPanel) {
            functionPanel.classList.remove("collapsed", "u-hidden");
            functionPanel.classList.add("u-flex");
        }
        
        const sug = document.getElementById("suggest");
        if(sug) sug.classList.add("u-hidden");
        if (typeof window.closeCard === 'function') window.closeCard();

        setTimeout(() => { 
            const skipTour = localStorage.getItem('rf_skip_tour') === 'true';
            const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';
            if (!skipTour) window.startFeatureTour();
            else if (!skipTutorial) window.startTutorialOverlay();
        }, 400); 
    };

    window.toggleSidePanel = () => {
        const targetPanel = document.getElementById("side-function-zone");
        const icon = document.getElementById("side-panel-icon");
        if (targetPanel) {
            targetPanel.classList.toggle("collapsed");
            if (icon) {
                icon.className = targetPanel.classList.contains("collapsed") ? "fas fa-angle-double-left" : "fas fa-angle-double-right";
            }
        }
    };

    // 🌟 狀態驅動：下拉選單
    window.toggleDropdown = (listId) => {
        document.querySelectorAll('.custom-select-options').forEach(list => { 
            if (list.id !== listId) list.classList.add('u-hidden'); 
            list.classList.remove('u-flex');
        });
        const targetList = document.getElementById(listId); 
        if(targetList) {
            if (targetList.classList.contains('u-hidden') || targetList.style.display === 'none' || !targetList.classList.contains('u-flex')) {
                targetList.classList.remove('u-hidden');
                targetList.classList.add('u-flex');
            } else {
                targetList.classList.remove('u-flex');
                targetList.classList.add('u-hidden');
            }
        }
    };
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) { 
            document.querySelectorAll('.custom-select-options').forEach(list => {
                list.classList.remove('u-flex');
                list.classList.add('u-hidden');
            });
        }
    });

    window.applyLanguage = (lang) => {
        state.currentLang = lang; localStorage.setItem('ruifang_lang', lang); const t = translations[lang] || translations['zh'];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t[key];
                else { const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/); el.innerHTML = iconMatch ? iconMatch[0] + ' ' + t[key] : t[key]; }
            }
        });
        const langMap = { 'zh': '繁體中文 (🇹🇼)', 'en': 'English (🇺🇸)', 'ja': '日本語 (🇯🇵)', 'ko': '한국어 (🇰🇷)', 'vi': 'Tiếng Việt (🇻🇳)' };
        if(document.getElementById('current-lang-text-startup')) document.getElementById('current-lang-text-startup').innerText = langMap[lang] || langMap['zh'];
        if(document.getElementById('current-lang-text-settings')) document.getElementById('current-lang-text-settings').innerText = langMap[lang] || langMap['zh'];
        if(state.targetSpot && document.getElementById("card").classList.contains("open")) showCard(state.targetSpot);
    };
    
    window.selectLangOption = (lang) => { 
        document.querySelectorAll('.custom-select-options').forEach(el => { el.classList.remove('u-flex'); el.classList.add('u-hidden'); }); 
        window.applyLanguage(lang); 
    };
    
    window.selectThemeOption = (value, colorHex, text) => { 
        const list = document.getElementById('theme-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.changeTheme(value); 
    };
    
    window.changeTheme = (color) => { 
        const picker = document.getElementById('custom-color-picker');
        if (color === 'custom') { if(picker) { picker.classList.remove('u-hidden'); picker.classList.add('u-block'); picker.click(); } } 
        else if (color === 'default') { if(picker) picker.classList.add('u-hidden'); window.applyCustomTheme('#007bff', false); localStorage.setItem('ruifang_theme', 'default'); } 
        else { if(picker) picker.classList.add('u-hidden'); window.applyCustomTheme(color, true); } 
    };
    
    window.applyCustomTheme = (color, syncIntro = false) => { 
        document.documentElement.style.setProperty('--primary', color); 
        document.documentElement.style.setProperty('--logo-border', color); 
        if (color === '#007bff' && !syncIntro) { 
            document.documentElement.style.setProperty('--accent', '#e67e22'); 
            document.documentElement.style.setProperty('--dynamic-border', 'var(--text-main)'); 
            // 🌟 預設藍色主題時，印章保持經典的紅色與紅光暈
            document.documentElement.style.setProperty('--stamp-active', 'var(--danger)'); 
        } else { 
            document.documentElement.style.setProperty('--accent', color); 
            document.documentElement.style.setProperty('--dynamic-border', color); 
            // 🌟 切換其他自訂主題時，印章與光暈跟著變色
            document.documentElement.style.setProperty('--stamp-active', color); 
        }
        
        if (syncIntro) { 
            document.documentElement.style.setProperty('--intro-color', color); 
            if(color !== '#007bff') localStorage.setItem('ruifang_theme', color); 
        } else { 
            document.documentElement.style.setProperty('--intro-color', '#111111'); 
        }
        
        const colorSwatch = document.getElementById('current-theme-color'); 
        const textSpan = document.getElementById('current-theme-text');
        if (colorSwatch && textSpan) {
            colorSwatch.style.background = color;
            const themeMap = { '#007bff': '活力藍', '#34495e': '夜幕藍', '#333333': '極簡黑', '#95a5a6': '現代灰', '#28a745': '自然綠', '#27ae60': '森林綠', '#f39c12': '溫暖橘', '#e67e22': '夕陽橘', '#FF0000': '喜慶紅', '#f1c40f': '陽光黃', '#8e44ad': '神秘紫', '#e84393': '櫻花粉' };
            if (color === '#007bff' && !syncIntro) textSpan.innerText = '系統主題色 (預設)'; 
            else textSpan.innerText = themeMap[color] || `自訂顏色 (${color})`;
        }
    };

    window.selectFontOption = (value, text) => { 
        const list = document.getElementById('font-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.changeFont(value, text); 
    };
    
    window.changeFont = (fontValue, fontText) => {
        document.body.classList.remove('font-iansui', 'font-wenkai', 'font-huninn');
        if (fontValue === 'iansui') document.body.classList.add('font-iansui');
        else if (fontValue === 'wenkai') document.body.classList.add('font-wenkai');
        else if (fontValue === 'huninn') document.body.classList.add('font-huninn');
        localStorage.setItem('ruifang_font', fontValue);
        if (document.getElementById('current-font-text')) document.getElementById('current-font-text').innerText = fontText || '系統預設 (黑體)';
    };

    window.saveSkipSettings = () => {
        localStorage.setItem('rf_skip_anim', document.getElementById('toggle-skip-anim').checked);
        localStorage.setItem('rf_skip_welcome', document.getElementById('toggle-skip-welcome').checked);
        localStorage.setItem('rf_skip_tour', document.getElementById('toggle-skip-tour').checked);
        localStorage.setItem('rf_skip_tutorial', document.getElementById('toggle-skip-tutorial').checked);
    };

    window.loadSkipSettings = () => {
        const skipAnim = localStorage.getItem('rf_skip_anim') === 'true';
        const skipWelcome = localStorage.getItem('rf_skip_welcome') === 'true';
        const skipTour = localStorage.getItem('rf_skip_tour') === 'true';
        const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';

        if(document.getElementById('toggle-skip-anim')) document.getElementById('toggle-skip-anim').checked = skipAnim;
        if(document.getElementById('toggle-skip-welcome')) document.getElementById('toggle-skip-welcome').checked = skipWelcome;
        if(document.getElementById('toggle-skip-tour')) document.getElementById('toggle-skip-tour').checked = skipTour;
        if(document.getElementById('toggle-skip-tutorial')) document.getElementById('toggle-skip-tutorial').checked = skipTutorial;

        if (skipAnim) { 
            const anim = document.getElementById('intro-animation') || document.querySelector('.intro-overlay'); 
            if (anim) { anim.classList.add('u-hidden', 'u-fade-out'); } 
        }
        if (skipWelcome) {
            const welcome = document.getElementById('welcome-screen');
            if (welcome) { welcome.classList.add('u-hidden', 'u-fade-out'); }
            if (!skipTour) setTimeout(window.startFeatureTour, 500);
            else if (!skipTutorial) setTimeout(window.startTutorialOverlay, 500);
        }
    };

    // =========================================
    // 🌟 狀態驅動：功能指引 (Feature Tour)
    // =========================================
    let currentTourStep = 0;
    const tourSteps = [
        { target: '#search', text: '🔍 <b style="color:var(--primary); font-size:16px;">搜尋景點</b><br>在這裡輸入關鍵字，可以快速尋找景點與秘境！', pos: 'bottom' },
        { target: '#category-chips', text: '🏷️ <b style="color:var(--primary); font-size:16px;">分類標籤</b><br>左右滑動並點擊標籤，地圖會瞬間為您過濾出想去的類型！', pos: 'bottom' },
        { target: 'button[onclick="openSettings()"]', text: '⚙️ <b style="color:var(--primary); font-size:16px;">系統設定</b><br>從這裡可以管理收藏夾、切換語言、更改主題顏色與字體喔！', pos: 'top' },
        { target: 'center', text: '🗺️ <b style="color:var(--primary); font-size:16px;">探索地圖</b><br>💡 <b>隱藏技巧</b>：長按地圖任一處，還能新增專屬的自訂景點！', pos: 'center' }
    ];

    window.startFeatureTour = () => { 
        const overlay = document.getElementById('tour-overlay');
        if(overlay) { overlay.classList.remove('u-hidden'); overlay.classList.add('u-block'); }
        currentTourStep = 0; window.showTourStep(); 
    };

    window.showTourStep = () => {
        if(currentTourStep >= tourSteps.length) { window.endTour(); return; }
        const step = tourSteps[currentTourStep]; 
        const ring = document.getElementById('tour-focus-ring'); 
        const tooltip = document.getElementById('tour-tooltip');
        
        document.getElementById('tour-text').innerHTML = step.text;
        document.getElementById('tour-next-btn').innerText = (currentTourStep === tourSteps.length - 1) ? '開始探索！' : '下一步';

        if (step.target !== 'center') {
            const targetEl = document.querySelector(step.target);
            if(targetEl) {
                const rect = targetEl.getBoundingClientRect(); const pad = 6;
                ring.classList.remove('u-hidden'); ring.classList.add('u-block'); 
                ring.style.top = (rect.top - pad) + 'px'; ring.style.left = (rect.left - pad) + 'px'; 
                ring.style.width = (rect.width + pad*2) + 'px'; ring.style.height = (rect.height + pad*2) + 'px'; 
                ring.style.borderRadius = window.getComputedStyle(targetEl).borderRadius; ring.style.border = '3px solid var(--primary)';
                
                tooltip.style.left = '50%'; tooltip.style.transform = 'translateX(-50%)';
                if(step.pos === 'bottom') { tooltip.style.top = (rect.bottom + pad + 15) + 'px'; tooltip.style.bottom = 'auto'; } 
                else if(step.pos === 'top') { tooltip.style.bottom = (window.innerHeight - rect.top + pad + 15) + 'px'; tooltip.style.top = 'auto'; }
            }
        } else {
            ring.classList.remove('u-hidden'); ring.classList.add('u-block'); 
            ring.style.top = '50%'; ring.style.left = '50%'; ring.style.width = '0px'; ring.style.height = '0px'; ring.style.border = 'none';
            tooltip.style.top = '50%'; tooltip.style.left = '50%'; tooltip.style.transform = 'translate(-50%, -50%)'; tooltip.style.bottom = 'auto';
        }
    };

    window.nextTourStep = () => { currentTourStep++; window.showTourStep(); };

    window.endTour = () => {
        const overlay = document.getElementById('tour-overlay');
        const ring = document.getElementById('tour-focus-ring');
        
        // 🌟 徹底清除顯示狀態，再掛上隱藏
        if(overlay) { overlay.classList.remove('u-block'); overlay.classList.add('u-hidden'); }
        if(ring) { ring.classList.remove('u-block'); ring.classList.add('u-hidden'); }
        
        localStorage.setItem('rf_skip_tour', 'true');
        const toggleTour = document.getElementById('toggle-skip-tour');
        if(toggleTour) toggleTour.checked = true;
        
        const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';
        if (!skipTutorial) {
            // 🌟 延遲 300 毫秒再開啟黑底說明，避免畫面重疊衝突
            setTimeout(() => window.startTutorialOverlay(), 300);
        }
    };

    // =========================================
    // 🌟 狀態驅動：教學說明 (Tutorial Overlay)
    // =========================================
    window.startTutorialOverlay = () => {
        const tutorial = document.getElementById('tutorial-overlay');
        if(tutorial) {
            tutorial.classList.remove('u-hidden', 'u-fade-out');
            tutorial.classList.add('u-flex'); 
            setTimeout(() => { tutorial.classList.add('u-fade-in'); }, 50); 
            
            const step1 = document.getElementById('tut-step-1');
            const step2 = document.getElementById('tut-step-2');
            if (step1) { step1.classList.remove('u-hidden'); step1.classList.add('u-block'); }
            if (step2) { step2.classList.remove('u-block'); step2.classList.add('u-hidden'); }
        }
    };

    window.nextTutorial = () => { 
        const step1 = document.getElementById('tut-step-1');
        const step2 = document.getElementById('tut-step-2');
        if(step1) { step1.classList.remove('u-block'); step1.classList.add('u-hidden'); }
        if(step2) { step2.classList.remove('u-hidden'); step2.classList.add('u-block'); }
    };

    window.prevTutorial = () => { 
        const step1 = document.getElementById('tut-step-1');
        const step2 = document.getElementById('tut-step-2');
        if(step2) { step2.classList.remove('u-block'); step2.classList.add('u-hidden'); }
        if(step1) { step1.classList.remove('u-hidden'); step1.classList.add('u-block'); }
    };

    window.finishTutorial = () => { 
        const tut = document.getElementById('tutorial-overlay');
        if(tut) {
            tut.classList.remove('u-fade-in');
            tut.classList.add('u-fade-out'); 
            setTimeout(() => { 
                // 🌟 徹底清除 flex 狀態
                tut.classList.remove('u-flex', 'u-fade-out'); 
                tut.classList.add('u-hidden'); 
                
                localStorage.setItem('rf_skip_tutorial', 'true');
                const toggleTut = document.getElementById('toggle-skip-tutorial');
                if(toggleTut) toggleTut.checked = true;
                
                if (state.mapInstance) state.mapInstance.invalidateSize(); 
            }, 400); 
        }
    };

    window.reopenTutorial = () => { 
        window.closeSettings(); 
        localStorage.setItem('rf_skip_tour', 'false'); 
        localStorage.setItem('rf_skip_tutorial', 'false');
        
        const toggleTour = document.getElementById('toggle-skip-tour');
        const toggleTut = document.getElementById('toggle-skip-tutorial');
        if(toggleTour) toggleTour.checked = false;
        if(toggleTut) toggleTut.checked = false;
        
        // 確保黑底說明確實關閉後，再啟動導覽
        const tut = document.getElementById('tutorial-overlay');
        if(tut) { tut.classList.remove('u-flex', 'u-block'); tut.classList.add('u-hidden'); }
        
        setTimeout(() => window.startFeatureTour(), 300); 
    };

    // 🌟 指北針按鈕：只要回到預設視角就好
    window.resetNorth = () => { 
        state.mapInstance.flyTo([25.1032, 121.8224], 14); 
    };

    // 🌟 瑞芳中心按鈕：這裡才是「瑞」字蓋章動畫的觸發點！
    window.goToStation = () => { 
        state.mapInstance.flyTo([25.108, 121.805], 16); 
        closeCard(); 
        
        const ruiBtn = document.querySelector('.rui-icon');
        if (ruiBtn) {
            ruiBtn.classList.remove('stamped');
            // 魔法技巧：強制重繪
            void ruiBtn.offsetWidth; 
            ruiBtn.classList.add('stamped');
        }
    };
    
    // 🌟 狀態驅動：設定視窗
    window.openSettings = () => { 
        const m = document.getElementById('settings-modal-overlay');
        if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
    };
    window.closeSettings = () => { 
        const m = document.getElementById('settings-modal-overlay');
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); }
    };

    let deferredPrompt; const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const btn = document.getElementById('install-btn-container'); if(btn) { btn.classList.remove('u-hidden'); btn.classList.add('u-block'); } });
    window.installPWA = () => { if (isIos() && !isStandalone()) { document.getElementById('ios-instruction-modal').classList.remove('u-hidden'); document.getElementById('ios-instruction-modal').classList.add('u-flex'); window.closeSettings(); return; } if (!deferredPrompt) return; document.getElementById('install-btn-container').classList.add('u-hidden'); deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); };
    window.closeIosInstruction = () => { document.getElementById('ios-instruction-modal').classList.remove('u-flex'); document.getElementById('ios-instruction-modal').classList.add('u-hidden'); };
    window.shareSpot = () => { if(!state.targetSpot) return; const spotUrl = new URL(window.location.href.split('?')[0]); spotUrl.searchParams.set('spot', state.targetSpot.name); const shareData = { title: `瑞芳導覽 - ${state.targetSpot.name}`, text: `我在瑞芳發現了「${state.targetSpot.name}」！`, url: spotUrl.toString() }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 已複製景點連結！')); };
    window.shareAppMap = () => { const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' }; if (navigator.share) navigator.share(shareData).catch(()=>{}); else navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); };

    // 🌟 狀態驅動：收藏與自訂表單
    window.toggleCurrentFav = () => { if(!state.targetSpot) return; const idx = state.myFavs.indexOf(state.targetSpot.name); if(idx === -1) state.myFavs.push(state.targetSpot.name); else state.myFavs.splice(idx, 1); saveState.favs(); document.getElementById("card-fav-icon").className = state.myFavs.includes(state.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; };
    window.toggleFavList = () => { const p = document.getElementById("fav-list-panel"); if(!p) return; if(p.classList.contains('u-block')) { p.classList.remove('u-block'); p.classList.add('u-hidden'); } else { p.innerHTML = ""; if(state.myFavs.length === 0) { p.innerHTML = `<div style="padding:15px; text-align:center; color:#888; font-size:13px;">尚無收藏景點<br>點擊卡片愛心加入！</div>`; } else { state.myFavs.forEach(name => { const div = document.createElement("div"); div.className = "list-item"; div.innerHTML = `<span><i class="fas fa-heart" style="color:var(--danger); margin-right:5px;"></i> ${name}</span>`; div.onclick = () => { triggerSearch(name); p.classList.remove('u-block'); p.classList.add('u-hidden'); }; p.appendChild(div); }); } const manageBtn = document.createElement('div'); manageBtn.style.cssText = "padding:14px; text-align:center; background:var(--divider-color); font-weight:bold; cursor:pointer; font-size:13px; color:var(--primary);"; manageBtn.innerHTML = "<i class='fas fa-cog'></i> 管理收藏夾"; manageBtn.onclick = () => { p.classList.remove('u-block'); p.classList.add('u-hidden'); window.openFavManage(); }; p.appendChild(manageBtn); p.classList.remove('u-hidden'); p.classList.add('u-block'); } };
    
    window.openFavManage = () => { const m = document.getElementById('fav-manage-modal'); if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); renderFavManageList(); } };
    window.closeFavManage = () => { const m = document.getElementById('fav-manage-modal'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };
    function renderFavManageList() { const listEl = document.getElementById('fav-manage-list'); if(!listEl) return; listEl.innerHTML = ''; if (state.myFavs.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#888;">目前無收藏景點</p>'; return; } state.myFavs.forEach((name, idx) => { const item = document.createElement('div'); item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--glass); border:1px solid var(--border-color); border-radius:8px;"; item.innerHTML = `<span style="font-weight:bold; color:var(--text-main); font-size:14px;">${name}</span> <div style="display:flex; gap:6px;"> <button onclick="moveFav(${idx}, -1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===0?'disabled':''}><i class="fas fa-arrow-up"></i></button> <button onclick="moveFav(${idx}, 1)" style="padding:6px 10px; cursor:pointer; background:var(--divider-color); border:none; border-radius:6px; color:var(--text-main);" ${idx===state.myFavs.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button> <button onclick="removeFavManage('${name}')" style="padding:6px 10px; background:var(--danger); color:white; cursor:pointer; border:none; border-radius:6px;"><i class="fas fa-trash"></i></button> </div>`; listEl.appendChild(item); }); }
    window.moveFav = (idx, dir) => { if (idx + dir < 0 || idx + dir >= state.myFavs.length) return; const temp = state.myFavs[idx]; state.myFavs[idx] = state.myFavs[idx + dir]; state.myFavs[idx + dir] = temp; saveState.favs(); renderFavManageList(); };
    window.removeFavManage = (name) => { state.myFavs = state.myFavs.filter(fav => fav !== name); saveState.favs(); renderFavManageList(); if (state.targetSpot && state.targetSpot.name === name) document.getElementById("card-fav-icon").className = "fas fa-heart"; };

    if (state.mapInstance) {
        state.mapInstance.on('contextmenu', function(e) {
            const lat = e.latlng.lat; const lng = e.latlng.lng;
            const tempPopup = L.popup({ closeButton: false, autoClose: false, offset: [0, -10] }).setLatLng(e.latlng).setContent("<div style='padding:8px; font-weight:bold; color:var(--primary); font-size:14px;'><i class='fas fa-spinner fa-spin'></i> 獲取詳細地址中...</div>").openOn(state.mapInstance);
            
            const primaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`;
            const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-tw`;

            const showCustomModal = (addr) => {
                state.mapInstance.closePopup(tempPopup); 
                setTimeout(() => { 
                    state.tempCustomSpot = { lat, lng, addr }; 
                    
                    // 🌟 強化版 UI：完美凸排、虛線超連結、三顆滿版快捷按鈕
                    const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                    const addrHTML = `
                        <div style="margin-bottom: 12px; font-weight: bold; font-size: 14px; line-height: 1.5; display: flex; align-items: flex-start; gap: 8px;">
                            <i class="fas fa-map-marker-alt" style="color: var(--danger); margin-top: 4px; flex-shrink: 0;"></i>
                            <a href="${mapLink}" target="_blank" style="color: var(--text-main); text-decoration: none; border-bottom: 1px dashed #888; padding-bottom: 2px; flex: 1; word-break: break-all;">
                                ${addr}
                            </a>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button onclick="navigator.clipboard.writeText('${addr}').then(() => alert('✅ 地址已複製！'))" style="flex: 1; padding: 8px 0; border: none; border-radius: 6px; background: var(--primary); color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                                <i class="fas fa-copy"></i> 複製
                            </button>
                            <button onclick="window.open('${mapLink}', '_blank')" style="flex: 1; padding: 8px 0; border: none; border-radius: 6px; background: #28a745; color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                                <i class="fas fa-map-marked-alt"></i> 導航
                            </button>
                            <button onclick="if(navigator.share){ navigator.share({title:'瑞芳秘境', text:'${addr}', url:'${mapLink}'}).catch(()=>{}) } else { alert('您的瀏覽器不支援分享功能'); }" style="flex: 1; padding: 8px 0; border: none; border-radius: 6px; background: var(--accent); color: white; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'">
                                <i class="fas fa-share-square"></i> 分享
                            </button>
                        </div>
                    `;
                    
                    document.getElementById('custom-spot-addr').innerHTML = addrHTML; 
                    document.getElementById('custom-spot-name').value = ""; 
                    const m = document.getElementById('custom-spot-modal');
                    if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
                }, 150);
            };

            // 🌟 1. 先嘗試 OSM，獲取精確到「路、巷、號、地標」的地址
            fetch(primaryUrl)
            .then(res => { if(!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                let addr = "瑞芳秘境";
                if (data && data.address) {
                    const a = data.address;
                    const city = a.city || a.county || a.state || "";
                    const dist = a.town || a.suburb || a.district || "";
                    const village = a.village || a.hamlet || a.neighbourhood || "";
                    const road = a.road || a.pedestrian || "";
                    
                    // 🌟 修正「號號」問題：自動判斷是否已包含「號」字
                    let houseNumber = a.house_number || "";
                    if (houseNumber && !houseNumber.includes('號')) houseNumber += '號';

                    const poi = a.amenity || a.building || a.shop || a.tourism || "";

                    const parts = [city, dist].filter(Boolean);
                    const uniqueParts = [...new Set(parts)];
                    let baseStr = uniqueParts.join('');

                    // 🌟 完美組合出：新北市瑞芳區明燈路三段65號 (瑞芳車站)
                    addr = `${baseStr}${village}${road}${houseNumber}`;
                    if (poi && !addr.includes(poi)) addr += ` (${poi})`;
                    if (!addr) addr = "瑞芳秘境";
                }
                showCustomModal(addr);
            })
            .catch(() => {
                // 🌟 2. 若 OSM 封鎖，退回 BDC API
                fetch(fallbackUrl).then(res => res.json()).then(data => { 
                    let addr = "瑞芳秘境"; 
                    if(data) {
                        let city = data.principalSubdivision || "";
                        let dist = data.city || "";
                        let village = data.locality || "";
                        let road = "";
                        
                        if (data.localityInfo) {
                            if (data.localityInfo.administrative) {
                                const v = data.localityInfo.administrative.find(a => a.name.endsWith('里') || a.adminLevel === 10);
                                if (v && v.name) village = v.name;
                            }
                            if (data.localityInfo.informative) {
                                const r = data.localityInfo.informative.find(i => i.name.endsWith('路') || i.name.endsWith('街') || i.name.endsWith('道') || i.description === 'road');
                                if (r && r.name) road = r.name;
                            }
                        }
                        const parts = [city, dist].filter(Boolean);
                        const uniqueParts = [...new Set(parts)];
                        addr = `${uniqueParts.join('')}${village}${road}` || "瑞芳秘境"; 
                    }
                    showCustomModal(addr);
                }).catch(() => showCustomModal("瑞芳秘境"));
            });
        });
    }

    window.closeCustomSpotModal = () => { const m = document.getElementById('custom-spot-modal'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };
    window.confirmCustomSpot = () => { const spotName = document.getElementById('custom-spot-name').value.trim() || "我的秘境"; if (state.tempCustomSpot) { const newSpot = { name: spotName, lat: state.tempCustomSpot.lat, lng: state.tempCustomSpot.lng, tags: ["自訂"], highlights: `詳細地址：${state.tempCustomSpot.addr}`, food: "--", history: "自訂標記", transport: "自行前往", wikiImg: "" }; state.savedCustomSpots.push(newSpot); saveState.customSpots(); addMarkerToMap(newSpot); showCard(newSpot); } window.closeCustomSpotModal(); };
    
    window.openEditModal = (name) => { 
        state.currentEditingSpotName = name; const s = state.savedCustomSpots.find(x => x.name === name); if(!s) return; 
        document.getElementById('edit-name').value = s.name; document.getElementById('edit-highlights').value = s.highlights; document.getElementById('edit-history').value = s.history; 
        const preview = document.getElementById('edit-image-preview');
        if(s.wikiImg) { preview.classList.remove('u-hidden'); preview.classList.add('u-block'); preview.src = s.wikiImg; } 
        else { preview.classList.remove('u-block'); preview.classList.add('u-hidden'); preview.src = ""; }
        const m = document.getElementById('edit-modal-overlay'); if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
    };
    window.closeEditModal = () => { const m = document.getElementById('edit-modal-overlay'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };
    
    const fileInput = document.getElementById('edit-image'); if(fileInput) { fileInput.addEventListener('change', function(e) { const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = event => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const scaleSize = 400 / img.width; canvas.width = 400; canvas.height = img.height * scaleSize; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); const preview = document.getElementById('edit-image-preview'); preview.src = canvas.toDataURL('image/jpeg', 0.7); preview.classList.remove('u-hidden'); preview.classList.add('u-block'); }; img.src = event.target.result; }; reader.readAsDataURL(file); }); }
    
    window.saveEditSpot = () => { const newName = document.getElementById('edit-name').value.trim(); if(!newName) return alert("名稱不能為空！"); const savedIdx = state.savedCustomSpots.findIndex(x => x.name === state.currentEditingSpotName); if(savedIdx === -1) return; const s = state.savedCustomSpots[savedIdx]; s.name = newName; s.highlights = document.getElementById('edit-highlights').value; s.history = document.getElementById('edit-history').value; s.wikiImg = document.getElementById('edit-image-preview').src; saveState.customSpots(); if(s.markerObj) state.cluster.removeLayer(s.markerObj); addMarkerToMap(s); window.closeEditModal(); showCard(s); };
    window.deleteCustomSpot = (name) => { if(!confirm(`確定要刪除「${name}」？無法復原喔！`)) return; const spotIndex = state.savedCustomSpots.findIndex(s => s.name === name); if (spotIndex > -1) { if(state.savedCustomSpots[spotIndex].markerObj) state.cluster.removeLayer(state.savedCustomSpots[spotIndex].markerObj); state.savedCustomSpots.splice(spotIndex, 1); saveState.customSpots(); } if (state.myFavs.includes(name)) { state.myFavs = state.myFavs.filter(fav => fav !== name); saveState.favs(); } closeCard(); alert('🗑️ 標記已刪除！'); };

    window.applyLanguage(state.currentLang);
    const savedTheme = localStorage.getItem('ruifang_theme'); if (!savedTheme || savedTheme === 'default') { window.applyCustomTheme('#007bff', false); } else { window.applyCustomTheme(savedTheme, true); }
    const savedFont = localStorage.getItem('ruifang_font') || 'default'; const fontMap = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'wenkai': '文楷', 'huninn': '粉圓' }; window.changeFont(savedFont, fontMap[savedFont]);
    window.loadSkipSettings();
}
