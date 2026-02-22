// js/data/lang.js (v656) - 國際化語系資料庫結構擴充版
export const translations = {
    'zh': { 
        // --- 基礎介面 ---
        splash_title: "瑞芳導覽地圖", splash_desc: "精準在地導覽，深度探索山城。", 
        lang: "語言 / Language", enter_map: "進入地圖", 
        feedback_title: "測評問卷與聯絡 / Feedback", form_link: "填寫測評問卷", 
        skip_intro: "啟動時略過開場動畫與說明教學", close: "關閉", 
        settings: "系統設定", theme: "主題顏色", 
        share_map_title: "推薦地圖給好友", share_map: "分享地圖", 
        contact: "聯絡開發團隊", install_app: "將 App 安裝至桌面", manage_fav: "管理收藏夾",
        
        // --- 教學導覽 ---
        tut_title: "功能說明教學", tut_step1_title: "功能說明 (1/2)", 
        tut_search: "搜尋與標籤", tut_add: "長按新增", tut_weather: "天氣資訊", tut_compass: "指北針", 
        tut_next: "下一步", tut_step2_title: "進階功能 (2/2)", 
        tut_nav: "多模式導航", tut_tour: "自動導覽", tut_settings: "設定", tut_share: "分享", 
        tut_prev: "上一步", tut_finish: "開始使用", 
        
        // --- 地圖與卡片 ---
        search_ph: "🔍 搜尋景點、以下推薦或長按新增⋯⋯", locating: "定位中...", 
        food: "在地飲食", highlights: "推薦亮點", history: "簡介歷史", transport: "交通方式", 
        nav: " 導航", ai: " 智慧推薦", 
        chip_all: "🌟 全部", chip_food: "🍜 美食", chip_history: "🏛️ 歷史", chip_nature: "⛰️ 自然", chip_custom: "📍 標記", 

        // 🌟 --- JS 動態提示 (Toast) 新增區 --- 🌟
        toast_gps_success: "✅ 定位成功！實境羅盤已啟動",
        toast_gps_fail: "無法取得定位，請確認已開啟 GPS",
        toast_gps_connecting: "🛰️ GPS 衛星連線中...",
        toast_gps_follow_stop: "已停止位置跟隨",
        toast_gps_reset: "已回到瑞芳中心",
        toast_tts_playing: "🔊 語音導覽播放中...",
        toast_tts_stopped: "🔇 語音導覽已停止",
        toast_tts_unsupport: "您的瀏覽器不支援語音功能",
        toast_fav_add: "❤️ 已加入收藏",
        toast_fav_remove: "💔 已取消收藏",
        toast_copy_success: "✅ 內容已複製到剪貼簿",
        toast_custom_saved: "✅ 秘境已儲存",
        toast_custom_deleted: "🗑️ 標記已刪除",
        toast_network_err: "網路連線異常，請稍後再試"
    },
    'en': { 
        splash_title: "Ruifang Guide", splash_desc: "Accurate local guide in Ruifang.", 
        lang: "Language", enter_map: "Enter Map", 
        feedback_title: "Feedback & Contact", form_link: "Feedback Form", 
        skip_intro: "Skip intro on startup", close: "Close", 
        settings: "Settings", theme: "Theme Color", 
        share_map_title: "Recommend", share_map: "Share Map", 
        contact: "Contact Team", install_app: "Install App", manage_fav: "Manage Favs",
        
        tut_title: "Show Tutorial", tut_step1_title: "Features (1/2)", 
        tut_search: "Search & Tags", tut_add: "Long Press Add", tut_weather: "Weather", tut_compass: "Compass", 
        tut_next: "Next", tut_step2_title: "Advanced (2/2)", 
        tut_nav: "Navigation", tut_tour: "Guided Tour", tut_settings: "Settings", tut_share: "Share", 
        tut_prev: "Back", tut_finish: "Start", 
        
        search_ph: "🔍 Search or long press...", locating: "Locating...", 
        food: "Food", highlights: "Highlights", history: "History", transport: "Transport", 
        nav: " Navigate", ai: " AI Trip", 
        chip_all: "🌟 All", chip_food: "🍜 Food", chip_history: "🏛️ History", chip_nature: "⛰️ Nature", chip_custom: "📍 Custom",

        // 🌟 JS Dynamic
        toast_gps_success: "✅ GPS located! Compass activated",
        toast_gps_fail: "Failed to locate. Please check GPS settings.",
        toast_gps_connecting: "🛰️ Connecting to GPS...",
        toast_gps_follow_stop: "Follow mode stopped",
        toast_gps_reset: "Returned to map center",
        toast_tts_playing: "🔊 Playing audio guide...",
        toast_tts_stopped: "🔇 Audio guide stopped",
        toast_tts_unsupport: "Voice feature not supported by your browser",
        toast_fav_add: "❤️ Added to favorites",
        toast_fav_remove: "💔 Removed from favorites",
        toast_copy_success: "✅ Copied to clipboard",
        toast_custom_saved: "✅ Custom spot saved",
        toast_custom_deleted: "🗑️ Spot deleted",
        toast_network_err: "Network error, please try again"
    },
    'ja': { 
        splash_title: "瑞芳ガイド", splash_desc: "瑞芳の正確なローカルガイド。", 
        lang: "言語", enter_map: "マップへ", 
        feedback_title: "フィードバック / 連絡先", form_link: "アンケート", 
        skip_intro: "起動時にイントロをスキップ", close: "閉じる", 
        settings: "設定", theme: "テーマ色", 
        share_map_title: "友達に勧める", share_map: "マップを共有", 
        contact: "お問い合わせ", install_app: "アプリをインストール", manage_fav: "お気に入りを管理",
        
        tut_title: "チュートリアル", tut_step1_title: "機能 (1/2)", 
        tut_search: "検索とタグ", tut_add: "長押しで追加", tut_weather: "天気", tut_compass: "コンパス", 
        tut_next: "次へ", tut_step2_title: "機能 (2/2)", 
        tut_nav: "ナビゲーション", tut_tour: "自動ガイド", tut_settings: "設定", tut_share: "共有", 
        tut_prev: "戻る", tut_finish: "始める", 
        
        search_ph: "🔍 検索または長押し...", locating: "取得中...", 
        food: "グルメ", highlights: "見どころ", history: "歴史", transport: "アクセス", 
        nav: " ナビ", ai: " ルート", 
        chip_all: "🌟 全て", chip_food: "🍜 食事", chip_history: "🏛️ 歴史", chip_nature: "⛰️ 自然", chip_custom: "📍 カスタム",

        // 🌟 JS Dynamic
        toast_gps_success: "✅ 位置情報を取得しました",
        toast_gps_fail: "位置情報を取得できません",
        toast_gps_connecting: "🛰️ GPSに接続中...",
        toast_gps_follow_stop: "追跡モードを停止しました",
        toast_gps_reset: "中心に戻りました",
        toast_tts_playing: "🔊 音声ガイド再生中...",
        toast_tts_stopped: "🔇 音声ガイドを停止しました",
        toast_tts_unsupport: "お使いのブラウザは音声機能に対応していません",
        toast_fav_add: "❤️ お気に入りに追加しました",
        toast_fav_remove: "💔 お気に入りから削除しました",
        toast_copy_success: "✅ クリップボードにコピーしました",
        toast_custom_saved: "✅ 保存しました",
        toast_custom_deleted: "🗑️ 削除しました",
        toast_network_err: "ネットワークエラー"
    },
    'ko': { 
        splash_title: "루이팡 가이드", splash_desc: "루이팡 지역의 정확한 로컬 가이드.", 
        lang: "언어 / Language", enter_map: "지도 입장", 
        feedback_title: "피드백 / 연락처", form_link: "설문조사", 
        skip_intro: "시작 시 인트로 건너뛰기", close: "닫기", 
        settings: "설정", theme: "테마 색상", 
        share_map_title: "친구에게 추천", share_map: "지도 공유", 
        contact: "개발팀에 문의", install_app: "앱 설치", manage_fav: "즐겨찾기 관리",
        
        tut_title: "튜토리얼 보기", tut_step1_title: "기능 (1/2)", 
        tut_search: "검색 및 태그", tut_add: "길게 눌러 추가", tut_weather: "날씨", tut_compass: "나침반", 
        tut_next: "다음", tut_step2_title: "기능 (2/2)", 
        tut_nav: "내비게이션", tut_tour: "자동 가이드", tut_settings: "설정", tut_share: "공유", 
        tut_prev: "이전", tut_finish: "시작하기", 
        
        search_ph: "🔍 검색 또는 길게 누르기...", locating: "위치 확인 중...", 
        food: "음식", highlights: "하이라이트", history: "역사", transport: "교통", 
        nav: " 내비게이션", ai: " 추천", 
        chip_all: "🌟 전체", chip_food: "🍜 음식", chip_history: "🏛️ 역사", chip_nature: "⛰️ 자연", chip_custom: "📍 마커",

        // 🌟 JS Dynamic
        toast_gps_success: "✅ GPS 위치 확인 완료",
        toast_gps_fail: "위치를 찾을 수 없습니다",
        toast_gps_connecting: "🛰️ GPS 연결 중...",
        toast_gps_follow_stop: "추적 모드 중지됨",
        toast_gps_reset: "지도의 중심으로 돌아갑니다",
        toast_tts_playing: "🔊 음성 안내 재생 중...",
        toast_tts_stopped: "🔇 음성 안내 정지됨",
        toast_tts_unsupport: "브라우저가 음성 기능을 지원하지 않습니다",
        toast_fav_add: "❤️ 즐겨찾기에 추가됨",
        toast_fav_remove: "💔 즐겨찾기에서 제거됨",
        toast_copy_success: "✅ 클립보드에 복사됨",
        toast_custom_saved: "✅ 저장되었습니다",
        toast_custom_deleted: "🗑️ 삭제되었습니다",
        toast_network_err: "네트워크 오류"
    },
    'vi': { 
        splash_title: "Bản đồ Ruifang", splash_desc: "Hướng dẫn du lịch địa phương chính xác nhất.", 
        lang: "Ngôn ngữ", enter_map: "Vào Bản Đồ", 
        feedback_title: "Phản hồi / Liên hệ", form_link: "Bảng câu hỏi", 
        skip_intro: "Bỏ qua giới thiệu", close: "Đóng", 
        settings: "Cài đặt", theme: "Màu chủ đề", 
        share_map_title: "Giới thiệu bạn bè", share_map: "Chia sẻ Bản đồ", 
        contact: "Liên hệ", install_app: "Cài đặt ứng dụng", manage_fav: "Quản lý mục đã lưu",
        
        tut_title: "Xem hướng dẫn", tut_step1_title: "Chức năng (1/2)", 
        tut_search: "Tìm kiếm", tut_add: "Nhấn giữ thêm", tut_weather: "Thời tiết", tut_compass: "La bàn", 
        tut_next: "Tiếp", tut_step2_title: "Chức năng (2/2)", 
        tut_nav: "Điều hướng", tut_tour: "Tour tự động", tut_settings: "Cài đặt", tut_share: "Chia sẻ", 
        tut_prev: "Trước", tut_finish: "Bắt đầu", 
        
        search_ph: "🔍 Tìm kiếm...", locating: "Đang định vị...", 
        food: "Ẩm thực", highlights: "Nổi bật", history: "Lịch sử", transport: "Di chuyển", 
        nav: " Chỉ đường", ai: " Hành trình", 
        chip_all: "🌟 Tất cả", chip_food: "🍜 Ăn", chip_history: "🏛️ Lịch sử", chip_nature: "⛰️ Tự nhiên", chip_custom: "📍 Đã lưu",

        // 🌟 JS Dynamic
        toast_gps_success: "✅ Đã định vị GPS!",
        toast_gps_fail: "Không thể định vị. Vui lòng kiểm tra GPS.",
        toast_gps_connecting: "🛰️ Đang kết nối GPS...",
        toast_gps_follow_stop: "Đã dừng theo dõi",
        toast_gps_reset: "Đã quay lại trung tâm",
        toast_tts_playing: "🔊 Đang phát hướng dẫn...",
        toast_tts_stopped: "🔇 Đã dừng hướng dẫn",
        toast_tts_unsupport: "Trình duyệt không hỗ trợ giọng nói",
        toast_fav_add: "❤️ Đã thêm vào mục yêu thích",
        toast_fav_remove: "💔 Đã xóa khỏi mục yêu thích",
        toast_copy_success: "✅ Đã sao chép vào khay nhớ tạm",
        toast_custom_saved: "✅ Đã lưu địa điểm",
        toast_custom_deleted: "🗑️ Đã xóa",
        toast_network_err: "Lỗi mạng, vui lòng thử lại"
    }
};
