// js/modules/weather.js (v707) - 智慧氣象儀表板 (i18n + Store整合版)
import { state } from '../core/store.js';

let isDashboardInjected = false;
let isFetching = false;

// 輔助：取得翻譯
const getT = (key) => window.rfApp?.t ? window.rfApp.t(key) : key;

// WMO 天氣代碼轉換表
const getWeatherInfo = (code) => {
    const t = getT;
    // 0:晴, 1-3:多雲, 45-48:霧, 51-67:雨, 71-77:雪, 80-82:陣雨, 95-99:雷雨
    if (code === 0) return { icon: 'fa-sun', name: t('wmo_clear'), class: 'weather-sun' };
    if (code <= 3) return { icon: 'fa-cloud-sun', name: t('wmo_cloudy'), class: 'weather-cloud' };
    if (code <= 48) return { icon: 'fa-smog', name: t('wmo_fog'), class: 'weather-cloud' };
    if (code <= 67 || (code >= 80 && code <= 82)) return { icon: 'fa-cloud-rain', name: t('wmo_rain'), class: 'weather-rain' };
    if (code >= 95) return { icon: 'fa-bolt', name: t('wmo_storm'), class: 'weather-rain' };
    return { icon: 'fa-cloud', name: '--', class: '' };
};

// 🌟 1. 動態注入儀表板 DOM 與 CSS (惰性載入)
function injectDashboard() {
    if (isDashboardInjected) return;
    
    // CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #dashboard-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 3000; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.3s; backdrop-filter: blur(2px); }
        #dashboard-overlay.active { opacity: 1; pointer-events: auto; }
        
        .dash-container { background: var(--bg-color, #f8f9fa); width: 100%; max-height: 85vh; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 -5px 20px rgba(0,0,0,0.2); overflow-y: auto; padding-bottom: 30px; }
        #dashboard-overlay.active .dash-container { transform: translateY(0); }
        
        /* 針對玻璃風格的適配 */
        body.skin-glass .dash-container { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); }

        .dash-header { padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; }
        .dash-title { font-size: 20px; font-weight: bold; color: var(--text-main); display: flex; align-items: center; gap: 8px; }
        .dash-close { background: #eee; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        
        .dash-main-card { margin: 0 20px 20px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 25px; color: white; display: flex; flex-direction: column; align-items: center; box-shadow: 0 10px 25px rgba(118, 75, 162, 0.4); position: relative; overflow: hidden; }
        .dash-main-card.sunny { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); box-shadow: 0 10px 25px rgba(253, 160, 133, 0.4); }
        .dash-main-card.rainy { background: linear-gradient(135deg, #3a1c71 0%, #d76d77 100%); }
        
        .main-temp { font-size: 64px; font-weight: bold; line-height: 1; margin: 10px 0; letter-spacing: -2px; }
        .main-status { font-size: 20px; font-weight: 500; opacity: 0.9; margin-bottom: 5px; }
        .main-meta { font-size: 14px; opacity: 0.8; display: flex; gap: 15px; margin-top: 10px; }
        .main-icon-bg { position: absolute; right: -20px; bottom: -20px; font-size: 140px; opacity: 0.15; transform: rotate(-15deg); }

        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 20px 20px 20px; }
        .dash-item { background: white; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        body.dark-mode .dash-item { background: #2c2c2c; }
        .item-label { font-size: 12px; color: var(--text-sub); font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .item-val { font-size: 18px; font-weight: bold; color: var(--text-main); }

        .forecast-list { padding: 0 20px; display: flex; flex-direction: column; gap: 10px; }
        .forecast-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: rgba(0,0,0,0.03); border-radius: 12px; }
        .forecast-day { width: 60px; font-weight: bold; color: var(--text-main); font-size: 14px; }
        .forecast-icon { flex: 1; text-align: center; font-size: 18px; color: var(--text-sub); }
        .forecast-rain { width: 60px; text-align: right; font-size: 12px; color: #3498db; font-weight: bold; display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
        .forecast-temp { width: 70px; text-align: right; font-weight: bold; color: var(--text-main); font-size: 14px; }
    `;
    document.head.appendChild(style);

    // HTML
    const div = document.createElement('div');
    div.id = 'dashboard-overlay';
    div.innerHTML = `
        <div class="dash-container">
            <div class="dash-header">
                <div class="dash-title"><i class="fas fa-chart-pie" style="color:var(--primary)"></i> <span data-i18n="weather_dash_title">氣象儀表板</span></div>
                <button class="dash-close" onclick="toggleDashboard()"><i class="fas fa-times"></i></button>
            </div>
            
            <div id="dash-main-card" class="dash-main-card">
                <div id="dash-main-location" style="font-size:16px; opacity:0.9;"><i class="fas fa-map-marker-alt"></i> Loading...</div>
                <div id="dash-main-temp" class="main-temp">--°</div>
                <div id="dash-main-status" class="main-status">--</div>
                <div class="main-meta">
                    <span><i class="fas fa-temperature-high"></i> <span id="dash-feel">--</span></span>
                    <span><i class="fas fa-wind"></i> <span id="dash-wind">--</span></span>
                </div>
                <i id="dash-bg-icon" class="fas fa-cloud main-icon-bg"></i>
            </div>

            <div class="dash-grid">
                <div class="dash-item">
                    <span class="item-label"><i class="fas fa-tint" style="color:#3498db"></i> <span data-i18n="humidity">濕度</span></span>
                    <span class="item-val" id="dash-humidity">--%</span>
                </div>
                <div class="dash-item">
                    <span class="item-label"><i class="fas fa-sun" style="color:#f39c12"></i> <span data-i18n="uv_index">紫外線</span></span>
                    <span class="item-val" id="dash-uv">--</span>
                </div>
                <div class="dash-item">
                    <span class="item-label"><i class="fas fa-eye" style="color:#9b59b6"></i> <span data-i18n="rain_prob">降雨機率</span></span>
                    <span class="item-val" id="dash-prob">--%</span>
                </div>
                <div class="dash-item">
                    <span class="item-label"><i class="fas fa-clock" style="color:#e74c3c"></i> <span data-i18n="sunset">日落</span></span>
                    <span class="item-val" id="dash-sunset">--:--</span>
                </div>
            </div>

            <div style="padding: 10px 25px 5px 25px; font-weight:bold; color:var(--text-sub); font-size:13px;">7 Days Forecast</div>
            <div class="forecast-list" id="forecast-list"></div>
        </div>
    `;
    document.body.appendChild(div);
    
    // 點擊背景關閉
    div.addEventListener('click', (e) => {
        if(e.target === div) window.toggleDashboard();
    });

    isDashboardInjected = true;
}

// 🌟 2. 核心功能：抓取與更新數據
export async function fetchWeather() {
    if (isFetching) return;
    injectDashboard();
    isFetching = true;

    // 定義 UI 元素 (小方塊 + 大儀表板)
    const topTempEl = document.getElementById('weather-temp');
    const topBoxEl = document.getElementById('weather-box');
    
    // 預設位置 (瑞芳)
    let lat = 25.1087, lng = 121.8060, locName = "Ruifang";
    
    // 如果使用者有開啟 GPS，就用他的位置
    if (state.userLocation && state.userLocation.lat) {
        lat = state.userLocation.lat;
        lng = state.userLocation.lng;
        locName = "Current Location";
    }

    // 更新儀表板標題狀態
    const mainLocEl = document.getElementById('dash-main-location');
    if(mainLocEl) mainLocEl.innerText = getT('loading_weather') || "Updating...";

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m&hourly=uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        const current = data.current;
        const daily = data.daily;

        // --- A. 更新首頁小方塊 ---
        const wInfo = getWeatherInfo(current.weather_code);
        if (topTempEl) topTempEl.innerText = `${Math.round(current.temperature_2m)}°`;
        if (topBoxEl) {
            topBoxEl.innerHTML = `<i class="fas ${wInfo.icon} ${wInfo.class}"></i><span id="weather-temp">${Math.round(current.temperature_2m)}°</span>`;
            // 點擊開啟儀表板
            topBoxEl.onclick = window.toggleDashboard;
        }

        // --- B. 更新儀表板主卡片 ---
        if(mainLocEl) mainLocEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${locName}`;
        document.getElementById('dash-main-temp').innerText = `${Math.round(current.temperature_2m)}°`;
        document.getElementById('dash-main-status').innerText = wInfo.name;
        document.getElementById('dash-feel').innerText = `${getT('feel_like')}: ${Math.round(current.apparent_temperature)}°`;
        document.getElementById('dash-wind').innerText = `${current.wind_speed_10m} km/h`;
        
        const bgIcon = document.getElementById('dash-bg-icon');
        bgIcon.className = `fas ${wInfo.icon} main-icon-bg`;
        
        // 動態更換卡片背景顏色
        const mainCard = document.getElementById('dash-main-card');
        mainCard.className = 'dash-main-card'; // 重置
        if(current.weather_code <= 3) mainCard.classList.add('sunny');
        else if(current.weather_code >= 51) mainCard.classList.add('rainy');

        // --- C. 更新詳細數據格 ---
        document.getElementById('dash-humidity').innerText = `${current.relative_humidity_2m}%`;
        
        // 取得目前小時的 UV
        const hourIndex = new Date().getHours();
        const uv = data.hourly.uv_index[hourIndex] || 0;
        document.getElementById('dash-uv').innerText = uv;
        
        // 今日降雨機率與日落
        const todayProb = daily.precipitation_probability_max[0] || 0;
        document.getElementById('dash-prob').innerText = `${todayProb}%`;
        const sunsetTime = new Date(daily.sunset[0]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        document.getElementById('dash-sunset').innerText = sunsetTime;

        // --- D. 更新未來預報清單 ---
        let forecastHTML = '';
        for(let i=1; i<=6; i++) { // 顯示未來 6 天
            const d = new Date(daily.time[i]);
            const dayName = d.toLocaleDateString(state.currentLang === 'en' ? 'en-US' : 'zh-TW', { weekday: 'short' });
            const wInfo = getWeatherInfo(daily.weather_code[i]);
            const rain = daily.precipitation_probability_max[i] || 0;
            const tMax = Math.round(daily.temperature_2m_max[i]);
            const tMin = Math.round(daily.temperature_2m_min[i]);
            
            forecastHTML += `
                <div class="forecast-item">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon"><i class="fas ${wInfo.icon}"></i></div>
                    <div class="forecast-rain"><i class="fas fa-tint" style="opacity:0.5; font-size:10px;"></i> ${rain}%</div>
                    <div class="forecast-temp">${tMin}° - ${tMax}°</div>
                </div>
            `;
        }
        document.getElementById('forecast-list').innerHTML = forecastHTML;

    } catch (e) {
        console.error("Weather Error:", e);
        if(mainLocEl) mainLocEl.innerText = getT('weather_error') || "Error";
    } finally {
        isFetching = false;
    }
}

// 🌟 3. 全域開關
window.toggleDashboard = () => {
    injectDashboard(); // 確保已注入
    const overlay = document.getElementById('dashboard-overlay');
    if (overlay) {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        } else {
            overlay.classList.add('active');
            fetchWeather(); // 每次打開都刷新數據
        }
    }
};

// 初始化：只抓取一次簡易數據給首頁小方塊
export function initWeather() {
    window.rfApp = window.rfApp || {};
    window.rfApp.weather = { fetchWeather, toggleDashboard };
    
    // 延遲一點點再抓，讓地圖先載入
    setTimeout(fetchWeather, 2000);
}
