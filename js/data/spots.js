// js/data/spots.js (記憶體鎖定修正版)

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOeeREvMoEmLqZ2QFsujd7SMQBZELP2CQn-WqvgWjlvysaCJ_9pLE_PR1Iw4Y06Ds3MlDvCDmxR463/pub?output=csv"; 

// 🌟 必須使用 const，確保記憶體位址不變，別的檔案才抓得到！
export const spots = []; 

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const row = [];
        let currentVal = '';
        let inQuote = false;
        
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
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            if (header === 'tags') {
                obj[header] = val ? val.split(',').map(t => t.trim()) : [];
            } else if (header === 'lat' || header === 'lng') {
                obj[header] = parseFloat(val);
            } else if (header === 'heat') {
                obj[header] = parseFloat(val) || 0.5; 
            } else {
                obj[header] = val;
            }
        });
        
        if (obj.name && !isNaN(obj.lat) && !isNaN(obj.lng)) {
            result.push(obj);
        }
    }
    return result;
}

// 將您原本寫死的資料抽出來當作沒網路時的保底
const LOCAL_SPOTS = [
    { name: "瑞芳火車站", wikiTitle: "瑞芳車站", lat: 25.10875, lng: 121.80597, tags: ["交通", "歷史", "美食"], keywords: ["車站", "龍鳳腿", "胡椒餅", "平溪線"], highlights: "🌟 前往黃金山城與平溪線的轉運大站", food: "龍鳳腿、福州胡椒餅", history: "大正八年(西元1919)五月宜蘭線鐵路八堵至瑞芳段通車，瑞芳正式設火車站。", transport: "🚉 台鐵瑞芳站", address: "新北市瑞芳區龍潭里明燈路三段82號", openTime: "06:00-24:00", heat: 0.9 },
    { name: "九份老街 (基山街)", wikiTitle: "九份", lat: 25.10989, lng: 121.84518, tags: ["熱門打卡", "美食", "歷史"], keywords: ["芋圓", "草仔粿", "紅燈籠"], highlights: "🏮 國際級觀光山城，越夜越美麗", food: "阿柑姨芋圓、金枝紅糟肉圓", history: "早期因採金人潮湧入而繁華，後隨淘金沒落而寧靜。", transport: "客運 788/965/1062 至九份老街", address: "新北市瑞芳區基山街", openTime: "依店家而定", heat: 1.0 },
    { name: "猴硐貓村", wikiTitle: "猴硐貓村", lat: 25.0872, lng: 121.8268, tags: ["熱門打卡", "自然"], keywords: ["貓", "療癒", "咖啡"], highlights: "🐾 CNN推薦！世界六大賞貓景點", food: "貓咪造型鳳梨酥、特色咖啡", history: "起因於愛貓網友的發動，成立志工隊改善村內環境。這裡的貓咪在居民照顧下乾淨不怕人。", transport: "猴硐車站過貓橋即達", heat: 1.0 }
    // 註：為了程式碼簡潔，這裡只放三筆當作離線保底。主要資料依然會從 Google 試算表抓取！
];

export async function fetchSpotsFromSheet() {
    try {
        // 1. 優先嘗試從 Firebase 讀取官方景點
        if (window.rfApp && window.rfApp.firebase && typeof window.rfApp.firebase.getOfficialSpots === 'function') {
            console.log("🔄 嘗試從 Firebase 載入官方景點...");
            const firebaseSpots = await window.rfApp.firebase.getOfficialSpots();
            
            if (firebaseSpots && firebaseSpots.length > 0) {
                spots.length = 0;
                spots.push(...firebaseSpots);
                console.log(`✅ 成功從 Firebase 載入 ${spots.length} 筆官方景點！`);
                return spots;
            }
        }
        
        // 2. 如果 Firebase 沒資料（代表還沒執行轉移），則退回從 Google Sheets 讀取
        console.log("⚠️ Firebase 尚無官方景點，自動退回 Google Sheets 讀取...");
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error("網路連線錯誤");
        
        const csvText = await response.text();
        const cloudSpots = parseCSV(csvText);
        
        spots.length = 0; 
        spots.push(...cloudSpots);
        
        console.log(`✅ 成功從 Google Sheets 載入 ${spots.length} 筆景點資料！`);
        return spots;
        
    } catch (error) {
        console.error("❌ 雲端載入全數失敗，使用備用本機資料", error);
        spots.length = 0;
        spots.push(...LOCAL_SPOTS);
        return spots;
    }
}

// 🌟 將目前的景點資料暴露到全域，方便我們執行「一鍵轉移」
if (typeof window !== 'undefined') {
    window.GLOBAL_SPOTS_DATA = spots;
}
