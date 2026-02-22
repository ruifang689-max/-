// js/modules/theme.js (v656) - 國際化與動態翻譯引擎版
import { state } from '../core/store.js';
import { translations } from '../data/lang.js';
import { showCard } from './cards.js';

const LANG_DISPLAY_MAP = { 'zh': '繁體中文 (🇹🇼)', 'en': 'English (🇺🇸)', 'ja': '日本語 (🇯🇵)', 'ko': '한국어 (🇰🇷)', 'vi': 'Tiếng Việt (🇻🇳)' };
const THEME_NAME_MAP = { '#007bff': '活力藍', '#34495e': '夜幕藍', '#333333': '極簡黑', '#95a5a6': '現代灰', '#28a745': '自然綠', '#27ae60': '森林綠', '#f39c12': '溫暖橘', '#e67e22': '夕陽橘', '#FF0000': '喜慶紅', '#f1c40f': '陽光黃', '#8e44ad': '神秘紫', '#e84393': '櫻花粉' };
const FONT_NAME_MAP = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'wenkai': '文楷', 'huninn': '粉圓' };

export function initTheme() {
    
    // 🌟 【全新功能】全域動態翻譯引擎！
    window.rfApp.t = (key) => {
        const lang = state.currentLang || 'zh';
        // 如果該語言找不到這個 key，就退回中文找，再找不到就直接顯示 key
        return translations[lang]?.[key] || translations['zh']?.[key] || key;
    };

    // --- 語系管理 ---
    window.rfApp.theme.applyLanguage = (lang) => {
        state.currentLang = lang; 
        const t = translations[lang] || translations['zh'];
        
        // 1. 替換 HTML 中的 data-i18n 標籤
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

        // 2. 更新設定面板的語系顯示名稱
        const displayLabel = LANG_DISPLAY_MAP[lang] || LANG_DISPLAY_MAP['zh'];
        if(document.getElementById('current-lang-text-startup')) document.getElementById('current-lang-text-startup').innerText = displayLabel;
        if(document.getElementById('current-lang-text-settings')) document.getElementById('current-lang-text-settings').innerText = displayLabel;
        
        // 3. 若卡片開啟中，重新渲染以更新文字
        if(state.targetSpot && document.getElementById("card").classList.contains("open")) {
            showCard(state.targetSpot);
        }
        
        // 4. 重設搜尋框的情境文字 (因為語系變了)
        if (window.rfApp.search && typeof window.rfApp.search.clearSearchInput === 'function') {
            window.rfApp.search.clearSearchInput();
        }
    };
    
    window.rfApp.theme.selectLangOption = (lang) => { 
        document.querySelectorAll('.custom-select-options').forEach(el => { el.classList.remove('u-flex'); el.classList.add('u-hidden'); }); 
        window.rfApp.theme.applyLanguage(lang); 
        // 🌟 這裡可以直接使用新的動態翻譯引擎了 (雖然這裡用多國文字表示更新也行)
        if (typeof window.showToast === 'function') window.showToast('Language Updated / 語系已更新', 'success');
    };
    
    // --- 主題管理 ---
    window.rfApp.theme.selectThemeOption = (value) => { 
        const list = document.getElementById('theme-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.rfApp.theme.changeTheme(value); 
    };
    
    window.rfApp.theme.changeTheme = (color) => { 
        const picker = document.getElementById('custom-color-picker');
        if (color === 'custom') { 
            if(picker) { picker.classList.remove('u-hidden'); picker.classList.add('u-block'); picker.click(); } 
        } else if (color === 'default') { 
            if(picker) picker.classList.add('u-hidden'); 
            window.rfApp.theme.applyCustomTheme('#007bff', false); 
            localStorage.setItem('ruifang_theme', 'default');
        } else { 
            if(picker) picker.classList.add('u-hidden'); 
            window.rfApp.theme.applyCustomTheme(color, true); 
        } 
    };
    
    window.rfApp.theme.applyCustomTheme = (color, syncIntro = false) => { 
        const root = document.documentElement;
        root.style.setProperty('--primary', color); 
        root.style.setProperty('--logo-border', color); 
        
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
            if(color !== '#007bff') localStorage.setItem('ruifang_theme', color); 
        } else { 
            root.style.setProperty('--intro-color', '#111111'); 
        }
        
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
    };

    // --- 字體管理 ---
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

    // 🌟 向下相容橋樑
    window.applyLanguage = window.rfApp.theme.applyLanguage;
    window.selectLangOption = window.rfApp.theme.selectLangOption;
    window.selectThemeOption = window.rfApp.theme.selectThemeOption;
    window.changeTheme = window.rfApp.theme.changeTheme;
    window.applyCustomTheme = window.rfApp.theme.applyCustomTheme;
    window.selectFontOption = window.rfApp.theme.selectFontOption;
    window.changeFont = window.rfApp.theme.changeFont;
    // 暴露出全域 t 函數給舊版腳本使用
    window.t = window.rfApp.t; 

    // --- 初始化執行 ---
    window.rfApp.theme.applyLanguage(state.currentLang);
    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { window.rfApp.theme.applyCustomTheme('#007bff', false); } else { window.rfApp.theme.applyCustomTheme(savedTheme, true); }
    const savedFont = localStorage.getItem('ruifang_font') || 'default'; window.rfApp.theme.changeFont(savedFont);
}
