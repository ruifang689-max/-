import { state } from '../core/store.js';
import { translations } from '../data/lang.js';
import { showCard } from './cards.js';

export function initTheme() {
    window.rfApp.theme.applyLanguage = (lang) => {
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
    
    window.rfApp.theme.selectLangOption = (lang) => { 
        document.querySelectorAll('.custom-select-options').forEach(el => { el.classList.remove('u-flex'); el.classList.add('u-hidden'); }); 
        window.rfApp.theme.applyLanguage(lang); 
    };
    
    window.rfApp.theme.selectThemeOption = (value, colorHex, text) => { 
        const list = document.getElementById('theme-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.rfApp.theme.changeTheme(value); 
    };
    
    window.rfApp.theme.changeTheme = (color) => { 
        const picker = document.getElementById('custom-color-picker');
        if (color === 'custom') { if(picker) { picker.classList.remove('u-hidden'); picker.classList.add('u-block'); picker.click(); } } 
        else if (color === 'default') { if(picker) picker.classList.add('u-hidden'); window.rfApp.theme.applyCustomTheme('#007bff', false); localStorage.setItem('ruifang_theme', 'default'); } 
        else { if(picker) picker.classList.add('u-hidden'); window.rfApp.theme.applyCustomTheme(color, true); } 
    };
    
    window.rfApp.theme.applyCustomTheme = (color, syncIntro = false) => { 
        document.documentElement.style.setProperty('--primary', color); document.documentElement.style.setProperty('--logo-border', color); 
        if (color === '#007bff' && !syncIntro) { 
            document.documentElement.style.setProperty('--accent', '#e67e22'); document.documentElement.style.setProperty('--dynamic-border', 'var(--text-main)'); document.documentElement.style.setProperty('--stamp-active', 'var(--danger)'); 
        } else { 
            document.documentElement.style.setProperty('--accent', color); document.documentElement.style.setProperty('--dynamic-border', color); document.documentElement.style.setProperty('--stamp-active', color); 
        }
        if (syncIntro) { document.documentElement.style.setProperty('--intro-color', color); if(color !== '#007bff') localStorage.setItem('ruifang_theme', color); } 
        else { document.documentElement.style.setProperty('--intro-color', '#111111'); }
        
        const colorSwatch = document.getElementById('current-theme-color'); const textSpan = document.getElementById('current-theme-text');
        if (colorSwatch && textSpan) {
            colorSwatch.style.background = color;
            const themeMap = { '#007bff': '活力藍', '#34495e': '夜幕藍', '#333333': '極簡黑', '#95a5a6': '現代灰', '#28a745': '自然綠', '#27ae60': '森林綠', '#f39c12': '溫暖橘', '#e67e22': '夕陽橘', '#FF0000': '喜慶紅', '#f1c40f': '陽光黃', '#8e44ad': '神秘紫', '#e84393': '櫻花粉' };
            if (color === '#007bff' && !syncIntro) textSpan.innerText = '系統主題色 (預設)'; else textSpan.innerText = themeMap[color] || `自訂顏色 (${color})`;
        }
    };

    window.rfApp.theme.selectFontOption = (value, text) => { 
        const list = document.getElementById('font-options-list');
        if (list) { list.classList.remove('u-flex'); list.classList.add('u-hidden'); }
        window.rfApp.theme.changeFont(value, text); 
    };
    
    window.rfApp.theme.changeFont = (fontValue, fontText) => {
        document.body.classList.remove('font-iansui', 'font-wenkai', 'font-huninn');
        if (fontValue === 'iansui') document.body.classList.add('font-iansui');
        else if (fontValue === 'wenkai') document.body.classList.add('font-wenkai');
        else if (fontValue === 'huninn') document.body.classList.add('font-huninn');
        localStorage.setItem('ruifang_font', fontValue);
        if (document.getElementById('current-font-text')) document.getElementById('current-font-text').innerText = fontText || '系統預設 (黑體)';
    };

    // 🌟 向下相容橋樑 (Legacy Bridge)
    window.applyLanguage = window.rfApp.theme.applyLanguage;
    window.selectLangOption = window.rfApp.theme.selectLangOption;
    window.selectThemeOption = window.rfApp.theme.selectThemeOption;
    window.changeTheme = window.rfApp.theme.changeTheme;
    window.applyCustomTheme = window.rfApp.theme.applyCustomTheme;
    window.selectFontOption = window.rfApp.theme.selectFontOption;
    window.changeFont = window.rfApp.theme.changeFont;

    // 初始化自動載入
    window.rfApp.theme.applyLanguage(state.currentLang);
    const savedTheme = localStorage.getItem('ruifang_theme'); if (!savedTheme || savedTheme === 'default') { window.rfApp.theme.applyCustomTheme('#007bff', false); } else { window.rfApp.theme.applyCustomTheme(savedTheme, true); }
    const savedFont = localStorage.getItem('ruifang_font') || 'default'; const fontMap = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'wenkai': '文楷', 'huninn': '粉圓' }; window.rfApp.theme.changeFont(savedFont, fontMap[savedFont]);
}
