// js/data/spots.js (v408)
export const spots = [
    // --- 瑞芳市區 ---
    { name: "瑞芳火車站", wikiTitle: "瑞芳車站", lat: 25.108, lng: 121.805, tags: ["交通", "美食"], keywords: ["車站", "龍鳳腿", "胡椒餅"], highlights: "交通轉運樞紐", food: "龍鳳腿、胡椒餅", history: "平溪線與九份的進出門戶。", transport: "台鐵瑞芳站", heat: 0.6 },
    { name: "瑞芳老街", wikiTitle: "", lat: 25.10958, lng: 121.80656, tags: ["歷史", "美食"], keywords: ["保雲芋圓", "老街", "古厝"], highlights: "後站古厝群", food: "保雲芋圓", history: "清領時期商店匯集處，早期礦工聚集地。", transport: "瑞芳車站後站步行", heat: 0.5 },
    { name: "瑞芳美食廣場", wikiTitle: "", lat: 25.10685, lng: 121.80567, tags: ["美食"], keywords: ["室內", "小吃"], highlights: "在地美食匯集", food: "胡椒餅、牛肉麵", history: "瑞芳室內美食天堂。", transport: "瑞芳車站步行3分", heat: 0.9 },
    
    // --- 四腳亭 ---
    { name: "四腳亭", wikiTitle: "四腳亭車站", lat: 25.10439, lng: 121.76272, tags: ["古道", "歷史"], keywords: ["砲台", "古道"], highlights: "四腳亭砲台", food: "橋頭排骨麵", history: "早期通往宜蘭的重要古道據點，擁有最大內陸防禦砲台。", transport: "台鐵四腳亭站", heat: 0.4 },

    // --- 猴硐地區 ---
    { name: "猴硐車站", wikiTitle: "猴硐車站", lat: 25.08732, lng: 121.82704, tags: ["交通", "歷史"], keywords: ["鐵道", "煤礦"], highlights: "貓咪與鐵道", food: "礦工麵", history: "昔日產煤第一鎮。", transport: "台鐵猴硐站", heat: 0.8 },
    { name: "猴硐貓村", wikiTitle: "猴硐貓村", lat: 25.08721, lng: 121.8268, tags: ["熱門打卡"], keywords: ["貓", "療癒"], highlights: "親近貓咪", food: "貓咪咖啡", history: "以貓咪與工業遺跡修復聞名的療癒貓街。", transport: "猴硐車站天橋過後", heat: 0.9 },
    { name: "瑞三鑛業整煤場", wikiTitle: "", lat: 25.08649, lng: 121.82758, tags: ["古蹟"], keywords: ["煤礦", "遺址"], highlights: "整煤歷史", food: "無", history: "全台最大選煉煤遺址。", transport: "猴硐車站出口即達", heat: 0.9 },
    { name: "猴硐煤礦博物園區", wikiTitle: "猴硐煤礦博物園區", lat: 25.08666, lng: 121.82781, tags: ["歷史"], keywords: ["導覽", "礦坑"], highlights: "礦坑導覽", food: "無", history: "保存礦工生活足跡。", transport: "猴硐車站步行", heat: 0.7 },
    { name: "猴硐舊隧道群", wikiTitle: "", lat: 25.09095, lng: 121.83089, tags: ["遺跡"], keywords: ["隧道", "鐵道"], highlights: "隧道光影", food: "無", history: "鐵道舊線隧道。", transport: "猴硐往三貂嶺步行", heat: 0.5 },

    // --- 三貂嶺地區 ---
    { name: "三貂嶺車站", wikiTitle: "三貂嶺車站", lat: 25.06066, lng: 121.82264, tags: ["秘境", "交通"], keywords: ["鐵道", "深山"], highlights: "鐵道拍攝", food: "在地麵食", history: "全台唯一火車無法直達的車站(出站無公路)。", transport: "台鐵三貂嶺站", heat: 0.7 },
    { name: "三貂嶺瀑布群", wikiTitle: "三貂嶺瀑布群", lat: 25.06157, lng: 121.81184, tags: ["自然", "登山"], keywords: ["瀑布", "步道"], highlights: "多層瀑布", food: "無", history: "壯闊的原始森林瀑布，連結三貂嶺與猴硐。", transport: "三貂嶺站步行起點", heat: 0.8 },
    { name: "三貂嶺隧道自行車道", wikiTitle: "三貂嶺隧道", lat: 25.06452, lng: 121.8231, tags: ["休閒", "隧道"], keywords: ["單車", "生態"], highlights: "舊線重啟", food: "無", history: "百年隧道改建之環保自行車道。", transport: "三貂嶺站步行/單車", heat: 0.7 },

    // --- 九份商圈 ---
    { name: "九份老街", wikiTitle: "九份", lat: 25.10988, lng: 121.84523, tags: ["熱門打卡", "歷史"], keywords: ["基山街", "夜景"], highlights: "黃金山城", food: "草仔粿、魚丸湯", history: "採金時期的繁華山城，建築依山而建。", transport: "瑞芳轉客運 788/965", heat: 1.0 },
    { name: "昇平戲院", wikiTitle: "昇平戲院", lat: 25.10862, lng: 121.84337, tags: ["古蹟"], keywords: ["電影", "懷舊"], highlights: "懷舊戲院", food: "無", history: "曾為全台最大戲院，見證九份繁華。", transport: "九份老街步行", heat: 0.7 },
    { name: "阿妹茶樓", wikiTitle: "", lat: 25.10856, lng: 121.8436, tags: ["地標", "美食"], keywords: ["紅燈籠", "茶"], highlights: "紅燈籠景觀", food: "茶飲", history: "九份極具代表性的地景建築。", transport: "豎崎路階梯旁", heat: 1.0 },
    { name: "阿柑姨芋圓", wikiTitle: "", lat: 25.10765, lng: 121.84365, tags: ["美食"], keywords: ["芋圓", "海景"], highlights: "景觀座位區", food: "芋圓", history: "九份代表性美食。", transport: "九份老街上方", heat: 0.9 },
    { name: "金枝紅糟肉圓", wikiTitle: "", lat: 25.10855, lng: 121.84391, tags: ["美食"], keywords: ["肉圓", "老店"], highlights: "傳統美食", food: "紅糟肉圓", history: "老街必吃老店。", transport: "九份老街內", heat: 0.8 },

    // --- 金瓜石地區 ---
    { name: "金瓜石黃金博物館", wikiTitle: "新北市立黃金博物館", lat: 25.10617, lng: 121.85961, tags: ["歷史", "礦業"], keywords: ["金礦", "本山五坑"], highlights: "摸大金磚", food: "礦工便當", history: "亞洲第一金礦山，展示採金歷史遺址。", transport: "客運 788/856", heat: 0.9 },
    { name: "祈堂老街", wikiTitle: "", lat: 25.1095, lng: 121.85868, tags: ["老街"], keywords: ["彩虹階梯", "文青"], highlights: "彩虹階梯", food: "老街咖啡", history: "金瓜石早期商業中心。", transport: "黃金博物館附近步行", heat: 0.7 },
    { name: "無耳茶壺山", wikiTitle: "無耳茶壺山", lat: 25.10637, lng: 121.86596, tags: ["自然", "登山"], keywords: ["海景", "芒草"], highlights: "絕美海景", food: "無", history: "因狀似無耳茶壺而得名。", transport: "勸濟堂步行登山", heat: 0.8 },
    { name: "報時山步道", wikiTitle: "", lat: 25.1118, lng: 121.8587, tags: ["自然", "休閒"], keywords: ["觀景台", "步道"], highlights: "最輕鬆看海步道", food: "無", history: "日治時期設有警報器。", transport: "勸濟堂步行", heat: 0.8 },

    // --- 水湳洞與海岸線 ---
    { name: "水湳洞陰陽海", wikiTitle: "陰陽海", lat: 25.12295, lng: 121.86411, tags: ["自然", "奇景"], keywords: ["海景", "雙色"], highlights: "黃藍交錯海景", food: "無", history: "天然礦物離子氧化形成的自然奇觀。", transport: "客運 856 / 台2線", heat: 0.8 },
    { name: "十三層遺址", wikiTitle: "水湳洞選煉廠遺址", lat: 25.11826, lng: 121.86465, tags: ["工業遺址"], keywords: ["點燈", "龐貝城"], highlights: "台版天空之城", food: "無", history: "水湳洞選煉廠遺址。", transport: "長仁社區附近 / 客運水湳洞站", heat: 0.9 },
    { name: "黃金瀑布", wikiTitle: "黃金瀑布", lat: 25.11713, lng: 121.86148, tags: ["自然", "地標"], keywords: ["瀑布", "金黃岩石"], highlights: "金黃岩石", food: "無", history: "礦體與地下水作用形成。", transport: "客運 856 / 886", heat: 0.9 },
    { name: "長仁亭", wikiTitle: "", lat: 25.11918, lng: 121.86606, tags: ["觀景台"], keywords: ["俯瞰", "攝影"], highlights: "俯瞰十三層", food: "無", history: "最佳十三層攝影點。", transport: "長仁社區步行", heat: 0.6 },
    { name: "水湳洞長階梯", wikiTitle: "", lat: 25.12187, lng: 121.86056, tags: ["打卡"], keywords: ["階梯", "日系"], highlights: "日系美照點", food: "無", history: "濂洞國小旁階梯。", transport: "水湳洞步行", heat: 0.7 },

    // --- 深澳與鼻頭角 ---
    { name: "深澳鐵道自行車", wikiTitle: "深澳線", lat: 25.12901, lng: 121.81439, tags: ["休閒", "交通"], keywords: ["單車", "海景"], highlights: "隧道光影", food: "無", history: "廢棄鐵道改建，最受歡迎的海景Rail Bike。", transport: "瑞芳站轉乘客運/公車", heat: 0.8 },
    { name: "深澳象鼻岩", wikiTitle: "", lat: 25.133, lng: 121.824, tags: ["自然景觀"], keywords: ["海蝕", "奇岩"], highlights: "海蝕奇岩", food: "小卷米粉、鯊魚羹", history: "曾為重要煤礦輸出港，現以海蝕地形聞名。", transport: "瑞芳站轉公車T99、791", heat: 0.8 },
    { name: "鼻頭角步道", wikiTitle: "鼻頭角", lat: 25.12588, lng: 121.92028, tags: ["自然景觀", "休閒"], keywords: ["看海", "稜谷"], highlights: "台版萬里長城", food: "周邊海產", history: "瑞芳東北角的岬角。", transport: "客運 856 / 886", heat: 0.7 },
    { name: "鼻頭角燈塔", wikiTitle: "鼻頭角燈塔", lat: 25.12877, lng: 121.92346, tags: ["地標"], keywords: ["燈塔", "海景"], highlights: "燈塔海景", food: "無", history: "建於1896年，守護北台灣海域。", transport: "步行自鼻頭角步道", heat: 0.8 }
];
