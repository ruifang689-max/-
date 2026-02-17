/**
 * data.js - 瑞芳導覽地圖資料庫
 * 包含：全域變數初始值、景點資料、路線資料、多國語言字典
 */

// =========================================
// 1. 全域變數初始配置
// =========================================
// 這些變數需要在 app.js 使用，因此在全域宣告
var targetSpot = null; 
var currentRoute = null; 
var userPos = null; 
var userMarker = null; 
var currentEditingSpotName = "";
var navMode = 'driving'; 
var tourModeInterval = null; 

// 從 LocalStorage 讀取使用者資料
var myFavs = JSON.parse(localStorage.getItem('ruifang_favs')) || []; 
var savedCustomSpots = JSON.parse(localStorage.getItem('ruifang_custom_spots')) || []; 
var searchHistory = JSON.parse(localStorage.getItem('ruifang_search_history')) || []; 

// =========================================
// 2. 景點資料庫 (Spots Database)
// =========================================
const spots = [
    { name: "瑞芳火車站", lat: 25.108, lng: 121.805, tags: ["交通", "美食"], keywords: ["車站", "龍鳳腿", "胡椒餅"], highlights: "瑞芳美食廣場", food: "龍鳳腿、胡椒餅", history: "平溪線與九份的交通轉運樞紐。", transport: "台鐵瑞芳站" },
    { name: "瑞芳後站老街", lat: 25.109, lng: 121.806, tags: ["歷史", "美食"], keywords: ["保雲芋圓", "老街"], highlights: "瑞芳創始芋圓", food: "保雲芋圓", history: "早期礦工的聚集地。", transport: "步行自後站" },
    { name: "九份老街", lat: 25.1099, lng: 121.8452, tags: ["歷史", "美食"], keywords: ["阿妹茶樓", "芋圓", "山城"], highlights: "阿妹茶樓、豎崎路", food: "阿柑姨芋圓", history: "曾經繁華的黃金山城。", transport: "客運 788/965" },
    { name: "猴硐貓村", lat: 25.086, lng: 121.828, tags: ["歷史"], keywords: ["貓", "瑞三整煤廠"], highlights: "貓咪療癒、煤礦遺跡", food: "礦工麵", history: "曾為全台煤礦產量第一。", transport: "台鐵猴硐站" },
    { name: "金瓜石黃金博物館", lat: 25.1091, lng: 121.8576, tags: ["歷史"], keywords: ["金瓜石", "礦工便當"], highlights: "大金磚、本山五坑", food: "礦工便當", history: "亞洲第一金礦山。", transport: "客運 788/856" },
    { name: "無耳茶壺山", lat: 25.1063, lng: 121.8659, tags: ["自然"], keywords: ["海景", "爬山"], highlights: "絕美海景", food: "無", history: "山形似無耳茶壺。", transport: "金瓜石步行登山" },
    { name: "報時山步道", lat: 25.1118, lng: 121.8587, tags: ["自然"], keywords: ["觀景台", "步道"], highlights: "最輕鬆看海步道", food: "無", history: "日治時期設有警報器。", transport: "勸濟堂步行" },
    { name: "水湳洞陰陽海", lat: 25.1228, lng: 121.8647, tags: ["自然"], keywords: ["海景", "十三層遺址"], highlights: "黃藍交錯海景", food: "無", history: "礦物氧化形成的自然奇觀。", transport: "客運 856" }
];

