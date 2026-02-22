// js/modules/theme.js (融合版 - i18n 翻譯引擎 + 主題色 + 特效裝飾 + 字體管理)
import { state } from '../core/store.js';
import { translations } from '../data/lang.js';
import { showCard } from './cards.js';

// --- 常數定義 ---
const LANG_DISPLAY_MAP = { 'zh': '繁體中文 (🇹🇼)', 'en': 'English (🇺🇸)', 'ja': '日本語 (🇯🇵)', 'ko': '한국어 (🇰🇷)', 'vi': 'Tiếng Việt (🇻🇳)' };
const THEME_NAME_MAP = { '#007bff': '活力藍 (預設)', '#34495e': '夜幕藍', '#333333': '極簡黑', '#95a5a6': '現代灰', '#28a745': '自然綠', '#27ae60': '森林綠', '#f39c12': '溫暖橘', '#e67e22': '夕陽橘', '#FF0000': '熱情紅', '#f1c40f': '陽光黃', '#8e44ad': '神秘紫', '#c0392b': '喜慶紅', '#e84393': '櫻花粉' };
const FONT_NAME_MAP = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'wenkai': '文楷', 'huninn': '粉圓' };
const SKINS = { 'default': '系統預設 (乾淨)', 'glass': '💧 液態玻璃 (Glassmorphism)', 'newyear': '🧧 恭賀新禧 (燈籠春聯)', 'sakura': '🌸 浪漫櫻花 (飄落特效)' };

let sakuraInterval = null;

