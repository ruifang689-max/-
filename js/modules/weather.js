// js/modules/weather.js (v710) - 瑞芳資訊中樞 (防彈整合版)
import { state } from '../core/store.js';
import { zones } from '../data/boundary.js';

let isDashboardInjected = false;
let isFetching = false;
let currentTab = 'weather';

// 確保全域物件存在
window.rfApp = window.rfApp || {};
window.rfApp.weather = window.rfApp.weather || {};

const getT = (key) => window.rfApp?.t ? window.rfApp.t(key) : key;

const getWeatherInfo = (code) => {
    const t = getT;
    if (code === 0) return { icon: 'fa-sun', name: t('wmo_clear') || '晴朗', class: 'weather-sun' };
    if (code <= 3) return { icon: 'fa-cloud-sun', name: t('wmo_cloudy') || '多雲', class: 'weather-cloud' };
    if (code <= 48) return { icon: 'fa-smog', name: t('wmo_fog') || '起霧', class: 'weather-cloud' };
    if (code <= 67 || (code >= 80 && code <= 82)) return { icon: 'fa-cloud-rain', name: t('wmo_rain') || '有雨', class: 'weather-rain' };
    if (code >= 95) return { icon: 'fa-bolt', name: t('wmo_storm') || '雷雨', class: 'weather-rain' };
    return { icon: 'fa-cloud', name: '--', class: '' };
};

const getAqiInfo = (aqi) => {
    const t = getT;
    if (aqi <= 50) return { color: '#2ecc71', status: t('aqi_good') || '良好', icon: 'fa-smile' };
    if (aqi <= 100) return { color: '#f1c40f', status: t('aqi_moderate') || '普通', icon: 'fa-meh' };
    return { color: '#e74c3c', status: t('aqi_unhealthy') || '不佳', icon: 'fa-frown' };
};

