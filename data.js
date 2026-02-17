/**
 * data.js - 瑞芳導覽地圖資料庫 (v201)
 */

var targetSpot = null; 
var currentRoute = null; 
var userPos = null; 
var userMarker = null; 
var currentEditingSpotName = "";
var navMode = 'driving'; 
var tourModeInterval = null; 

var myFavs = JSON.parse(localStorage.getItem('ruifang_favs')) || []; 
var savedCustomSpots = JSON.parse(localStorage.getItem('ruifang_custom_spots')) || []; 
var searchHistory = JSON.parse(localStorage.getItem('ruifang_search_history')) || []; 

// 🌟 修正：加入 wikiTitle，精準對接維基百科；沒有專屬頁面的留空("")直接使用預設圖
const spots = [
    { name: "瑞芳火車站", wikiTitle: "瑞芳車站", lat: 25.108, lng: 121.805, tags: ["交通", "美食"], keywords: ["車站", "龍鳳腿", "胡椒餅"], highlights: "瑞芳美食廣場", food: "龍鳳腿、胡椒餅", history: "平溪線與九份的交通轉運樞紐。", transport: "台鐵瑞芳站" },
    { name: "瑞芳後站老街", wikiTitle: "瑞芳老街", lat: 25.109, lng: 121.806, tags: ["歷史", "美食"], keywords: ["保雲芋圓", "老街"], highlights: "瑞芳創始芋圓", food: "保雲芋圓", history: "早期礦工的聚集地。", transport: "步行自後站" },
    { name: "九份老街", wikiTitle: "九份", lat: 25.1099, lng: 121.8452, tags: ["歷史", "美食"], keywords: ["阿妹茶樓", "芋圓", "山城"], highlights: "阿妹茶樓、豎崎路", food: "阿柑姨芋圓", history: "曾經繁華的黃金山城。", transport: "客運 788/965" },
    { name: "猴硐貓村", wikiTitle: "猴硐貓村", lat: 25.086, lng: 121.828, tags: ["歷史"], keywords: ["貓", "瑞三整煤廠"], highlights: "貓咪療癒、煤礦遺跡", food: "礦工麵", history: "曾為全台煤礦產量第一。", transport: "台鐵猴硐站" },
    { name: "金瓜石黃金博物館", wikiTitle: "新北市立黃金博物館", lat: 25.1091, lng: 121.8576, tags: ["歷史"], keywords: ["金瓜石", "礦工便當"], highlights: "大金磚、本山五坑", food: "礦工便當", history: "亞洲第一金礦山。", transport: "客運 788/856" },
    { name: "無耳茶壺山", wikiTitle: "無耳茶壺山", lat: 25.1063, lng: 121.8659, tags: ["自然"], keywords: ["海景", "爬山"], highlights: "絕美海景", food: "無", history: "山形似無耳茶壺。", transport: "金瓜石步行登山" },
    { name: "報時山步道", wikiTitle: "", lat: 25.1118, lng: 121.8587, tags: ["自然"], keywords: ["觀景台", "步道"], highlights: "最輕鬆看海步道", food: "無", history: "日治時期設有警報器。", transport: "勸濟堂步行" },
    { name: "水湳洞陰陽海", wikiTitle: "陰陽海", lat: 25.1228, lng: 121.8647, tags: ["自然"], keywords: ["海景", "十三層遺址"], highlights: "黃藍交錯海景", food: "無", history: "礦物氧化形成的自然奇觀。", transport: "客運 856" }
];

const routesData = {
    'history': { name: "🏛️ 歷史懷舊線", desc: "瑞芳車站 ➔ 後站老街 ➔ 九份老街 ➔ 黃金博物館", coords: [[25.108, 121.805], [25.109, 121.806], [25.1099, 121.8452], [25.1091, 121.8576]], color: '#8e44ad' },
    'nature': { name: "⛰️ 山海自然線", desc: "瑞芳車站 ➔ 猴硐貓村 ➔ 報時山步道 ➔ 陰陽海", coords: [[25.108, 121.805], [25.086, 121.828], [25.1118, 121.8587], [25.1228, 121.8647]], color: '#27ae60' },
    'food': { name: "🍜 饕客美食線", desc: "瑞芳美食廣場 ➔ 阿柑姨芋圓 ➔ 礦工便當", coords: [[25.108, 121.805], [25.1099, 121.8452], [25.1091, 121.8576]], color: '#d35400' }
};

const themeRouteCoords = routesData['history'].coords;

const translations = {
    'zh': { splash_title: "瑞芳導覽 App", splash_desc: "精準在地導覽，深度探索山城。", lang: "語言 / Language", enter_map: "進入地圖", feedback_title: "測評問卷與聯絡 / Feedback", form_link: "填寫意見問卷", skip_intro: "啟動時略過開場", tut_title: "功能說明教學", tut_step1_title: "功能說明 (1/2)", tut_search: "搜尋與標籤", tut_add: "長按新增", tut_weather: "天氣資訊", tut_compass: "指北針", tut_next: "下一步", tut_step2_title: "進階功能 (2/2)", tut_nav: "多模式導航", tut_tour: "自動導覽", tut_settings: "設定", tut_share: "分享", tut_prev: "前一步", tut_finish: "開始使用", settings: "系統設定", theme: "主題顏色", share_map_title: "推薦地圖給好友", share_map: "分享地圖", close: "關閉", search_ph: "🔍 搜尋或長按新增...", locating: "定位中...", food: "在地飲食", highlights: "推薦亮點", history: "簡介歷史", transport: "交通方式", nav: " 導航", ai: " 智慧推薦", chip_all: "🌟 全部", chip_food: "🍜 美食", chip_history: "🏛️ 歷史", chip_nature: "⛰️ 自然", chip_custom: "📍 標記", contact: "聯絡開發團隊", install_app: "將 App 安裝至桌面", manage_fav: "管理收藏夾" },
    'en': { splash_title: "Ruifang Guide", splash_desc: "Accurate local guide in Ruifang.", lang: "Language", enter_map: "Enter Map", feedback_title: "Feedback & Contact", form_link: "Feedback Form", skip_intro: "Skip intro on startup", tut_title: "Show Tutorial", tut_step1_title: "Features (1/2)", tut_search: "Search & Tags", tut_add: "Long Press Add", tut_weather: "Weather", tut_compass: "Compass", tut_next: "Next", tut_step2_title: "Advanced (2/2)", tut_nav: "Navigation", tut_tour: "Guided Tour", tut_settings: "Settings", tut_share: "Share", tut_prev: "Back", tut_finish: "Start", settings: "Settings", theme: "Theme Color", share_map_title: "Recommend", share_map: "Share Map", close: "Close", search_ph: "🔍 Search or long press...", locating: "Locating...", food: "Food", highlights: "Highlights", history: "History", transport: "Transport", nav: " Navigate", ai: " AI Trip", chip_all: "🌟 All", chip_food: "🍜 Food", chip_history: "🏛️ History", chip_nature: "⛰️ Nature", chip_custom: "📍 Custom", contact: "Contact", install_app: "Install App", manage_fav: "Manage Favs" }
};
