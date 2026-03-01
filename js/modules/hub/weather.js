// js/modules/hub/weather.js (修正 API 欄位版)
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
            fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunset&timezone=Asia%2FTaipei'),
            fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=25.108&longitude=121.805&current=european_aqi').catch(() => null)
        ]);
        
        if (!weatherRes.ok) throw new Error('API Error');
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        const daily = weatherData.daily;

        const currentTemp = Math.round(current.temperature_2m);
        const apparentTemp = Math.round(current.apparent_temperature);
        const humidity = current.relative_humidity_2m;
        const windSpeed = Math.round(current.wind_speed_10m);
        const currentCode = current.weather_code;
        const currentInfo = parseWeatherCode(currentCode);
        const uvIndex = Math.round(daily.uv_index_max[0] || 0);

        const sunsetStr = daily.sunset[0];
        const sunsetTime = sunsetStr ? new Date(sunsetStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';

        let bgClass = 'bg-cloud';
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 17; 
        
        if (currentCode >= 50 && currentCode <= 99) {
            bgClass = 'bg-rain'; 
        } else if (isNight) {
            bgClass = 'bg-night'; 
        } else if (currentCode === 0 || currentCode === 1 || currentCode === 2) {
            bgClass = 'bg-sun'; 
        }

        if (topTempEl) topTempEl.innerText = `${currentTemp}°C`; 
        if (topIconEl) topIconEl.className = `fas ${currentInfo.icon}`; 

        const headerBg = document.getElementById('dash-header-bg');
        if (headerBg) headerBg.className = `dash-header ${bgClass}`;

        const mTemp = document.getElementById('dash-main-temp');
        if (mTemp) mTemp.innerText = `${currentTemp}°`;
        const mFeels = document.getElementById('dash-main-feels');
        if (mFeels) mFeels.innerText = `體感 ${apparentTemp}°`;
        const mDesc = document.getElementById('dash-main-desc');
        if (mDesc) mDesc.innerText = currentInfo.text;
        const mIcon = document.getElementById('dash-main-icon');
        if (mIcon) mIcon.className = `fas ${currentInfo.icon} dash-weather-icon`;
        
        const todayRain = daily.precipitation_probability_max[0];
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

        const humEl = document.getElementById('dash-detail-hum');
        if(humEl) humEl.innerText = `${humidity}%`;
        const windEl = document.getElementById('dash-detail-wind');
        if(windEl) windEl.innerText = `${windSpeed} km/h`;
        const sunsetEl = document.getElementById('dash-detail-sunset');
        if(sunsetEl) sunsetEl.innerText = sunsetTime;
        const uvEl = document.getElementById('dash-detail-uv');
        if(uvEl) {
            uvEl.innerText = uvIndex;
            if (uvIndex >= 8) uvEl.style.color = '#e74c3c'; 
            else if (uvIndex >= 6) uvEl.style.color = '#f39c12'; 
        }

        updateAIAssistant(currentTemp, currentCode);

        let forecastHTML = '';
        for (let i = 0; i < daily.time.length; i++) {
            // 🌟 核心修復：從 weathercode 改為 weather_code
            const wInfo = parseWeatherCode(daily.weather_code[i]);
            const rain = daily.precipitation_probability_max[i] || 0;
            const tMax = Math.round(daily.temperature_2m_max[i]);
            const tMin = Math.round(daily.temperature_2m_min[i]);
            forecastHTML += `<div class="forecast-item"><div class="forecast-day">${getDayName(daily.time[i])}</div><div class="forecast-icon"><i class="fas ${wInfo.icon}"></i></div><div class="forecast-rain"><i class="fas fa-tint" style="opacity:0.5; font-size:10px;"></i> ${rain}%</div><div class="forecast-temp">${tMin}° - ${tMax}°</div></div>`;
        }
        const fList = document.getElementById('forecast-list');
        if(fList) fList.innerHTML = forecastHTML;

    } catch (e) { 
        console.error("天氣解析錯誤:", e);
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