function injectDashboard() {
    if (isDashboardInjected) return;
    
    const style = document.createElement('style');
    style.innerHTML = `
        #dashboard-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 3000; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.3s; backdrop-filter: blur(2px); }
        #dashboard-overlay.active { opacity: 1; pointer-events: auto; }
        
        .dash-container { background: var(--bg-color, #f8f9fa); width: 100%; height: 90vh; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 -5px 20px rgba(0,0,0,0.2); overflow: hidden; }
        #dashboard-overlay.active .dash-container { transform: translateY(0); }
        body.skin-glass .dash-container { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.6); }

        .dash-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; }
        .dash-title { font-size: 18px; font-weight: bold; color: var(--text-main); display: flex; align-items: center; gap: 8px; }
        .dash-close { background: rgba(0,0,0,0.05); border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .dash-content-area { flex: 1; overflow-y: auto; padding: 20px; padding-bottom: 80px; position: relative; }
        .tab-page { display: none; animation: fadeIn 0.3s ease; }
        .tab-page.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* 天氣卡片 */
        .dash-main-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 25px; color: white; display: flex; flex-direction: column; align-items: center; box-shadow: 0 10px 25px rgba(118, 75, 162, 0.4); position: relative; overflow: hidden; margin-bottom: 20px; }
        .dash-main-card.sunny { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); box-shadow: 0 10px 25px rgba(253, 160, 133, 0.4); }
        .dash-main-card.rainy { background: linear-gradient(135deg, #3a1c71 0%, #d76d77 100%); }
        .main-temp { font-size: 64px; font-weight: bold; line-height: 1; margin: 10px 0; letter-spacing: -2px; }
        .main-status { font-size: 20px; font-weight: 500; opacity: 0.9; margin-bottom: 5px; }
        .aqi-badge { background: rgba(0,0,0,0.2); padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-top: 10px; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(5px); }
        
        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .dash-item { background: white; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .item-label { font-size: 12px; color: var(--text-sub); font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .item-val { font-size: 18px; font-weight: bold; color: var(--text-main); }
        .forecast-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; background: rgba(0,0,0,0.03); border-radius: 12px; margin-bottom: 8px; }

        /* 區域網格 */
        .zone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .zone-btn { aspect-ratio: 1; background: white; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.1s; border: 1px solid rgba(0,0,0,0.05); }
        .zone-btn:active { transform: scale(0.95); background: #f0f0f0; }
        .zone-icon { font-size: 32px; margin-bottom: 8px; }
        .zone-name { font-size: 14px; font-weight: bold; color: var(--text-main); }

        /* 交通與新聞 */
        .trans-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 10px rgba(0,0,0,0.05); cursor: pointer; }
        .trans-info h4 { margin: 0 0 5px 0; font-size: 16px; color: var(--text-main); }
        .trans-info p { margin: 0; font-size: 13px; color: var(--text-sub); }
        .trans-icon { width: 45px; height: 45px; background: #eef2f7; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--primary); margin-right: 15px; }

        .news-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; gap: 15px; }
        .news-date { font-size: 12px; color: #888; white-space: nowrap; }
        .news-title { font-weight: bold; color: var(--text-main); font-size: 15px; margin-bottom: 4px; }
        .news-desc { font-size: 13px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* AI 助理 */
        .ai-chat-box { display: flex; flex-direction: column; height: 100%; }
        .ai-msg-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; padding-bottom: 15px; }
        .msg { max-width: 80%; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; }
        .msg.bot { align-self: flex-start; background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .msg.user { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 4px; }
        .ai-input-area { display: flex; gap: 10px; margin-top: auto; padding-top: 10px; border-top: 1px solid #eee; }
        .ai-input { flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #ddd; background: #f9f9f9; }
        .ai-send { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        /* 底部導覽 */
        .dash-tabbar { position: absolute; bottom: 0; left: 0; width: 100%; height: 65px; background: white; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 -5px 15px rgba(0,0,0,0.05); z-index: 10; padding-bottom: 10px; }
        .tab-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #aaa; cursor: pointer; width: 20%; transition: 0.2s; -webkit-tap-highlight-color: transparent; }
        .tab-item i { font-size: 20px; }
        .tab-item span { font-size: 10px; font-weight: bold; }
        .tab-item.active { color: var(--primary); transform: translateY(-2px); }
    `;
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.id = 'dashboard-overlay';
    div.innerHTML = `
        <div class="dash-container">
            <div class="dash-header">
                <div class="dash-title"><i class="fas fa-layer-group" style="color:var(--primary)"></i> <span id="dash-header-title">資訊中樞</span></div>
                <button class="dash-close" onclick="window.rfApp.weather.toggleDashboard()"><i class="fas fa-chevron-down"></i></button>
            </div>
            
            <div class="dash-content-area">
                <div id="tab-weather" class="tab-page active">
                    <div id="dash-main-card" class="dash-main-card">
                        <div id="dash-main-location" style="font-size:16px; opacity:0.9;"><i class="fas fa-map-marker-alt"></i> Loading...</div>
                        <div id="dash-main-temp" class="main-temp">--°</div>
                        <div id="dash-main-status" class="main-status">--</div>
                        <div id="dash-aqi-badge" class="aqi-badge"><i class="fas fa-leaf"></i> AQI: --</div>
                    </div>
                    <div class="dash-grid">
                        <div class="dash-item"><span class="item-label"><i class="fas fa-tint" style="color:#3498db"></i> <span data-i18n="humidity">濕度</span></span><span class="item-val" id="dash-humidity">--%</span></div>
                        <div class="dash-item"><span class="item-label"><i class="fas fa-sun" style="color:#f39c12"></i> <span data-i18n="uv_index">紫外線</span></span><span class="item-val" id="dash-uv">--</span></div>
                        <div class="dash-item"><span class="item-label"><i class="fas fa-eye" style="color:#9b59b6"></i> <span data-i18n="rain_prob">降雨機率</span></span><span class="item-val" id="dash-prob">--%</span></div>
                        <div class="dash-item"><span class="item-label"><i class="fas fa-clock" style="color:#e74c3c"></i> <span data-i18n="sunset">日落</span></span><span class="item-val" id="dash-sunset">--:--</span></div>
                    </div>
                    <div style="font-weight:bold; color:var(--text-sub); font-size:13px; margin-bottom:10px;">7 Days Forecast</div>
                    <div class="forecast-list" id="forecast-list"></div>
                </div>

                <div id="tab-news" class="tab-page">
                    <h3 data-i18n="news_title" style="margin:0 0 15px 0;">瑞芳在地快訊</h3>
                    <div class="news-item"><div class="news-date">2026/02/20</div><div><div class="news-title">九份紅燈籠祭開跑</div><div class="news-desc">活動期間老街將點亮千盞紅燈籠，歡迎遊客共襄盛舉。</div></div></div>
                    <div class="news-item"><div class="news-date">2026/02/18</div><div><div class="news-title">猴硐貓村新設施啟用</div><div class="news-desc">全新的貓咪友善步道與遊客中心已正式對外開放。</div></div></div>
                </div>

                <div id="tab-transport" class="tab-page">
                    <h3 data-i18n="trans_title" style="margin:0 0 15px 0;">即時交通資訊</h3>
                    <div class="trans-card" onclick="window.open('https://tip.railway.gov.tw/tra-tip-web/tip/tip001/tip112/goby-station', '_blank')">
                        <div style="display:flex; align-items:center;"><div class="trans-icon"><i class="fas fa-train"></i></div><div class="trans-info"><h4 data-i18n="trans_train">台鐵列車動態</h4><p data-i18n="trans_desc">查詢時刻表</p></div></div><i class="fas fa-chevron-right" style="color:#ccc;"></i>
                    </div>
                    <div class="trans-card" onclick="window.open('https://ebus.gov.taipei/', '_blank')">
                        <div style="display:flex; align-items:center;"><div class="trans-icon"><i class="fas fa-bus"></i></div><div class="trans-info"><h4 data-i18n="trans_bus">公車動態</h4><p data-i18n="trans_desc">查詢公車位置</p></div></div><i class="fas fa-chevron-right" style="color:#ccc;"></i>
                    </div>
                </div>

                <div id="tab-zones" class="tab-page">
                    <h3 data-i18n="zones_title" style="margin:0 0 5px 0;">快速前往九大區</h3>
                    <p data-i18n="zones_desc" style="font-size:12px; color:#888; margin-bottom:15px;">點擊瞬間移動至該區域中心</p>
                    <div class="zone-grid" id="zone-grid-container"></div>
                </div>

                <div id="tab-ai" class="tab-page" style="height:100%;">
                    <div class="ai-chat-box">
                        <div class="ai-msg-list">
                            <div class="msg bot" data-i18n="ai_welcome">你好！我是瑞芳導覽助理。請問今天想去哪裡走走呢？</div>
                        </div>
                        <div class="ai-input-area">
                            <input class="ai-input" placeholder="Ask something..." data-i18n="ai_placeholder">
                            <button class="ai-send" data-i18n="ai_btn_send"><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dash-tabbar">
                <div class="tab-item active" onclick="window.rfApp.weather.switchTab('weather')"><i class="fas fa-cloud-sun"></i><span data-i18n="tab_weather">氣象</span></div>
                <div class="tab-item" onclick="window.rfApp.weather.switchTab('news')"><i class="fas fa-newspaper"></i><span data-i18n="tab_news">快訊</span></div>
                <div class="tab-item" onclick="window.rfApp.weather.switchTab('transport')"><i class="fas fa-bus"></i><span data-i18n="tab_transport">交通</span></div>
                <div class="tab-item" onclick="window.rfApp.weather.switchTab('zones')"><i class="fas fa-th-large"></i><span data-i18n="tab_zones">區域</span></div>
                <div class="tab-item" onclick="window.rfApp.weather.switchTab('ai')"><i class="fas fa-robot"></i><span data-i18n="tab_ai">助理</span></div>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    div.addEventListener('click', (e) => { if(e.target === div) window.rfApp.weather.toggleDashboard(); });
    
    // 生成九大區按鈕
    const container = document.getElementById('zone-grid-container');
    if(container && zones) {
        container.innerHTML = zones.map(z => `
            <div class="zone-btn" onclick="window.rfApp.weather.jumpToZone('${z.id}')">
                <div class="zone-icon">${z.icon}</div>
                <div class="zone-name">${z.name}</div>
            </div>
        `).join('');
    }

    isDashboardInjected = true;
}

// 🌟 開放全域呼叫的函數
window.rfApp.weather.switchTab = function(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    const tabs = ['weather', 'news', 'transport', 'zones', 'ai'];
    const idx = tabs.indexOf(tabId);
    if(idx > -1) document.querySelectorAll('.tab-item')[idx].classList.add('active');

    document.querySelectorAll('.tab-page').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById(`tab-${tabId}`);
    if(targetPage) targetPage.classList.add('active');
};

window.rfApp.weather.jumpToZone = function(zoneId) {
    if(!zones) return;
    const zone = zones.find(z => z.id === zoneId);
    if(zone && state.mapInstance) {
        state.mapInstance.flyTo([zone.lat, zone.lng], zone.zoom, { animate: true, duration: 1.5 });
        window.rfApp.weather.toggleDashboard();
    }
};

window.rfApp.weather.toggleDashboard = function() {
    injectDashboard();
    const overlay = document.getElementById('dashboard-overlay');
    if (overlay) {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        } else {
            overlay.classList.add('active');
            if(currentTab === 'weather') fetchWeather(); // 如果停在天氣頁，打開時刷新資料
        }
    }
};

// 🌟 抓取天氣 API
export async function fetchWeather() {
    if (isFetching) return;
    isFetching = true;

    const topTempEl = document.getElementById('weather-temp');
    const topBoxEl = document.getElementById('weather-box');
    const mainLocEl = document.getElementById('dash-main-location');

    let lat = 25.1087, lng = 121.8060, locName = "Ruifang";
    if (state.userLocation && state.userLocation.lat) {
        lat = state.userLocation.lat;
        lng = state.userLocation.lng;
        locName = getT('locating') || "Current Location";
    }

    if(mainLocEl) mainLocEl.innerText = getT('loading_weather') || "Updating...";

    try {
        if (!navigator.onLine) throw new Error('Offline');

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m&hourly=uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`;

        const [resW, resA] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
        const data = await resW.json();
        const dataAqi = await resA.json();

        const current = data.current;
        const daily = data.daily;
        const aqiVal = dataAqi.current?.us_aqi || 0;

        const wInfo = getWeatherInfo(current.weather_code);
        if (topTempEl) topTempEl.innerText = `${Math.round(current.temperature_2m)}°`;
        if (topBoxEl) {
            topBoxEl.innerHTML = `<i class="fas ${wInfo.icon} ${wInfo.class}"></i><span id="weather-temp">${Math.round(current.temperature_2m)}°</span>`;
        }

        if(mainLocEl) mainLocEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${locName}`;
        
        const mainTempEl = document.getElementById('dash-main-temp');
        if(mainTempEl) mainTempEl.innerText = `${Math.round(current.temperature_2m)}°`;
        
        const mainStatusEl = document.getElementById('dash-main-status');
        if(mainStatusEl) mainStatusEl.innerText = wInfo.name;
        
        const aqiInfo = getAqiInfo(aqiVal);
        const aqiEl = document.getElementById('dash-aqi-badge');
        if(aqiEl) {
            aqiEl.innerHTML = `<i class="fas ${aqiInfo.icon}"></i> ${getT('aqi_level') || 'AQI'}: ${aqiVal} (${aqiInfo.status})`;
            aqiEl.style.backgroundColor = aqiInfo.color + '40'; 
            aqiEl.style.border = `1px solid ${aqiInfo.color}`;
        }

        const mainCard = document.getElementById('dash-main-card');
        if(mainCard) {
            mainCard.className = 'dash-main-card';
            if(current.weather_code <= 3) mainCard.classList.add('sunny');
            else if(current.weather_code >= 51) mainCard.classList.add('rainy');
        }

        const humEl = document.getElementById('dash-humidity');
        if(humEl) humEl.innerText = `${current.relative_humidity_2m}%`;
        
        const uvEl = document.getElementById('dash-uv');
        if(uvEl) {
            const hourIndex = new Date().getHours();
            uvEl.innerText = data.hourly.uv_index[hourIndex] || 0;
        }
        
        const probEl = document.getElementById('dash-prob');
        if(probEl) probEl.innerText = `${daily.precipitation_probability_max[0] || 0}%`;
        
        const sunsetEl = document.getElementById('dash-sunset');
        if(sunsetEl) {
            const sunsetTime = new Date(daily.sunset[0]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
            sunsetEl.innerText = sunsetTime;
        }

        let forecastHTML = '';
        for(let i=1; i<=6; i++) {
            const d = new Date(daily.time[i]);
            const dayName = d.toLocaleDateString(state.currentLang === 'en' ? 'en-US' : 'zh-TW', { weekday: 'short' });
            const wInfoDay = getWeatherInfo(daily.weather_code[i]);
            forecastHTML += `
                <div class="forecast-item">
                    <div style="width:50px;font-weight:bold;">${dayName}</div>
                    <div style="flex:1;text-align:center;"><i class="fas ${wInfoDay.icon}"></i></div>
                    <div style="width:80px;text-align:right;">${Math.round(daily.temperature_2m_min[i])}° - ${Math.round(daily.temperature_2m_max[i])}°</div>
                </div>
            `;
        }
        const forecastList = document.getElementById('forecast-list');
        if(forecastList) forecastList.innerHTML = forecastHTML;

    } catch (e) {
        console.error("API 載入失敗:", e);
        if(mainLocEl) mainLocEl.innerText = "無法取得天氣資訊";
        if (topTempEl && topTempEl.innerText === "") topTempEl.innerText = "--"; 
        
        if (!navigator.onLine) {
            console.warn("⚠️ 進入離線模式");
            window.addEventListener('online', fetchWeather, { once: true });
        }
    } finally {
        isFetching = false;
    }
}

export function initWeather() {
    // 無論 API 成功與否，立刻綁定右上角按鈕的點擊事件
    const topBoxEl = document.getElementById('weather-box');
    if (topBoxEl) {
        topBoxEl.onclick = window.rfApp.weather.toggleDashboard;
        topBoxEl.style.cursor = 'pointer';
    }
    
    // 延遲抓取天氣，避免阻塞首頁地圖載入
    setTimeout(fetchWeather, 1500);
}
