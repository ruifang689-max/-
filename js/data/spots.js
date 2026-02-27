// js/core/store.js (修復循環參照 Bug 版)

// 1. 定義所有 LocalStorage 的金鑰
const STORAGE_KEYS = {
    myFavs: 'ruifang_favs',
    savedCustomSpots: 'ruifang_custom_spots',
    searchHistory: 'ruifang_search_history'
};

// 🌟 新增：安全轉換器 (過濾掉會造成無限循環的 markerObj)
function safeStringify(data) {
    return JSON.stringify(data, (key, value) => {
        // 如果遇到名為 markerObj 的屬性，直接略過不存入 LocalStorage
        if (key === 'markerObj') return undefined;
        return value;
    });
}

// 2. 建立基礎狀態 (從 LocalStorage 讀取初始值)
const baseState = {
    mapInstance: null,
    cluster: null,
    userPos: null,
    targetSpot: null,
    currentRoute: null,
    navMode: 'walking',
    currentLang: localStorage.getItem('ruifang_lang') || 'zh',
    tourModeInterval: null,
    tempCustomSpot: null,
    currentEditingSpotName: null,
    _tempNavLat: null,
    _tempNavLng: null,
    
    myFavs: JSON.parse(localStorage.getItem(STORAGE_KEYS.myFavs) || '[]'),
    savedCustomSpots: JSON.parse(localStorage.getItem(STORAGE_KEYS.savedCustomSpots) || '[]'),
    searchHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.searchHistory) || '[]')
};

// 3. 🌟 陣列代理工廠 (攔截 push, splice, pop 等所有陣列操作)
function createReactiveArray(storageKey, initialArray) {
    return new Proxy(initialArray, {
        set(target, property, value) {
            target[property] = value;
            // 只要陣列內容有任何變動，自動幫您存進 LocalStorage！
            if (property !== 'length') { 
                localStorage.setItem(storageKey, safeStringify(target)); // 🌟 改用 safeStringify
            }
            return true;
        },
        deleteProperty(target, property) {
            delete target[property];
            localStorage.setItem(storageKey, safeStringify(target)); // 🌟 改用 safeStringify
            return true;
        }
    });
}

// 將需要自動存檔的陣列變成「響應式陣列」
baseState.myFavs = createReactiveArray(STORAGE_KEYS.myFavs, baseState.myFavs);
baseState.savedCustomSpots = createReactiveArray(STORAGE_KEYS.savedCustomSpots, baseState.savedCustomSpots);
baseState.searchHistory = createReactiveArray(STORAGE_KEYS.searchHistory, baseState.searchHistory);

// 4. 🌟 匯出全域 state (攔截對整個變數的直接替換)
export const state = new Proxy(baseState, {
    set(target, prop, value) {
        if (STORAGE_KEYS[prop]) {
            // 如果有其他模組直接替換整個陣列，重新把它包裝成 Proxy 並存檔
            target[prop] = createReactiveArray(STORAGE_KEYS[prop], value);
            localStorage.setItem(STORAGE_KEYS[prop], safeStringify(value)); // 🌟 改用 safeStringify
            return true;
        }
        
        // 語言切換也順便自動存檔
        if (prop === 'currentLang') {
            localStorage.setItem('ruifang_lang', value);
        }
        
        target[prop] = value;
        return true;
    }
});

// 5. 為了向下相容保留 saveState
export const saveState = {
    favs: () => localStorage.setItem(STORAGE_KEYS.myFavs, safeStringify(state.myFavs)), // 🌟 改用 safeStringify
    customSpots: () => localStorage.setItem(STORAGE_KEYS.savedCustomSpots, safeStringify(state.savedCustomSpots)), // 🌟 改用 safeStringify
    history: () => localStorage.setItem(STORAGE_KEYS.searchHistory, safeStringify(state.searchHistory)) // 🌟 改用 safeStringify
};

export function initStore() {
    console.log("📦 狀態管理引擎 (Proxy) 已全自動啟動！(含循環參照防護)");
}
