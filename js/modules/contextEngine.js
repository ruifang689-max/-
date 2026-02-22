// js/modules/contextEngine.js (v631) - 情境感知引擎

export function getContextualData() {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 1-12 月

    // 1. 時間感知邏輯
    let timeContext = { greeting: "你好！", suggestTag: "自然" };
    if (hour >= 5 && hour < 11) {
        timeContext = { greeting: "⛅ 早安，開啟一天的旅程！", suggestTag: "自然" };
    } else if (hour >= 11 && hour < 14) {
        timeContext = { greeting: "🍲 午安，肚子餓了嗎？", suggestTag: "美食" };
    } else if (hour >= 14 && hour < 18) {
        timeContext = { greeting: "☕ 下午好，找個地方放鬆吧！", suggestTag: "歷史" };
    } else {
        // 晚上 18:00 到凌晨 4:59
        timeContext = { greeting: "🌙 夜幕降臨，想看夜景嗎？", suggestTag: "夜景" }; 
    }

    // 2. 季節感知邏輯 (針對瑞芳氣候特製)
    let seasonContext = { season: "在地探索", keywords: ["九份", "金瓜石"] };
    if (month >= 3 && month <= 5) {
        seasonContext = { season: "🌸 春暖花開", keywords: ["自然", "秘境"] };
    } else if (month >= 6 && month <= 8) {
        seasonContext = { season: "🌊 夏日消暑", keywords: ["瀑布", "海", "水湳洞"] };
    } else if (month >= 9 && month <= 11) {
        seasonContext = { season: "🌾 秋芒搖曳", keywords: ["自然", "歷史", "不厭亭"] };
    } else {
        seasonContext = { season: "❄️ 冬日山城", keywords: ["美食", "博物館", "咖啡"] };
    }

    return { timeContext, seasonContext };
}
