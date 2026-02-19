/**
 * js/modules/ui.js (v516)
 * 負責：UI 介面交互、設定、主題、字體、教學、PWA、收藏夾、自訂景點編輯
 */
import { state, saveState } from '../core/store.js';
import { spots } from '../data/spots.js';
import { translations } from '../data/lang.js';
import { addMarkerToMap } from './markers.js';
import { showCard, closeCard } from './cards.js';
import { triggerSearch } from './search.js';

export function initUI() {

    // =========================================
    // 🌟 全域客製化下拉選單控制器 (通用邏輯)
    // =========================================
    window.toggleDropdown = (listId) => {
        // 開啟新的之前，先關閉其他已開啟的下拉選單
        document.querySelectorAll('.custom-select-options').forEach(list => {
            if (list.id !== listId) list.classList.remove('open');
        });
        const targetList = document.getElementById(listId);
        if(targetList) targetList.classList.toggle('open');
    };

    // 點擊空白處，自動關閉所有下拉選單
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.custom-select-options').forEach(list => list.classList.remove('open'));
        }
    });

    // =========================================
    // 🌟 功能指引 (Feature Tour)
    // =========================================
    let currentTourStep = 0;
    const tourSteps = [
        { target: '#search', text: '🔍 <b style="color:var(--primary); font-size:16px;">搜尋景點</b><br>在這裡輸入關鍵字，可以快速尋找瑞芳的景點與秘境！', pos: 'bottom' },
        { target: '#category-chips', text: '🏷️ <b style="color:var(--primary); font-size:16px;">快速分類標籤</b><br>左右滑動並點擊標籤，地圖會瞬間為您過濾出想去的類型！', pos: 'bottom' },
        { target: 'button[onclick="openSettings()"]', text: '⚙️ <b style="color:var(--primary); font-size:16px;">系統設定與收藏</b><br>從這裡可以管理收藏夾、切換語言、更改主題顏色與字體喔！', pos: 'top' },
        { target: 'center', text: '🗺️ <b style="color:var(--primary); font-size:16px;">探索地圖</b><br>隨意拖曳地圖，點擊標記就能查看詳細介紹。<br><br>💡 <b>隱藏技巧</b>：長按地圖任一處，還能新增專屬的自訂景點！', pos: 'center' }
    ];

    window.startFeatureTour = () => {
        if(localStorage.getItem('ruifang_tour_done') === 'true') return;
        document.getElementById('tour-overlay').style.display = 'block';
        currentTourStep = 0;
        window.showTourStep();
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
                const rect = targetEl.getBoundingClientRect();
                const pad = 6;
                ring.style.display = 'block';
                ring.style.top = (rect.top - pad) + 'px';
                ring.style.left = (rect.left - pad) + 'px';
                ring.style.width = (rect.width + pad*2) + 'px';
                ring.style.height = (rect.height + pad*2) + 'px';
                ring.style.borderRadius = window.getComputedStyle(targetEl).borderRadius;
                ring.style.border = '3px solid var(--primary)';

                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                if(step.pos === 'bottom') {
                    tooltip.style.top = (rect.bottom + pad + 15) + 'px';
                    tooltip.style.bottom = 'auto';
                } else if(step.pos === 'top') {
                    tooltip.style.bottom = (window.innerHeight - rect.top + pad + 15) + 'px';
                    tooltip.style.top = 'auto';
                }
            }
        } else {
            // 中心模式 (結束前的提醒)
            ring.style.display = 'block';
            ring.style.top = '50%'; ring.style.left = '50%';
            ring.style.width = '0px'; ring.style.height = '0px';
            ring.style.border = 'none'; // 隱藏框線，只保留遮罩
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            tooltip.style.bottom = 'auto';
        }
    };

    window.nextTourStep = () => { currentTourStep++; window.showTourStep(); };
    window.endTour = () => {
        document.getElementById('tour-overlay').style.display = 'none';
        document.getElementById('tour-focus-ring').style.display = 'none';
        localStorage.setItem('ruifang_tour_done', 'true');
    };

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

        const langMap = { 'zh': '繁體中文 (🇹🇼)', 'en': 'English (🇺🇸)', 'ja': '日本語 (🇯🇵)', 'ko': '한국어 (🇰🇷)', 'vi': 'Tiếng Việt (🇻🇳)' };
        const startupSpan = document.getElementById('current-lang-text-startup');
        const settingsSpan = document.getElementById('current-lang-text-settings');
        if(startupSpan) startupSpan.innerText = langMap[lang] || langMap['zh'];
        if(settingsSpan) settingsSpan.innerText = langMap[lang] || langMap['zh'];

        if(state.targetSpot && document.getElementById("card").classList.contains("open")) { showCard(state.targetSpot); }
    };

    window.selectLangOption = (lang) => {
        document.querySelectorAll('.custom-select-options').forEach(el => el.classList.remove('open'));
        window.applyLanguage(lang);
    };
    
    // =========================================
    // 2. 主題顏色 (Theme)
    // =========================================
    window.selectThemeOption = (value, colorHex, text) => {
        const list = document.getElementById('theme-options-list');
        if(list) list.classList.remove('open');
        window.changeTheme(value);
    };

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

    window.applyCustomTheme = (color, syncIntro = false) => { 
        document.documentElement.style.setProperty('--primary', color); 
        document.documentElement.style.setProperty('--logo-border', color); 
        
        if (color === '#007bff' && !syncIntro) {
            document.documentElement.style.setProperty('--accent', '#e67e22'); 
            document.documentElement.style.setProperty('--dynamic-border', 'var(--text-main)'); 
        } else {
            document.documentElement.style.setProperty('--accent', color); 
            document.documentElement.style.setProperty('--dynamic-border', color); 
        }

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
            
            // 🌟 請替換為這個包含所有新顏色的完整對照表
            const themeMap = { 
                '#007bff': '活力藍', 
                '#34495e': '夜幕藍', 
                '#333333': '極簡黑', 
                '#95a5a6': '現代灰',
                '#28a745': '自然綠', 
                '#27ae60': '森林綠', 
                '#f39c12': '溫暖橘', 
                '#e67e22': '夕陽橘', 
                '#FF0000': '喜慶紅',
                '#f1c40f': '陽光黃',
                '#8e44ad': '神秘紫', 
                '#e84393': '櫻花粉' 
            };
            
            if (color === '#007bff' && !syncIntro) textSpan.innerText = '系統主題色 (預設)';
            else textSpan.innerText = themeMap[color] || `自訂顏色 (${color})`;
        }
    };

    // =========================================
    // 3. 字體選擇 (Font)
    // =========================================
    window.selectFontOption = (value, text) => {
        const list = document.getElementById('font-options-list');
        if(list) list.classList.remove('open');
        window.changeFont(value, text);
    };

    window.changeFont = (fontValue, fontText) => {
        document.body.classList.remove('font-iansui', 'font-wenkai', 'font-huninn');
        
        if (fontValue === 'iansui') {
            document.body.classList.add('font-iansui');
        } else if (fontValue === 'wenkai') {
            document.body.classList.add('font-wenkai');
        } else if (fontValue === 'huninn') {
            document.body.classList.add('font-huninn');
        }
        
        localStorage.setItem('ruifang_font', fontValue);
        
        const textSpan = document.getElementById('current-font-text');
        if (textSpan) textSpan.innerText = fontText || '系統預設 (黑體)';
    };

    // =========================================
    // 4. 畫面切換與基本按鈕
    // =========================================
    window.enterMap = () => { 
        const welcome = document.getElementById('welcome-screen');
        const tutorial = document.getElementById('tutorial-overlay');
        if(welcome) welcome.style.opacity = '0'; 
        setTimeout(() => { 
            if(welcome) welcome.style.display = 'none'; 
            if(tutorial && localStorage.getItem('ruifang_skip_intro') !== 'true' && localStorage.getItem('ruifang_welcomed') !== 'true') {
                tutorial.style.display = 'flex'; 
                setTimeout(() => { tutorial.style.opacity = '1'; }, 50); 
            } else {
                // 如果不需要顯示圖文教學，則啟動聚光燈指引
                window.startFeatureTour();
            }
        }, 400); 
    };
    
        window.finishTutorial = () => { 
        const tut = document.getElementById('tutorial-overlay');
        if(tut) tut.style.opacity = '0'; 
        setTimeout(() => { 
            if(tut) tut.style.display = 'none'; 
            localStorage.setItem('ruifang_welcomed', 'true'); 
            if (state.mapInstance) state.mapInstance.invalidateSize(); 
            
            // 🌟 圖文教學結束後，緊接著啟動聚光燈指引！
            window.startFeatureTour();
        }, 400); 
    };
    
    window.resetNorth = () => { state.mapInstance.flyTo([25.1032, 121.8224], 14); };
    window.goToStation = () => { state.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); };

    // =========================================
    // 5. 設定 Modal 與教學
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
    // 6. PWA 安裝與分享
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
    // 7. 收藏夾管理
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
    // 8. 🌟 雙 API 長按查詢地址防護機制
    // =========================================
    if (state.mapInstance) {
        state.mapInstance.on('contextmenu', function(e) {
            const lat = e.latlng.lat; const lng = e.latlng.lng;
            const tempPopup = L.popup({ closeButton: false, autoClose: false, offset: [0, -10] })
                .setLatLng(e.latlng)
                .setContent("<div style='padding:8px; font-weight:bold; color:var(--primary); font-size:14px;'><i class='fas fa-spinner fa-spin'></i> 獲取詳細地址中...</div>")
                .openOn(state.mapInstance);

            const primaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`;
            const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-tw`;

            fetch(primaryUrl)
            .then(res => { if(!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                let addr = "未知詳細地址"; 
                if(data && data.address) { 
                    const a = data.address; 
                    addr = (a.city || a.county || "") + (a.town || a.suburb || a.district || "") + (a.village || "") + (a.road || "") + (a.house_number ? a.house_number + "號" : ""); 
                }
                state.mapInstance.closePopup(tempPopup); 
                setTimeout(() => { 
                    state.tempCustomSpot = { lat, lng, addr };
                    document.getElementById('custom-spot-addr').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${addr}`;
                    document.getElementById('custom-spot-name').value = ""; 
                    document.getElementById('custom-spot-modal').style.display = 'flex';
                }, 150);
            })
            .catch(() => { 
                fetch(fallbackUrl).then(res => res.json()).then(data => {
                    let addr = "瑞芳秘境";
                    if(data) { addr = (data.principalSubdivision || "") + (data.city || "") + (data.locality || ""); }
                    state.mapInstance.closePopup(tempPopup); 
                    setTimeout(() => { 
                        state.tempCustomSpot = { lat, lng, addr };
                        document.getElementById('custom-spot-addr').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${addr}`;
                        document.getElementById('custom-spot-name').value = ""; 
                        document.getElementById('custom-spot-modal').style.display = 'flex';
                    }, 150);
                }).catch(() => state.mapInstance.closePopup(tempPopup));
            });
        });
    }

    // =========================================
    // 🌟 插入：九大區域地圖浮水印標籤
    // =========================================
    if (state.mapInstance) {
        const ruifangRegions = [
            { name: "四腳亭", lat: 25.1020, lng: 121.7610 },
            { name: "瑞芳市區", lat: 25.1080, lng: 121.8050 },
            { name: "九份", lat: 25.1090, lng: 121.8440 },
            { name: "金瓜石", lat: 25.1050, lng: 121.8580 },
            { name: "水湳洞", lat: 25.1220, lng: 121.8640 },
            { name: "鼻頭角", lat: 25.1270, lng: 121.9180 },
            { name: "深澳", lat: 25.1310, lng: 121.8190 },
            { name: "猴硐", lat: 25.0860, lng: 121.8260 },
            { name: "三貂嶺", lat: 25.0590, lng: 121.8240 }
        ];

        ruifangRegions.forEach(region => {
            const regionIcon = L.divIcon({
                className: 'region-label',
                html: `<div class="region-label-text">${region.name}</div>`,
                iconSize: [120, 40],
                iconAnchor: [60, 20] // 確保文字正中心對準座標
            });

            L.marker([region.lat, region.lng], {
                icon: regionIcon,
                interactive: false,  // 關閉互動，滑鼠可直接穿透點擊下方景點
                zIndexOffset: -1000  // 讓文字沉在地圖最底層，不會遮擋景點 Marker
            }).addTo(state.mapInstance);
        });
    }
    
    // =========================================
    // 9. 自訂景點編輯與新增
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
    // 10. 🌟 系統啟動時的初始化 (Apply Init Config)
    // =========================================
    window.applyLanguage(state.currentLang);

    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { 
        window.applyCustomTheme('#007bff', false); 
    } else { 
        window.applyCustomTheme(savedTheme, true); 
    }

    const savedFont = localStorage.getItem('ruifang_font') || 'default';
    const fontMap = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'wenkai': '文楷', 'huninn': '粉圓' };
    window.changeFont(savedFont, fontMap[savedFont]);
}
