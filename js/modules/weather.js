// js/modules/weather.js (v692) - 修正生命週期與全域物件衝突版
import { state } from '../core/store.js';

let isDashboardInjected = false;

// 🌟 核心防護：將 API 註冊獨立成一個函數，確保在 main.js 覆蓋完 rfApp 之後才執行綁定
function registerDashboardAPI() {
    window.rfApp = window.rfApp || {};
    if (window.rfApp.dashboard) return; // 如果已經註冊過就跳過

    window.rfApp.dashboard = {
        open: () => {
            injectDashboard();
            const overlay = document.getElementById('dashboard-overlay');
            if(overlay) overlay.classList.add('active');
        },
        close: () => {
            const overlay = document.getElementById('dashboard-overlay');
            if(overlay) overlay.classList.remove('active');
        },
        switchTab: (tabId, element) => {
            // 移除所有標籤的 active 狀態
            document.querySelectorAll('#dash-tabs .dash-tab').forEach(el => el.classList.remove('active'));
            // 加上當前點擊標籤的 active (使用傳入的 this 元素更安全)
            if (element) {
                element.classList.add('active');
            }
            // 切換下方內容面板
            document.querySelectorAll('.dash-panel').forEach(el => el.classList.remove('active'));
            const targetPanel = document.getElementById(`dash-panel-${tabId}`);
            if(targetPanel) targetPanel.classList.add('active');
        },
        goZone: (lat, lng, zoom) => {
            window.rfApp.dashboard.close();
            if (state.mapInstance) state.mapInstance.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
        },
        triggerAIFilter: (tag) => {
            window.rfApp.dashboard.close();
            if(window.rfApp.map && typeof window.rfApp.map.filterSpots === 'function') {
                const chips = document.querySelectorAll('#category-chips .chip');
                const targetChip = Array.from(chips).find(c => c.innerText.includes(tag));
                window.rfApp.map.filterSpots(tag, targetChip);
                if(typeof window.showToast === 'function') {
                    window.showToast(`✨ 小瑞已為您過濾「${tag}」相關景點！`, 'success');
                }
            }
        }
    };
}

