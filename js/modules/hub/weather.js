// js/modules/hub/weather.js
import { updateAIAssistant } from './assistant.js';

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

export async function fetchWeatherData() {
    const topTempEl = document.getElementById('weather-temp');
    const topIconEl = document.querySelector('#weather-box i');

    try {
        if (!navigator.onLine) throw new Error('Offline');

        const [weatherRes, aqiRes] = await Promise.all([
            fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei'),
            fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=25.108&longitude=121.805&current=european_aqi').catch(() => null)
        ]);
        
        if (!weatherRes.ok) throw new Error('API Error');
        const weatherData = await weatherRes.json();
        
        const currentTemp = Math.round(weatherData.current_weather.temperature);
        const currentCode = weatherData.current_weather.weathercode;
        const currentInfo = parseWeatherCode(currentCode);
        
        // 更新右上角小按鈕
        if (topTempEl) topTempEl.innerText = `${currentTemp}°C`; 
        if (topIconEl) topIconEl.className = `fas ${currentInfo.icon}`; 

        // 更新面板主看板
        const mTemp = document.getElementById('dash-main-temp');
        if (mTemp) mTemp.innerText = `${currentTemp}°`;
        const mDesc = document.getElementById('dash-main-desc');
        if (mDesc) mDesc.innerText = currentInfo.text;
        const mIcon = document.getElementById('dash-main-icon');
        if (mIcon) mIcon.className = `fas ${currentInfo.icon} dash-weather-icon`;
        
        const todayRain = weatherData.daily.precipitation_probability_max[0];
        const rEl = document.getElementById('dash-main-rain');
        if (rEl) rEl.innerText = todayRain !== null ? `${todayRain}%` : '--%';

        if (aqiRes && aqiRes.ok) {
            const aqiData = await aqiRes.json();
            const aqiVal = aqiData.current.european_aqi;
            const aEl = document.getElementById('dash-main-aqi');
            if (aEl) {
                aEl.innerText = aqiVal;
                if (aqiVal > 100) aEl.style.color = '#ff7675'; 
            }
        }

        // 🌟 呼叫 AI 助理大腦
        updateAIAssistant(currentTemp, currentCode);

        // 渲染一週預報
        const daily = weatherData.daily;
        let forecastHTML = '';
        for (let i = 0; i < daily.time.length; i++) {
            const wInfo = parseWeatherCode(daily.weathercode[i]);
            const rain = daily.precipitation_probability_max[i] || 0;
            const tMax = Math.round(daily.temperature_2m_max[i]);
            const tMin = Math.round(daily.temperature_2m_min[i]);
            forecastHTML += `<div class="forecast-item"><div class="forecast-day">${getDayName(daily.time[i])}</div><div class="forecast-icon"><i class="fas ${wInfo.icon}"></i></div><div class="forecast-rain"><i class="fas fa-tint" style="opacity:0.5; font-size:10px;"></i> ${rain}%</div><div class="forecast-temp">${tMin}° - ${tMax}°</div></div>`;
        }
        const fList = document.getElementById('forecast-list');
        if(fList) fList.innerHTML = forecastHTML;

    } catch (e) { 
        if (topTempEl && topTempEl.innerText === "") topTempEl.innerText = "--"; 
        if (topIconEl && topIconEl.className === "") topIconEl.className = `fas fa-cloud`; 
        const fList = document.getElementById('forecast-list');
        if (!navigator.onLine) {
            window.addEventListener('online', fetchWeatherData, { once: true });
        } else if (fList) {
            fList.innerHTML = '<div style="text-align:center; padding:20px; color:#e74c3c;">天氣資料載入失敗，請稍後重試</div>';
        }
    }
}
