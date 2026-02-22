// js/modules/weather.js (v650) - 穩定度優化版
export async function fetchWeather() {
    const tempEl = document.getElementById('weather-temp');
    const iconEl = document.querySelector('#weather-box i');
    
    if (!tempEl || !iconEl) return;

    try {
        // 使用瑞芳區中心座標
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&timezone=Asia%2FTaipei');
        
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        
        let iconClass = 'fa-cloud weather-cloud'; 
        
        // 根據 WMO Weather interpretation codes 分類
        if (code === 0) iconClass = 'fa-sun weather-sun'; // 晴天
        else if (code >= 1 && code <= 3) iconClass = 'fa-cloud-sun weather-cloud'; // 多雲
        else if (code >= 51 && code <= 67) iconClass = 'fa-cloud-rain weather-rain'; // 毛毛雨/雨
        else if (code >= 71 && code <= 82) iconClass = 'fa-snowflake'; // 雪 (瑞芳機率極低，但保留)
        else if (code >= 95) iconClass = 'fa-bolt'; // 雷雨
        
        tempEl.innerText = `${temp}°C`; 
        iconEl.className = `fas ${iconClass}`; 
        
    } catch (e) { 
        console.warn("⚠️ 天氣 API 讀取失敗，將於 30 秒後重試", e);
        tempEl.innerText = "--"; 
        iconEl.className = `fas fa-cloud`; // 失敗時顯示靜態雲朵
        
        // 🌟 失敗重試機制：30 秒後自動再抓一次
        setTimeout(fetchWeather, 30000);
    }
}

// 註冊到全域工具箱
window.rfApp = window.rfApp || {};
window.rfApp.ui = window.rfApp.ui || {};
window.rfApp.ui.fetchWeather = fetchWeather;
