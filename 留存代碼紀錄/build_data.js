// build_data.js (Node.js 執行腳本)
const fs = require('fs');

// 🌟 1. 設定您的 CSV 檔案路徑 (請確保檔名與您下載的一致，並放在同一資料夾)
const FILES = {
    SPOTS: './新北市觀光旅遊景點(中文-106年更新)-7810482742086527371.csv',
    CENTERS: './新北市旅遊服務中心資訊-8391744535026282090.csv',
    WATER: './新北市禁止或限制水域遊憩活動區域-4453717247843524318.csv',
    BROCHURES: './新北市旅遊摺頁文宣資料-3965004252849977605.csv'
};

// 簡單的 CSV 解析器 (處理逗號與引號)
function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
        // 處理 CSV 中可能含有逗號的引號字串
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        let obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] ? values[i].replace(/(^"|"$)/g, '').trim() : '';
        });
        return obj;
    });
}

console.log('🚀 開始萃取新北市政府 Open Data...');

// 🌟 2. 讀取並篩選資料
const allSpots = parseCSV(FILES.SPOTS);
const allCenters = parseCSV(FILES.CENTERS);
// 備註：水域與摺頁資料可根據景點名稱做關鍵字比對，這裡先建立清單

// 🌟 3. 提煉「瑞芳區」專屬資料
let ruifangData = [];

// 處理一般觀光景點
allSpots.forEach(spot => {
    // 假設官方資料的地址欄位叫做 Add 或 Address
    const address = spot['Add'] || spot['Address'] || '';
    if (address.includes('瑞芳區')) {
        ruifangData.push({
            id: spot['Id'] || `spot_${Math.random().toString(36).substr(2, 9)}`,
            name: spot['Name'] || '未知景點',
            lat: parseFloat(spot['Py']), // 官方通常 Py 是緯度
            lng: parseFloat(spot['Px']), // 官方通常 Px 是經度
            category: '景點',
            description: spot['Toldescribe'] || spot['Description'] || '暫無官方介紹',
            address: address,
            tel: spot['Tel'] || '無',
            openTime: spot['Opentime'] || '全天開放',
            // 預留欄位給進階比對
            warning: spot['Name'].includes('深澳') || spot['Name'].includes('象鼻岩') ? '⚠️ 法規提醒：深澳海域禁止從事橡皮艇活動，違者最高罰 5 萬元。' : 
                     spot['Name'].includes('鼻頭') ? '⚠️ 法規提醒：鼻頭角周邊海域禁止潛水活動。' : '',
            brochureUrl: '' 
        });
    }
});

// 處理旅遊服務中心
allCenters.forEach(center => {
    const address = center['Add'] || center['Address'] || '';
    if (address.includes('瑞芳區') || (center['Name'] && center['Name'].includes('瑞芳'))) {
        ruifangData.push({
            id: `center_${Math.random().toString(36).substr(2, 9)}`,
            name: center['Name'],
            lat: parseFloat(center['Py'] || center['緯度']), 
            lng: parseFloat(center['Px'] || center['經度']), 
            category: '服務中心',
            description: '提供實體地圖、旅遊諮詢、緊急充電與協助。',
            address: address,
            tel: center['Tel'] || center['電話'] || '無',
            openTime: center['Opentime'] || center['服務時間'] || '請致電確認',
            warning: '',
            brochureUrl: ''
        });
    }
});

// 🌟 4. 輸出成完美的 JavaScript 模組
const outputContent = `// 自動生成的瑞芳區官方景點圖資庫\n// 更新時間：${new Date().toLocaleString()}\n\nexport const spots = ${JSON.stringify(ruifangData, null, 4)};\n`;

fs.writeFileSync('./js/data/spots.js', outputContent, 'utf-8');

console.log(`✅ 煉金成功！共提煉出 ${ruifangData.length} 筆瑞芳區專屬圖資！`);
console.log('📂 檔案已儲存至：./js/data/spots.js');
