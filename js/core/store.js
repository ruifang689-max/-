// js/core/store.js (v706) - Proxy 自動存檔與全域狀態庫

// 1. 定義所有 LocalStorage 的金鑰
const STORAGE_KEYS = {
    myFavs: 'ruifang_favs',
    savedCustomSpots: 'ruifang_custom_spots',
    searchHistory: 'ruifang_search_history'
};

// 2. 建立基礎狀態 (從 LocalStorage 讀取初始值)
const baseState = {
    mapInstance: null,      // Leaflet 地圖實例
    userLocation: null,     // 使用者 GPS 位置 {lat, lng}
    targetSpot: null,       // 目前選中的景點 (用於卡片)
    currentLang: localStorage.getItem('ruifang_lang') || 'zh',
    tempCustomSpot: null,   // 暫存準備新增的自訂景點
    currentEditingSpotName: null, // 正在編輯的自訂景點名稱
    
    // 需要自動存檔的陣列資料
    myFavs: JSON.parse(localStorage.getItem(STORAGE_KEYS.myFavs) || '[]'),
    savedCustomSpots: JSON.parse(localStorage.getItem(STORAGE_KEYS.savedCustomSpots) || '[]'),
    searchHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.searchHistory) || '[]')
};

// 3. 🌟 陣列代理工廠 (攔截 push, splice 等陣列操作，實現自動存檔)
function createReactiveArray(storageKey, initialArray) {
    return new Proxy(initialArray, {
        set(target, property, value) {
            target[property] = value;
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

// 5. 向下相容保留的 saveState 函數 (其實已經不需要手動呼叫了)
export const saveState = {
    favs: () => localStorage.setItem(STORAGE_KEYS.myFavs, JSON.stringify(state.myFavs)),
    customSpots: () => localStorage.setItem(STORAGE_KEYS.savedCustomSpots, JSON.stringify(state.savedCustomSpots)),
    history: () => localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(state.searchHistory))
};

export function initStore() {
    console.log("📦 狀態管理引擎 (Proxy) 已全自動啟動！");
}
