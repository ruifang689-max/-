// js/modules/theme.js (v656) - 國際化與動態翻譯引擎版
// js/modules/theme.js (連線翻譯擴充版)
import { state } from '../core/store.js';
import { translations } from '../data/lang.js';
import { showCard } from './cards.js';

const LANG_DISPLAY_MAP = { 'zh': '繁體中文 (🇹🇼)', 'en': 'English (🇺🇸)', 'ja': '日本語 (🇯🇵)', 'ko': '한국어 (🇰🇷)', 'vi': 'Tiếng Việt (🇻🇳)' };
const THEME_NAME_MAP = { '#007bff': '活力藍', '#34495e': '夜幕藍', '#333333': '極簡黑', '#95a5a6': '現代灰', '#28a745': '自然綠', '#27ae60': '森林綠', '#f39c12': '溫暖橘', '#e67e22': '夕陽橘', '#FF0000': '喜慶紅', '#f1c40f': '陽光黃', '#8e44ad': '神秘紫', '#e84393': '櫻花粉' };
const FONT_NAME_MAP = { 'default': '系統預設 (黑體)', 'iansui': '芫荽', 'wenkai': '文楷', 'huninn': '粉圓' };

// 🌟 新增：動態翻譯快取記憶體 (避免重複發送 API 請求)
const dynamicCache = { en: {}, ja: {}, ko: {}, vi: {} };

export function initTheme() {
    
    // 🌟 【升級版】智慧全域翻譯引擎
    window.rfApp.t = (key) => {
        const lang = state.currentLang || 'zh';
        
        // 如果是中文，直接回傳對應的中文，或把 key 當作純文字直接輸出 (處理景點描述)
        const baseText = translations['zh']?.[key] || key; 
        if (lang === 'zh') return baseText;

        // 1. 優先尋找本地端靜態 lang.js 的資料
        if (translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }

        // 2. 尋找曾經連線翻譯過的快取資料
        if (dynamicCache[lang]?.[key] && dynamicCache[lang][key] !== 'fetching') {
            return dynamicCache[lang][key];
        }

        // 3. 兩者都沒有 -> 觸發背景連線翻譯！
        if (dynamicCache[lang] && dynamicCache[lang][key] !== 'fetching') {
            fetchTranslation(key, baseText, lang);
        }

        // 在 API 回應前，先暫時回傳中文墊檔，避免畫面出現 undefined 或卡死
        return baseText; 
    };

    // 🌟 核心：背景連線 Google Translate API
    async function fetchTranslation(key, textToTranslate, targetLang) {
        if (!dynamicCache[targetLang]) dynamicCache[targetLang] = {};
        
        // 標記為「獲取中」，避免短時間內對同一個字串狂打 API
        dynamicCache[targetLang][key] = 'fetching'; 

        try {
            // 使用 Google 輕量級翻譯 API (GTX)
            // 注意：這是免金鑰的公開接口，適合前端輕度使用。若流量極大建議改串接官方正式 API
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('API 連線異常');
            
            const data = await response.json();
            
            // 解析回傳的陣列結構組合出完整句子
            const translatedText = data[0].map(item => item[0]).join('');
            
            // 寫入快取
            dynamicCache[targetLang][key] = translatedText;

            // 翻譯成功後，動態更新畫面上現有的 DOM
            updateDOMTranslation(key, translatedText);

            // 如果目前景點卡片是開啟的狀態，可能需要刷新卡片內容
            if (state.targetSpot && document.getElementById("card")?.classList.contains("open")) {
                // 為了不打斷使用者操作，如果是單純的文字長敘述，使用者可能在重開卡片時才會看到翻譯
                // 但如果您希望即時刷卡片，可以解除下面這行的註解：
                // showCard(state.targetSpot); 
            }

        } catch (error) {
            console.warn(`[自動翻譯失敗] ${key}:`, error);
            // 失敗則退回中文，讓系統下次有機會再試
            dynamicCache[targetLang][key] = textToTranslate; 
        }
    }

    // 🌟 將已經翻譯好的文字自動替換到 HTML 的 data-i18n 屬性標籤上
    function updateDOMTranslation(key, translatedText) {
        document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translatedText;
            } else {
                const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/);
                el.innerHTML = iconMatch ? iconMatch[0] + ' ' + translatedText : translatedText;
            }
        });
    }

    // --- 語系管理 ---
    window.rfApp.theme.applyLanguage = (lang) => {
        state.currentLang = lang; 
        
        // 1. 替換 HTML 中的 data-i18n 標籤 (利用新的 t 函數，會自動觸發翻譯機制)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translatedText = window.rfApp.t(key);
            
            if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translatedText;
            } else { 
                const iconMatch = el.innerHTML.match(/<i[^>]*><\/i>/); 
                el.innerHTML = iconMatch ? iconMatch[0] + ' ' + translatedText : translatedText; 
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
        
        // 4. 重設搜尋框的情境文字
        if (window.rfApp.search && typeof window.rfApp.search.clearSearchInput === 'function') {
            window.rfApp.search.clearSearchInput();
        }
    };
    
    window.rfApp.theme.selectLangOption = (lang) => { 
        document.querySelectorAll('.custom-select-options').forEach(el => { el.classList.remove('u-flex'); el.classList.add('u-hidden'); }); 
        window.rfApp.theme.applyLanguage(lang); 
        
        // 使用翻譯引擎來發出 Toast 提示
        if (typeof window.showToast === 'function') {
            const msg = window.rfApp.t('Language Updated') === 'Language Updated' ? '語系已更新' : window.rfApp.t('Language Updated');
            window.showToast(msg, 'success');
        }
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
            // 🌟 這裡將系統預設色狀態下的「動態外框(--dynamic-border)」改為綠色
            root.style.setProperty('--dynamic-border', '#28a745'); 
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
            let targetText = "";
            if (color === '#007bff' && !syncIntro) {
                targetText = '系統主題色 (預設)';
            } else {
                targetText = THEME_NAME_MAP[color] || `自訂顏色 (${color})`;
            }
            textSpan.innerText = window.rfApp.t(targetText);
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
        
        // 🌟 將選定的字體名稱送進翻譯引擎
        if (document.getElementById('current-font-text')) {
            document.getElementById('current-font-text').innerText = window.rfApp.t(displayLabel);
        }
    };

    // 🌟 向下相容橋樑
    window.applyLanguage = window.rfApp.theme.applyLanguage;
    window.selectLangOption = window.rfApp.theme.selectLangOption;
    window.selectThemeOption = window.rfApp.theme.selectThemeOption;
    window.changeTheme = window.rfApp.theme.changeTheme;
    window.applyCustomTheme = window.rfApp.theme.applyCustomTheme;
    window.selectFontOption = window.rfApp.theme.selectFontOption;
    window.changeFont = window.rfApp.theme.changeFont;
    window.t = window.rfApp.t; 

    // --- 初始化執行 ---
    window.rfApp.theme.applyLanguage(state.currentLang);
    const savedTheme = localStorage.getItem('ruifang_theme'); 
    if (!savedTheme || savedTheme === 'default') { window.rfApp.theme.applyCustomTheme('#007bff', false); } else { window.rfApp.theme.applyCustomTheme(savedTheme, true); }
    const savedFont = localStorage.getItem('ruifang_font') || 'default'; window.rfApp.theme.changeFont(savedFont);
}