export function initTheme() {
    
    // 🌟 1. 【核心】全域動態翻譯引擎
    window.rfApp.t = (key) => {
        const lang = state.currentLang || 'zh';
        // 找不到 key 則退回中文，再找不到就顯示 key
        return translations[lang]?.[key] || translations['zh']?.[key] || key;
    };

    // --- 語系管理 ---
    window.rfApp.theme.applyLanguage = (lang) => {
        state.currentLang = lang; 
        const t = translations[lang] || translations['zh'];

        window.rfApp.theme.applyLanguage = (lang) => {
            // ... 前面的程式碼 ...
            
            // 🌟 [新增] 通知地圖模組更新標記文字
            if (typeof window.rfApp.map.updateMarkerLabels === 'function') {
                window.rfApp.map.updateMarkerLabels();
            }
        };
        
        // 替換 HTML 中的 data-i18n 標籤 (保留 Icon)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = t[key];
                } else { 
                    const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/); 
                    el.innerHTML = iconMatch ? iconMatch[0] + ' ' + t[key] : t[key]; 
                }
            }
        });

        // 更新設定面板的語系顯示名稱
        const displayLabel = LANG_DISPLAY_MAP[lang] || LANG_DISPLAY_MAP['zh'];
        if (document.getElementById('current-lang-text-startup')) document.getElementById('current-lang-text-startup').innerText = displayLabel;
        if (document.getElementById('current-lang-text-settings')) document.getElementById('current-lang-text-settings').innerText = displayLabel;
        
        // 若卡片開啟中，重新渲染以更新文字
        if (state.targetSpot && document.getElementById("card")?.classList.contains("open")) {
            showCard(state.targetSpot);
        }
        
        // 重設搜尋框的情境文字
        if (window.rfApp.search && typeof window.rfApp.search.clearSearchInput === 'function') {
            window.rfApp.search.clearSearchInput();
        }
        if (typeof window.renderDefaultSearch === 'function') window.renderDefaultSearch();
    };
    
    window.rfApp.theme.selectLangOption = (lang) => { 
        document.querySelectorAll('.custom-select-options').forEach(el => { el.classList.remove('u-flex'); el.classList.add('u-hidden'); }); 
        window.rfApp.theme.applyLanguage(lang); 
        if (typeof window.showToast === 'function') window.showToast('Language Updated / 語系已更新', 'success');
    };
    
    // 🌟 2. --- 主題色管理 (Color) ---
    window.rfApp.theme.selectThemeOption = (value) => { 
        const list = document.getElementById('theme-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.rfApp.theme.changeTheme(value); 
    };
    
    window.rfApp.theme.changeTheme = (color) => { 
        const picker = document.getElementById('custom-color-picker');
        if (color === 'custom') { 
            if (picker) { picker.classList.remove('u-hidden'); picker.classList.add('u-block'); picker.click(); } 
        } else if (color === 'default') { 
            if (picker) picker.classList.add('u-hidden'); 
            window.rfApp.theme.applyCustomTheme('#007bff', false); 
            localStorage.setItem('ruifang_theme', 'default');
        } else { 
            if (picker) picker.classList.add('u-hidden'); 
            window.rfApp.theme.applyCustomTheme(color, true); 
        } 
    };
    
    window.rfApp.theme.applyCustomTheme = (color, syncIntro = false) => { 
        const root = document.documentElement;
        root.style.setProperty('--primary', color); 
        root.style.setProperty('--logo-border', color); 
        
        // 詳細設定強調色與動態邊框
        if (color === '#007bff' && !syncIntro) { 
            root.style.setProperty('--accent', '#e67e22'); 
            root.style.setProperty('--dynamic-border', 'var(--text-main)'); 
            root.style.setProperty('--stamp-active', 'var(--danger)'); 
        } else { 
            root.style.setProperty('--accent', color); 
            root.style.setProperty('--dynamic-border', color); 
            root.style.setProperty('--stamp-active', color); 
        }
        
        if (syncIntro) { 
            root.style.setProperty('--intro-color', color); 
            if (color !== '#007bff') localStorage.setItem('ruifang_theme', color); 
        } else { 
            root.style.setProperty('--intro-color', '#111111'); 
        }
        
        // 更新 UI 顯示
        const colorSwatch = document.getElementById('current-theme-color'); 
        const textSpan = document.getElementById('current-theme-text');
        if (colorSwatch && textSpan) {
            colorSwatch.style.background = color;
            if (color === '#007bff' && !syncIntro) {
                textSpan.innerText = '系統主題色 (預設)';
            } else {
                textSpan.innerText = THEME_NAME_MAP[color] || `自訂顏色 (${color})`;
            }
        }
        const picker = document.getElementById('custom-color-picker');
        if (picker && picker.value !== color) picker.value = color;
    };

    // 🌟 3. --- 介面風格與特效管理 (Skin) ---
    window.rfApp.theme.changeSkin = (skinName) => {
        const body = document.body;
        
        // 清除舊風格
        body.classList.remove('skin-glass', 'skin-newyear', 'skin-sakura');
        document.getElementById('skin-layer')?.remove(); 
        if (sakuraInterval) clearInterval(sakuraInterval);

        // 套用新風格
        if (skinName !== 'default') {
            body.classList.add(`skin-${skinName}`);
            renderSkinEffects(skinName);
        }
        
        localStorage.setItem('ruifang_skin', skinName);
    };

    // 綁定到全域給 HTML 呼叫
    window.toggleSkinOptions = () => {
        const list = document.getElementById('skin-options-list');
        if (list) {
            list.classList.toggle('u-hidden');
            list.classList.toggle('u-flex'); // 或 u-block，依你的 CSS 而定
        }
    };
    
    window.selectSkinOption = (value, text) => {
        // 關閉選單
        const list = document.getElementById('skin-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        
        // 更新介面文字
        const displayText = document.getElementById('current-skin-text');
        if (displayText) displayText.innerText = text;
        
        // 呼叫核心切換功能
        window.changeSkin(value);
    };

    const renderSkinEffects = (skin) => {
        // 注入共用 CSS (若不存在)
        if (!document.getElementById('theme-skin-css')) {
            const style = document.createElement('style');
            style.id = 'theme-skin-css';
            style.innerHTML = `
                /* 液態玻璃 */
                body.skin-glass .settings-container, 
                body.skin-glass #card, 
                body.skin-glass .dash-container {
                    background: rgba(255, 255, 255, 0.65) !important;
                    backdrop-filter: blur(16px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                /* 裝飾層容器 (不擋點擊) */
                #skin-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }

                /* 新年燈籠與春聯 */
                .deco-lantern { position: absolute; font-size: 40px; animation: swing 3s infinite ease-in-out; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2)); }
                .deco-lantern.left { top: -10px; left: 20px; transform-origin: top center; }
                .deco-lantern.right { top: -10px; right: 20px; transform-origin: top center; animation-delay: 1.5s; }
                .deco-couplet { position: absolute; top: 60px; right: 10px; writing-mode: vertical-rl; background: #c0392b; color: #f1c40f; padding: 10px 4px; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); font-family: "KaiTi", serif; font-size: 14px; letter-spacing: 2px;}
                @keyframes swing { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }

                /* 櫻花飄落 */
                .sakura-petal { position: absolute; top: -20px; font-size: 16px; animation: fall linear forwards; opacity: 0.8; }
                @keyframes fall { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }

        const layer = document.createElement('div');
        layer.id = 'skin-layer';
        document.body.appendChild(layer);

        if (skin === 'newyear') {
            layer.innerHTML = `
                <div class="deco-lantern left">🏮</div>
                <div class="deco-lantern right">🏮</div>
                <div class="deco-couplet">瑞雪兆豐年</div>
            `;
        } 
        else if (skin === 'sakura') {
            const symbols = ['🌸', '💮', '🍃'];
            const createPetal = () => {
                const p = document.createElement('div');
                p.className = 'sakura-petal';
                p.innerText = symbols[Math.floor(Math.random() * symbols.length)];
                p.style.left = Math.random() * 100 + 'vw';
                p.style.animationDuration = (Math.random() * 3 + 4) + 's'; // 4~7s
                p.style.fontSize = (Math.random() * 10 + 10) + 'px';
                layer.appendChild(p);
                setTimeout(() => p.remove(), 7000);
            };
            sakuraInterval = setInterval(createPetal, 800); // 每 0.8 秒產生一片
            createPetal();
        }
    };

    // 🌟 4. --- 字體管理 ---
    window.rfApp.theme.selectFontOption = (value, text) => { 
        const list = document.getElementById('font-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.rfApp.theme.changeFont(value, text); 
    };
    
    window.rfApp.theme.changeFont = (fontValue, fontText) => {
        document.body.classList.remove('font-iansui', 'font-wenkai', 'font-huninn');
        if (fontValue !== 'default') document.body.classList.add(`font-${fontValue}`);
        
        localStorage.setItem('ruifang_font', fontValue);
        const displayLabel = fontText || FONT_NAME_MAP[fontValue] || FONT_NAME_MAP['default'];
        if (document.getElementById('current-font-text')) document.getElementById('current-font-text').innerText = displayLabel;
    };

    // 🌟 5. --- 向下相容橋樑 (全域綁定) ---
    window.applyLanguage = window.rfApp.theme.applyLanguage;
    window.selectLangOption = window.rfApp.theme.selectLangOption;
    window.selectThemeOption = window.rfApp.theme.selectThemeOption;
    window.changeTheme = window.rfApp.theme.changeTheme;
    window.applyCustomTheme = window.rfApp.theme.applyCustomTheme;
    window.selectFontOption = window.rfApp.theme.selectFontOption;
    window.changeFont = window.rfApp.theme.changeFont;
    window.changeSkin = window.rfApp.theme.changeSkin; // 新增綁定
    window.t = window.rfApp.t; 

    // --- 啟動時還原所有設定 ---
    window.rfApp.theme.applyLanguage(state.currentLang || 'zh');
    
    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { 
        window.rfApp.theme.applyCustomTheme('#007bff', false); 
    } else { 
        window.rfApp.theme.applyCustomTheme(savedTheme, true); 
    }
    
    const savedSkin = localStorage.getItem('ruifang_skin') || 'default';
    window.rfApp.theme.changeSkin(savedSkin);

    const savedFont = localStorage.getItem('ruifang_font') || 'default'; 
    window.rfApp.theme.changeFont(savedFont);
}
