// js/core/store.js (v611)

// 1. 定義所有 LocalStorage 的金鑰
const STORAGE_KEYS = {
    myFavs: 'ruifang_favs',
    savedCustomSpots: 'ruifang_custom_spots',
    searchHistory: 'ruifang_search_history'
};

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
                localStorage.setItem(storageKey, JSON.stringify(target));
            }
            return true;
        },
        deleteProperty(target, property) {
            delete target[property];
            localStorage.setItem(storageKey, JSON.stringify(target));
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
            // 如果有其他模組直接替換整個陣列 (如 state.myFavs = [])，重新把它包裝成 Proxy 並存檔
            target[prop] = createReactiveArray(STORAGE_KEYS[prop], value);
            localStorage.setItem(STORAGE_KEYS[prop], JSON.stringify(value));
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
// (因為其他的 js 模組裡面還有寫到 saveState.favs() 等字眼，為了不讓它們報錯而保留。但其實它們已經不需要被手動呼叫了！)
export const saveState = {
    favs: () => localStorage.setItem(STORAGE_KEYS.myFavs, JSON.stringify(state.myFavs)),
    customSpots: () => localStorage.setItem(STORAGE_KEYS.savedCustomSpots, JSON.stringify(state.savedCustomSpots)),
    history: () => localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(state.searchHistory))
};

export function initStore() {
    console.log("📦 狀態管理引擎 (Proxy) 已全自動啟動！");
}
