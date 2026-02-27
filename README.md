【瑞芳導覽地圖網頁架構圖】

Github公共代碼網域：
https://ruifang689-max.github.io/-/

瑞芳導覽地圖：
https://github.com/ruifang689-max/-.git

📂 您的專案資料夾/
 ├── 📄 index.html             (網頁主框架、UI 骨架、彈出視窗定義)
 ├── 📄 style.css              (此檔案如果已清空或被模組化 CSS 取代，可考慮刪除)
 ├── 📄 sw.js                  (PWA 核心：Service Worker，負責離線快取與背景運作)
 ├── 📄 manifest.json          (PWA 設定檔：定義手機安裝的 App 名稱、圖示與顏色)
 ├── 📄 sitemap.xml            (網站地圖：提交給 Google 搜尋引擎，幫助 SEO 排名)
 ├── 📄 robots.txt             (爬蟲協議：告訴搜尋引擎哪些頁面可以抓取)
 ├── 📄 googlea075ccf2b6acb00a.html (Google Search Console 的網域擁有權驗證檔)
 │
 ├── 📂 js/ (🌟 專門放程式碼的資料夾)
 │   ├── 📄 main.js           (🏁 系統總司令：負責組裝與安全啟動所有模組)
 │   ├── 📂 core/             (核心引擎)
 │   │   ├── 📄 store.js      (全域狀態與資料記憶，負責攔截並自動存入 LocalStorage)
 │   │   ├── 📄 map.js        (Leaflet 地圖引擎初始化與底圖切換)
 │   │   └── 📄 events.js     (事件廣播網，讓模組間可以不綁定互相溝通)
 │   ├── 📂 data/             (靜態資料與雲端橋樑)
 │   │   ├── 📄 boundary.js   (瑞芳區劃界線的 GeoJSON 座標資料)
 │   │   ├── 📄 spots.js      (向 Google 試算表抓取 CSV 並解析的動態景點引擎)
 │   │   ├── 📄 routes.js     (推薦的觀光路線資料包)
 │   │   └── 📄 lang.js       (多國語言字典檔)
 │   └── 📂 modules/          (獨立功能模組)
 │       ├── 📄 weather.js    (天氣 API 串接)
 │       ├── 📄 gps.js        (GPS 定位與使用者位置追蹤)
 │       ├── 📄 announcer.js  (畫面上方跑馬燈報幕器)
 │       ├── 📄 markers.js    (圖釘生成與叢集 Cluster 渲染)
 │       ├── 📄 cards.js      (預覽小卡與資訊大卡滑動互動)
 │       ├── 📄 search.js     (景點搜尋、分類過濾、歷史紀錄)
 │       ├── 📄 navigation.js (OSRM 路線導航引擎)
 │       ├── 📄 firebase-sync.js (Firebase 登入驗證與雲端備份同步)
 │       ├── 📄 customSpots.js(自訂秘境引擎，含開發者權限與寫入 Google Sheets)
 │       ├── 📄 favorites.js  (收藏夾的新增與移除邏輯)
 │       ├── 📄 nearby.js     (周邊雷達：計算使用者與景點距離)
 │       ├── 📄 theme.js      (動態主題色切換)
 │       ├── 📄 toast.js      (全域防護網與黑色提示訊息框)
 │       ├── 📄 pwa.js        (處理安裝 App 至手機桌面的教學彈窗)
 │       └── 📄 ui.js         (UI 總管：設定視窗、側邊欄、原生分享功能)
 │
 ├── 📂 css/ (🌟 全新的樣式模組資料夾)
 │   ├── 📄 variables.css     (全域變數：顏色、字體、統一的 Z-index 層級設定)
 │   ├── 📄 base.css          (基礎設定：網頁歸零 reset、捲軸樣式、通用 body 設定)
 │   ├── 📄 layout.css        (大排版：地圖容器、開場動畫幕、背景遮罩)
 │   ├── 📄 main.css          (主要的樣式匯總，或是遺留的通用樣式)
 │   └── 📂 components/       (🌟 獨立元件：與您的 js/modules 對應)
 │       ├── 📄 markers.css   (圖釘與標籤的動畫與排版專屬)
 │       ├── 📄 cards.css     (資訊卡片的外觀與手勢排版專屬)
 │       ├── 📄 panel.css     (側邊功能列與選單專屬)
 │       ├── 📄 modals.css    (設定視窗、教學彈窗專屬)
 │       ├── 📄 forms.css     (搜尋列、輸入框、按鈕通用樣式)
 │       └── 📄 tour.css      (導覽教學的遮罩與對話框專屬)
 │
 ├── 📂 assets/images/spots/  (🌟 專門放資訊卡圖片的資料夾)
 │   └── 🖼️ 深澳漁港.jpg        (深澳漁港圖片，可透過 ./assets/... 路徑寫入試算表)
 │
 ├── 📂 icon/ (🌟 專門放 PWA 網頁圖示的資料夾)
 │   ├── 🖼️ icon-192.png       (瑞，金 - 適合 Android 手機與一般圖示)
 │   └── 🖼️ icon-512.png       (瑞，黑 - 適合高解析度螢幕與啟動畫面)
 │
 ├── 📂 fonts/ (🌟 專門放自訂字體的資料夾)
 │   └── 🔠 jf-openhuninn-2.1.woff2 (粉圓字體，讓 App 具備溫暖手寫感)
 │
 ├── 📂 .vscode/ (🌟 VS Code 編輯器專屬設定)
 │   └── 📄 settings.json     (記錄您在編輯器裡的設定，例如排版規則、字體大小等。不影響網頁運行。)
 │
 └── 📂 留存代碼紀錄/ (🌟 開發歷程、企劃與備份檔案)
      ├── 📄 build_data.js    (資料建置腳本：過去用來轉換資料格式的 Node.js 腳本，目前改用試算表後為備份用)
      └── 📄 地域標籤(九大區域)  (企劃參考文件：記錄瑞芳 9 大分區標籤的文本文件，方便建立資料庫時對照)
