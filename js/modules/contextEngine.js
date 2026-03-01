// js/modules/contextEngine.js
import { state } from '../core/store.js';

let currentWeather = null;

export async function initContextEngine() {
    console.log("🌤️ 情境推薦引擎啟動中...");
    try {
        // 瑞芳區的中心經緯度
        const lat = 25.1086;
        const lng = 121.8058;
        
        // 使用完全免費、免申請金鑰的 Open-Meteo 氣象服務 API
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,is_day,weather_code,precipitation&timezone=Asia%2FTaipei`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("天氣 API 發生錯誤");
        const data = await res.json();
        
        const current = data.current;
        currentWeather = {
            temp: Math.round(current.temperature_2m),
            isDay: current.is_day === 1,
            code: current.weather_code, // WMO 氣象代碼
            rain: current.precipitation > 0
        };

        // 取得天氣後，立即分析並顯示推薦
        analyzeContextAndRecommend();

    } catch (err) {
        console.warn("無法取得天氣資訊，隱藏情境推薦:", err);
    }
}

function analyzeContextAndRecommend() {
    if (!currentWeather) return;

    let situation = "good"; 
    let weatherDesc = "晴天";
    let weatherIcon = "☀️";
    
    // WMO 氣象代碼解析 (大於等於 50 代表有雨或雪)
    if (currentWeather.code >= 50 && currentWeather.code <= 99) {
        situation = "rain";
        weatherDesc = "下雨";
        weatherIcon = "🌧️";
    } else if (currentWeather.code >= 1 && currentWeather.code <= 3) {
        weatherDesc = "多雲";
        weatherIcon = "⛅";
    }

    if (!currentWeather.isDay) {
        situation = "night";
        weatherIcon = situation === "rain" ? "🌧️" : "🌙";
        weatherDesc = situation === "rain" ? "雨夜" : "夜晚";
    }

    let suggestMsg = "";
    let suggestTags = [];

    // 🌟 核心大腦：根據當下情境給予最適合的推薦語與標籤
    if (situation === "rain") {
        suggestMsg = "目前有雨 🌧️ 適合逛逛博物館！";
        suggestTags = ["歷史", "博物館", "室內"];
    } else if (situation === "night") {
        suggestMsg = "夜幕低垂 🌙 來點老街美食吧！";
        suggestTags = ["美食", "老街", "夜景"];
    } else {
        if (currentWeather.temp > 28) {
            suggestMsg = `天氣較熱 (${currentWeather.temp}°C) 🥵 推薦海岸秘境！`;
            suggestTags = ["海岸", "自然", "休閒"];
        } else {
            suggestMsg = `天氣舒爽 (${currentWeather.temp}°C) 🍃 超適合走步道！`;
            suggestTags = ["自然", "步道", "歷史"];
        }
    }

    createWeatherWidget(weatherIcon, weatherDesc, currentWeather.temp, suggestMsg, suggestTags);
}

function createWeatherWidget(icon, desc, temp, msg, tags) {
    let widget = document.getElementById('context-weather-widget');
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'context-weather-widget';
        widget.className = 'glass-panel'; // 使用您系統現有的毛玻璃 CSS
        Object.assign(widget.style, {
            position: 'absolute', 
            top: '70px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 1000, 
            padding: '6px 14px', 
            borderRadius: '30px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            cursor: 'pointer', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', 
            width: 'max-content',
            maxWidth: '90%',
            border: '1px solid rgba(255, 255, 255, 0.4)'
        });
        
        document.body.appendChild(widget);

        // 增加懸停互動動畫
        widget.onmouseover = () => widget.style.transform = 'translateX(-50%) scale(1.03) translateY(-2px)';
        widget.onmouseout = () => widget.style.transform = 'translateX(-50%) scale(1) translateY(0)';
    }

    widget.innerHTML = `
        <div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</div>
        <div style="display: flex; flex-direction: column; line-height: 1.3;">
            <span style="font-weight: 800; font-size: 13px; color: var(--text-main);">${temp}°C ${desc}</span>
            <span style="font-size: 12px; color: var(--primary); font-weight: bold;">${msg}</span>
        </div>
        <button style="margin-left: 5px; background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
            AI 推薦
        </button>
    `;

    // 🌟 一鍵篩選：點擊膠囊時，自動過濾出推薦的景點
    widget.onclick = () => {
        if(typeof window.rfApp.map.filterSpots === 'function') {
            const primaryTag = tags[0]; 
            
            // 嘗試尋找畫面上對應的分類按鈕，讓它同時亮起來
            const chips = document.querySelectorAll('#category-chips .chip');
            const targetChip = Array.from(chips).find(c => c.innerText.includes(primaryTag));
            
            // 執行篩選
            window.rfApp.map.filterSpots(primaryTag, targetChip);

            if(typeof window.showToast === 'function') {
                window.showToast(`✨ AI 情境導遊：已為您推薦「${primaryTag}」相關景點！`, 'success');
            }
        }
    };
}
// ==========================================
// 🌟 補回給 search.js 呼叫的狀態獲取函數，防止報錯
// ==========================================
export function getContextualData() {
    if (!currentWeather) return null;
    
    let situation = "good";
    if (currentWeather.code >= 50 && currentWeather.code <= 99) {
        situation = "rain";
    } else if (!currentWeather.isDay) {
        situation = "night";
    }
    
    return {
        weather: situation,
        temp: currentWeather.temp,
        isDay: currentWeather.isDay
    };
}
