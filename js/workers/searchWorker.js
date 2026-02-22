// js/workers/searchWorker.js (v626)
// 這是背景運算小幫手，專門處理大量資料過濾

self.onmessage = function(e) {
    // 接收主執行緒傳來的指令與資料
    const { action, keyword, spotsData } = e.data;

    if (action === 'search') {
        const k = keyword.trim().toLowerCase();
        
        // 如果關鍵字為空，直接回傳空陣列
        if (!k) {
            self.postMessage({ result: [] });
            return;
        }

        // 執行繁重的過濾比對運算
        const matches = spotsData.filter(s => 
            (s.name || '').toLowerCase().includes(k) || 
            (s.tags || []).some(t => t.toLowerCase().includes(k)) ||
            (s.keywords || []).some(kw => kw.toLowerCase().includes(k))
        );

        // 將算完的結果傳回主執行緒
        self.postMessage({ result: matches });
    }
};