function injectDashboard() {
    if (isDashboardInjected) return;
    
    // --- 注入 CSS ---
    const style = document.createElement('style');
    style.id = 'dashboard-style-v690';
    style.innerHTML = `
        #dashboard-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 3000; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        #dashboard-overlay.active { opacity: 1; pointer-events: auto; }
        
        .dash-container { background: #f8f9fa; width: 100%; height: 85vh; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 -5px 20px rgba(0,0,0,0.2); overflow: hidden; }
        #dashboard-overlay.active .dash-container { transform: translateY(0); }
        
        .dash-header { padding: 20px; background: linear-gradient(135deg, var(--primary), #2980b9); color: white; position: relative; flex-shrink: 0; }
        .dash-drag-pill { width: 40px; height: 5px; background: rgba(255,255,255,0.4); border-radius: 3px; margin: 0 auto 15px auto; }
        .dash-close-btn { position: absolute; top: 15px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        
        .dash-weather-hero { display: flex; align-items: center; justify-content: space-between; }
        .dash-temp-main { font-size: 48px; font-weight: 800; line-height: 1; }
        .dash-weather-desc { font-size: 16px; opacity: 0.9; margin-top: 5px; }
        .dash-weather-icon { font-size: 56px; text-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .dash-weather-sub { display: flex; gap: 15px; margin-top: 15px; font-size: 14px; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 12px; width: fit-content; }
        .dash-weather-sub span { display: flex; align-items: center; gap: 6px; }

        .dash-tabs { display: flex; background: white; padding: 0 10px; border-bottom: 1px solid #ddd; overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
        .dash-tabs::-webkit-scrollbar { display: none; }
        .dash-tab { padding: 15px 15px; font-weight: bold; color: #7f8c8d; cursor: pointer; white-space: nowrap; border-bottom: 3px solid transparent; transition: 0.2s; }
        .dash-tab.active { color: var(--primary); border-bottom: 3px solid var(--primary); }
        
        .dash-body { flex: 1; overflow-y: auto; padding: 20px; background: #f8f9fa; }
        .dash-panel { display: none; animation: fadeIn 0.3s ease-out; }
        .dash-panel.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .forecast-item { display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px 15px; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); font-weight: bold; color: #333; }
        .forecast-day { width: 60px; color: #555; }
        .forecast-icon { font-size: 18px; color: var(--primary); width: 30px; text-align: center; }
        .forecast-rain { font-size: 13px; color: #3498db; width: 50px; text-align: right; }
        .forecast-temp { font-size: 15px; width: 80px; text-align: right; }

        .dash-list-btn { display: flex; align-items: center; gap: 15px; background: white; padding: 16px; border-radius: 16px; margin-bottom: 12px; text-decoration: none; color: #2c3e50; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s; cursor: pointer; border: none; width: 100%; font-size: 16px; }
        .dash-list-btn:active { transform: scale(0.98); background: #f1f2f6; }
        .dash-list-btn i { font-size: 22px; color: var(--primary); width: 30px; text-align: center; }
        
        .dash-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .dash-grid-btn { background: white; border: none; border-radius: 16px; padding: 15px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; transition: 0.2s; }
        .dash-grid-btn:active { transform: scale(0.95); }
        .dash-grid-btn .icon { font-size: 28px; }
        .dash-grid-btn .text { font-size: 13px; font-weight: bold; color: #444; }
    `;
    document.head.appendChild(style);

    // --- 注入 HTML 結構 (更新 onClick 傳遞 this) ---
    const overlay = document.createElement('div');
    overlay.id = 'dashboard-overlay';
    overlay.innerHTML = `
        <div class="dash-container" id="dash-container">
            <div class="dash-header">
                <div class="dash-drag-pill"></div>
                <button class="dash-close-btn" onclick="window.rfApp.dashboard.close()"><i class="fas fa-times"></i></button>
                <div class="dash-weather-hero">
                    <div>
                        <div class="dash-temp-main" id="dash-main-temp">--°</div>
                        <div class="dash-weather-desc" id="dash-main-desc">載入中...</div>
                        <div class="dash-weather-sub">
                            <span><i class="fas fa-umbrella"></i> <span id="dash-main-rain">--%</span></span>
                            <span><i class="fas fa-wind"></i> AQI: <span id="dash-main-aqi">--</span></span>
                        </div>
                    </div>
                    <i class="fas fa-cloud dash-weather-icon" id="dash-main-icon"></i>
                </div>
            </div>

            <div class="dash-tabs" id="dash-tabs">
                <div class="dash-tab active" onclick="window.rfApp.dashboard.switchTab('weather', this)"><i class="fas fa-cloud-sun"></i> 天氣</div>
                <div class="dash-tab" onclick="window.rfApp.dashboard.switchTab('ai', this)"><i class="fas fa-robot"></i> AI 助理</div>
                <div class="dash-tab" onclick="window.rfApp.dashboard.switchTab('map', this)"><i class="fas fa-map-marked-alt"></i> 導覽</div>
                <div class="dash-tab" onclick="window.rfApp.dashboard.switchTab('transport', this)"><i class="fas fa-bus"></i> 交通</div>
                <div class="dash-tab" onclick="window.rfApp.dashboard.switchTab('news', this)"><i class="fas fa-newspaper"></i> 新聞</div>
            </div>

            <div class="dash-body">
                <div id="dash-panel-weather" class="dash-panel active">
                    <div id="forecast-list" style="margin-top:5px;">
                        <div style="text-align:center; padding:20px; color:#888;"><i class="fas fa-spinner fa-spin"></i> 預報資料載入中...</div>
                    </div>
                </div>

                <div id="dash-panel-ai" class="dash-panel">
                    <div style="text-align:center; padding:40px 20px;">
                        <i class="fas fa-robot fa-spin" style="font-size:40px; color:var(--primary); margin-bottom:15px;"></i>
                        <p style="color:#888; font-size:14px;">小瑞正在分析目前情境...</p>
                    </div>
                </div>

                <div id="dash-panel-map" class="dash-panel">
                    <div class="dash-grid">
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1087, 121.8059, 16)"><span class="icon">🚆</span><span class="text">瑞芳市區</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1098, 121.8451, 16)"><span class="icon">🏮</span><span class="text">九份山城</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1079, 121.8576, 16)"><span class="icon">⛏️</span><span class="text">金瓜石</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1229, 121.8641, 15)"><span class="icon">🌊</span><span class="text">水湳洞</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.0872, 121.8268, 16)"><span class="icon">🐈</span><span class="text">猴硐貓村</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.0615, 121.8118, 15)"><span class="icon">🌿</span><span class="text">三貂嶺</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1325, 121.8207, 15)"><span class="icon">🦑</span><span class="text">深澳漁港</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1043, 121.7627, 15)"><span class="icon">⛰️</span><span class="text">四腳亭</span></button>
                        <button class="dash-grid-btn" onclick="window.rfApp.dashboard.goZone(25.1212, 121.8931, 14)"><span class="icon">🍦</span><span class="text">南雅/鼻頭</span></button>
                    </div>
                </div>

                <div id="dash-panel-transport" class="dash-panel">
                    <a href="https://www.railway.gov.tw/tra-tip-web/tip" target="_blank" class="dash-list-btn"><i class="fas fa-train"></i> 台鐵火車時刻表</a>
                    <a href="https://www.taiwanbus.tw/" target="_blank" class="dash-list-btn"><i class="fas fa-bus"></i> 台灣公車動態查詢</a>
                    <a href="https://www.railbike.com.tw/" target="_blank" class="dash-list-btn"><i class="fas fa-bicycle"></i> 深澳鐵道自行車預約</a>
                    <a href="https://www.taxitw.com/" target="_blank" class="dash-list-btn"><i class="fas fa-taxi"></i> 瑞芳計程車叫車</a>
                </div>

                <div id="dash-panel-news" class="dash-panel">
                    <div style="background:white; padding:20px; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:15px;">
                        <h4 style="margin:0 0 10px 0; color:var(--primary);"><i class="fas fa-bullhorn"></i> 瑞芳區公所最新公告</h4>
                        <p style="font-size:14px; color:#666; line-height:1.6; margin:0;">請隨時注意山區天候變化，雨天落石多，前往步道請注意安全。</p>
                        <a href="https://www.ruifang.ntpc.gov.tw/" target="_blank" style="display:inline-block; margin-top:10px; font-size:13px; font-weight:bold; color:var(--accent);">前往區公所網站 ➔</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) window.rfApp.dashboard.close();
    });

    const miniWeatherBox = document.getElementById('weather-box');
    if (miniWeatherBox) {
        miniWeatherBox.style.cursor = 'pointer';
        miniWeatherBox.onclick = () => {
            if(window.rfApp && window.rfApp.dashboard) {
                window.rfApp.dashboard.open();
            }
        };
    }

    isDashboardInjected = true;
}

const parseWeatherCode = (code) => {
    if (code === 0) return { icon: 'fa-sun', text: '晴朗無雲' };
    if (code >= 1 && code <= 3) return { icon: 'fa-cloud-sun', text: '多雲時晴' };
    if (code >= 45 && code <= 48) return { icon: 'fa-smog', text: '霧或霾' };
    if (code >= 51 && code <= 67) return { icon: 'fa-cloud-rain', text: '陣雨' };
    if (code >= 71 && code <= 82) return { icon: 'fa-snowflake', text: '降雪' };
    if (code >= 95) return { icon: 'fa-bolt', text: '雷陣雨' };
    return { icon: 'fa-cloud', text: '陰天' };
};

const getDayName = (dateString) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const d = new Date(dateString);
    if (d.toDateString() === new Date().toDateString()) return '今日';
    return `週${days[d.getDay()]}`;
};

// 🌟 核心：根據天氣生成 AI 小瑞的推薦內容
function updateAIAssistant(temp, code) {
    const aiPanel = document.getElementById('dash-panel-ai');
    if (!aiPanel) return;

    let situation = "good";
    if (code >= 50 && code <= 99) situation = "rain";

    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 17;
    if (isNight && situation !== "rain") situation = "night";

    let msg = "";
    let tags = [];
    if (situation === "rain") {
        msg = `目前外面正在下雨 🌧️，氣溫 ${temp}°C。山區路滑請注意安全！建議您暫時避開戶外步道，可以前往「黃金博物館」或「昇平戲院」等室內景點躲雨喔！`;
        tags = ["室內", "歷史", "博物館"];
    } else if (situation === "night") {
        msg = `夜幕低垂 🌙，氣溫 ${temp}°C。現在非常適合去「九份老街」欣賞越夜越美麗的燈籠海，或是去深澳漁港吃點在地海鮮宵夜！`;
        tags = ["夜景", "美食", "休閒"];
    } else if (temp >= 28) {
        msg = `現在天氣滿熱的 🥵 (${temp}°C)！建議去海邊吹吹風，例如「深澳漁港」或「陰陽海」，或是找間冰店吃碗芋圓消暑！`;
        tags = ["海岸", "自然", "美食"];
    } else {
        msg = `現在天氣非常舒爽 🍃 (${temp}°C)！這是最適合走訪瑞芳秘境的好時機，強烈推薦您去「三貂嶺」或各個礦業步道走走！`;
        tags = ["自然", "步道", "歷史"];
    }

    aiPanel.innerHTML = `
        <div style="padding: 10px 0;">
            <div style="display:flex; align-items:flex-start; gap:15px; margin-bottom:25px;">
                <div style="width:50px; height:50px; background:linear-gradient(135deg, var(--primary), #2980b9); border-radius:50%; display:flex; justify-content:center; align-items:center; color:white; font-size:22px; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.2); flex-shrink:0;">
                    瑞
                </div>
                <div style="background:white; padding:15px 18px; border-radius:0 16px 16px 16px; box-shadow:0 2px 10px rgba(0,0,0,0.05); position:relative;">
                    <h4 style="margin:0 0 8px 0; color:var(--primary);">AI 導遊 小瑞</h4>
                    <p style="margin:0; font-size:14px; line-height:1.6; color:#444;">${msg}</p>
                </div>
            </div>
            
            <div style="background:white; padding:18px; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                <h5 style="margin:0 0 12px 0; color:#666; font-size:14px;"><i class="fas fa-magic"></i> 試試一鍵行程推薦：</h5>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    ${tags.map(t => `<button onclick="window.rfApp.dashboard.triggerAIFilter('${t}')" style="background:#f1f2f6; border:1px solid #e1e2e6; padding:10px 18px; border-radius:20px; color:#333; font-weight:bold; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='white';" onmouseout="this.style.background='#f1f2f6'; this.style.color='#333';">${t}</button>`).join('')}
                </div>
            </div>
        </div>
    `;
}

export async function fetchWeather() {
    // 確保每次抓取天氣時，API 都會被安全地註冊到全域物件上
    registerDashboardAPI();
    injectDashboard(); 

    const topTempEl = document.getElementById('weather-temp');
    const topIconEl = document.querySelector('#weather-box i');

    try {
        if (!navigator.onLine) throw new Error('Offline');

        const [weatherRes, aqiRes] = await Promise.all([
            fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei'),
            fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=25.108&longitude=121.805&current=european_aqi').catch(() => null)
        ]);
        
        if (!weatherRes.ok) throw new Error('Weather API Error');
        const weatherData = await weatherRes.json();
        
        const currentTemp = Math.round(weatherData.current_weather.temperature);
        const currentCode = weatherData.current_weather.weathercode;
        const currentInfo = parseWeatherCode(currentCode);
        
        if (topTempEl) topTempEl.innerText = `${currentTemp}°C`; 
        if (topIconEl) topIconEl.className = `fas ${currentInfo.icon}`; 

        document.getElementById('dash-main-temp').innerText = `${currentTemp}°`;
        document.getElementById('dash-main-desc').innerText = currentInfo.text;
        document.getElementById('dash-main-icon').className = `fas ${currentInfo.icon} dash-weather-icon`;
        
        const todayRain = weatherData.daily.precipitation_probability_max[0];
        document.getElementById('dash-main-rain').innerText = todayRain !== null ? `${todayRain}%` : '--%';

        if (aqiRes && aqiRes.ok) {
            const aqiData = await aqiRes.json();
            const aqiVal = aqiData.current.european_aqi;
            document.getElementById('dash-main-aqi').innerText = aqiVal;
            if (aqiVal > 100) document.getElementById('dash-main-aqi').style.color = '#ff7675'; 
        }

        // 🌟 更新 AI 助理內容
        updateAIAssistant(currentTemp, currentCode);

        const daily = weatherData.daily;
        let forecastHTML = '';
        for (let i = 0; i < daily.time.length; i++) {
            const wInfo = parseWeatherCode(daily.weathercode[i]);
            const rain = daily.precipitation_probability_max[i] || 0;
            const tMax = Math.round(daily.temperature_2m_max[i]);
            const tMin = Math.round(daily.temperature_2m_min[i]);
            
            forecastHTML += `
                <div class="forecast-item">
                    <div class="forecast-day">${getDayName(daily.time[i])}</div>
                    <div class="forecast-icon"><i class="fas ${wInfo.icon}"></i></div>
                    <div class="forecast-rain"><i class="fas fa-tint" style="opacity:0.5; font-size:10px;"></i> ${rain}%</div>
                    <div class="forecast-temp">${tMin}° - ${tMax}°</div>
                </div>
            `;
        }
        document.getElementById('forecast-list').innerHTML = forecastHTML;

    } catch (e) { 
        if (topTempEl && topTempEl.innerText === "") topTempEl.innerText = "--"; 
        if (topIconEl && topIconEl.className === "") topIconEl.className = `fas fa-cloud`; 
        
        if (!navigator.onLine) {
            console.warn("⚠️ 網路已斷開，天氣模組進入休眠...");
            window.addEventListener('online', fetchWeather, { once: true });
        } else {
            document.getElementById('forecast-list').innerHTML = '<div style="text-align:center; padding:20px; color:#e74c3c;">天氣資料載入失敗，請稍後重試</div>';
            setTimeout(fetchWeather, 30000);
        }
    }
}