// =========================================
// 3. 熱門路線資料 (Routes Data)
// =========================================
const routesData = {
    'history': { name: "🏛️ 歷史懷舊線", desc: "瑞芳車站 ➔ 後站老街 ➔ 九份老街 ➔ 黃金博物館", coords: [[25.108, 121.805], [25.109, 121.806], [25.1099, 121.8452], [25.1091, 121.8576]], color: '#8e44ad' },
    'nature': { name: "⛰️ 山海自然線", desc: "瑞芳車站 ➔ 猴硐貓村 ➔ 報時山步道 ➔ 陰陽海", coords: [[25.108, 121.805], [25.086, 121.828], [25.1118, 121.8587], [25.1228, 121.8647]], color: '#27ae60' },
    'food': { name: "🍜 饕客美食線", desc: "瑞芳美食廣場 ➔ 阿柑姨芋圓 ➔ 礦工便當", coords: [[25.108, 121.805], [25.1099, 121.8452], [25.1091, 121.8576]], color: '#d35400' }
};

// 預設路線座標 (舊相容)
const themeRouteCoords = routesData['history'].coords;

// =========================================
// 4. 多國語言字典 (Translations)
// =========================================
const translations = {
    'zh': { splash_title: "瑞芳導覽 App", splash_desc: "精準在地導覽，深度探索山城。", lang: "語言 / Language", enter_map: "進入地圖", feedback_title: "測評問卷與聯絡 / Feedback", form_link: "填寫意見問卷", skip_intro: "啟動時略過開場", tut_title: "功能說明教學", tut_step1_title: "功能說明 (1/2)", tut_search: "搜尋與標籤", tut_add: "長按新增", tut_weather: "天氣資訊", tut_compass: "指北針", tut_next: "下一步", tut_step2_title: "進階功能 (2/2)", tut_nav: "多模式導航", tut_tour: "自動導覽", tut_settings: "設定", tut_share: "分享", tut_prev: "前一步", tut_finish: "開始使用", settings: "系統設定", theme: "主題顏色", share_map_title: "推薦地圖給好友", share_map: "分享地圖", close: "關閉", search_ph: "🔍 搜尋或長按新增...", locating: "定位中...", food: "在地飲食", highlights: "推薦亮點", history: "簡介歷史", transport: "交通方式", nav: " 導航", ai: " 智慧推薦", chip_all: "🌟 全部", chip_food: "🍜 美食", chip_history: "🏛️ 歷史", chip_nature: "⛰️ 自然", chip_custom: "📍 標記", contact: "聯絡開發團隊", install_app: "將 App 安裝至桌面", manage_fav: "管理收藏夾" },
    'en': { splash_title: "Ruifang Guide", splash_desc: "Accurate local guide in Ruifang.", lang: "Language", enter_map: "Enter Map", feedback_title: "Feedback & Contact", form_link: "Feedback Form", skip_intro: "Skip intro on startup", tut_title: "Show Tutorial", tut_step1_title: "Features (1/2)", tut_search: "Search & Tags", tut_add: "Long Press Add", tut_weather: "Weather", tut_compass: "Compass", tut_next: "Next", tut_step2_title: "Advanced (2/2)", tut_nav: "Navigation", tut_tour: "Guided Tour", tut_settings: "Settings", tut_share: "Share", tut_prev: "Back", tut_finish: "Start", settings: "Settings", theme: "Theme Color", share_map_title: "Recommend", share_map: "Share Map", close: "Close", search_ph: "🔍 Search or long press...", locating: "Locating...", food: "Food", highlights: "Highlights", history: "History", transport: "Transport", nav: " Navigate", ai: " AI Trip", chip_all: "🌟 All", chip_food: "🍜 Food", chip_history: "🏛️ History", chip_nature: "⛰️ Nature", chip_custom: "📍 Custom", contact: "Contact", install_app: "Install App", manage_fav: "Manage Favs" },
    'ja': { splash_title: "瑞芳ガイド", splash_desc: "瑞芳の正確なローカルガイド。", lang: "言語", enter_map: "マップへ", feedback_title: "フィードバック / 連絡先", form_link: "アンケート", skip_intro: "起動時にイントロをスキップ", tut_title: "チュートリアル", tut_step1_title: "機能 (1/2)", tut_search: "検索とタグ", tut_add: "長押しで追加", tut_weather: "天気", tut_compass: "コンパス", tut_next: "次へ", tut_step2_title: "機能 (2/2)", tut_nav: "ナビゲーション", tut_tour: "自動ガイド", tut_settings: "設定", tut_share: "共有", tut_prev: "戻る", tut_finish: "始める", settings: "設定", theme: "テーマ色", share_map_title: "友達に勧める", share_map: "マップを共有", close: "閉じる", search_ph: "🔍 検索または長押し...", locating: "取得中...", food: "グルメ", highlights: "見どころ", history: "歴史", transport: "アクセス", nav: " ナビ", ai: " ルート", chip_all: "🌟 全て", chip_food: "🍜 食事", chip_history: "🏛️ 歴史", chip_nature: "⛰️ 自然", chip_custom: "📍 カスタム", contact: "お問い合わせ", install_app: "アプリをインストール", manage_fav: "お気に入りを管理" },
    'ko': { splash_title: "루이팡 가이드", splash_desc: "루이팡 지역의 정확한 로컬 가이드.", lang: "언어 / Language", enter_map: "지도 입장", feedback_title: "피드백 / 연락처", form_link: "설문조사", skip_intro: "시작 시 인트로 건너뛰기", tut_title: "튜토리얼 보기", tut_step1_title: "기능 (1/2)", tut_search: "검색 및 태그", tut_add: "길게 눌러 추가", tut_weather: "날씨", tut_compass: "나침반", tut_next: "다음", tut_step2_title: "기능 (2/2)", tut_nav: "내비게이션", tut_tour: "자동 가이드", tut_settings: "설정", tut_share: "공유", tut_prev: "이전", tut_finish: "시작하기", settings: "설정", theme: "테마 색상", share_map_title: "친구에게 추천", share_map: "지도 공유", close: "닫기", search_ph: "🔍 검색 또는 길게 누르기...", locating: "위치 확인 중...", food: "음식", highlights: "하이라이트", history: "역사", transport: "교통", nav: " 내비게이션", ai: " 추천", chip_all: "🌟 전체", chip_food: "🍜 음식", chip_history: "🏛️ 역사", chip_nature: "⛰️ 자연", chip_custom: "📍 마커", contact: "개발팀에 문의", install_app: "앱 설치", manage_fav: "즐겨찾기 관리" },
    'vi': { splash_title: "Bản đồ Ruifang", splash_desc: "Hướng dẫn du lịch địa phương chính xác nhất.", lang: "Ngôn ngữ", enter_map: "Vào Bản Đồ", feedback_title: "Phản hồi / Liên hệ", form_link: "Bảng câu hỏi", skip_intro: "Bỏ qua giới thiệu", tut_title: "Xem hướng dẫn", tut_step1_title: "Chức năng (1/2)", tut_search: "Tìm kiếm", tut_add: "Nhấn giữ thêm", tut_weather: "Thời tiết", tut_compass: "La bàn", tut_next: "Tiếp", tut_step2_title: "Chức năng (2/2)", tut_nav: "Điều hướng", tut_tour: "Tour tự động", tut_settings: "Cài đặt", tut_share: "Chia sẻ", tut_prev: "Trước", tut_finish: "Bắt đầu", settings: "Cài đặt", theme: "Màu chủ đề", share_map_title: "Giới thiệu bạn bè", share_map: "Chia sẻ Bản đồ", close: "Đóng", search_ph: "🔍 Tìm kiếm...", locating: "Đang định vị...", food: "Ẩm thực", highlights: "Nổi bật", history: "Lịch sử", transport: "Di chuyển", nav: " Chỉ đường", ai: " Hành trình", chip_all: "🌟 Tất cả", chip_food: "🍜 Ăn", chip_history: "🏛️ Lịch sử", chip_nature: "⛰️ Tự nhiên", chip_custom: "📍 Đã lưu", contact: "Liên hệ", install_app: "Cài đặt ứng dụng", manage_fav: "Quản lý mục đã lưu" }
};
