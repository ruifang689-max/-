// js/data/spots.js (完全雲端化版)

// 🌟 填入您提供的 Google 試算表發布網址
const USER_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOeeREvMoEmLqZ2QFsujd7SMQBZELP2CQn-WqvgWjlvysaCJ_9pLE_PR1Iw4Y06Ds3MlDvCDmxR463/pubhtml";

// 🌟 系統自動幫您將 html 網址轉換為程式讀取專用的 csv 格式，避免錯誤！
const SHEET_CSV_URL = USER_SHEET_URL.replace("/pubhtml", "/pub?output=csv");

export const spots = []; 

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // 去除隱藏 BOM 符號
    const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const row = [];
        let currentVal = '';
        let inQuote = false;
        
        // 逐字元掃描，支援試算表自動加上的雙引號
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(currentVal);
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        row.push(currentVal);
        
        const obj = {};
        headers.forEach((header, index) => {
            let val = row[index] !== undefined ? row[index].trim() : '';
            
            // 過濾並還原被試算表包裝的雙引號
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            
            if (header === 'tags') {
                obj[header] = val ? val.split(',').map(t => t.trim()) : [];
            } 
            else if (header === 'lat' || header === 'lng') {
                obj[header] = parseFloat(val);
            } 
            else if (header === 'heat') {
                obj[header] = parseFloat(val) || 0.5; 
            }
            else {
                obj[header] = val;
            }
        });
        
        // 嚴格檢查：只載入有名字且經緯度正確的景點
        if (obj.name && !isNaN(obj.lat) && !isNaN(obj.lng)) {
            result.push(obj);
        }
    }
    return result;
}

export async function fetchSpotsFromSheet() {
    try {
        console.log("🔄 正在從 Google Sheets 同步雲端景點資料...");
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error("網路連線錯誤");
        
        const csvText = await response.text();
        const cloudSpots = parseCSV(csvText);
        
        // 清空並將所有雲端資料推入全域陣列
        spots.length = 0; 
        spots.push(...cloudSpots); 
        
        console.log(`✅ 成功載入！完全雲端同步，共 ${spots.length} 筆景點！`);
        return spots;
        
    } catch (error) {
        console.error("❌ Google Sheets 載入失敗", error);
        if (typeof window.showToast === 'function') {
            window.showToast("資料庫連線失敗，請檢查網路狀態", "error");
        }
        return spots;
    }
}
