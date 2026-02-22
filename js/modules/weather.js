// js/modules/weather.js (v662) - 智慧離線休眠版
export async function fetchWeather() {
    const tempEl = document.getElementById('weather-temp');
    const iconEl = document.querySelector('#weather-box i');
    
    if (!tempEl || !iconEl) return;

    try {
        // 🌟 防呆：如果根本沒有網路，就直接拋出錯誤進入 Catch
        if (!navigator.onLine) throw new Error('Offline');

        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&timezone=Asia%2FTaipei');
        
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        
        let iconClass = 'fa-cloud weather-cloud'; 
        
        if (code === 0) iconClass = 'fa-sun weather-sun'; 
        else if (code >= 1 && code <= 3) iconClass = 'fa-cloud-sun weather-cloud'; 
        else if (code >= 51 && code <= 67) iconClass = 'fa-cloud-rain weather-rain'; 
        else if (code >= 71 && code <= 82) iconClass = 'fa-snowflake'; 
        else if (code >= 95) iconClass = 'fa-bolt'; 
        
        tempEl.innerText = `${temp}°C`; 
        iconEl.className = `fas ${iconClass}`; 
        
    } catch (e) { 
        // 保留最後顯示的狀態，避免畫面變醜
        if (tempEl.innerText === "") tempEl.innerText = "--"; 
        if (iconEl.className === "") iconEl.className = `fas fa-cloud`; 
        
        // 🌟 智慧判斷機制：如果是離線造成的錯誤
        if (!navigator.onLine) {
            console.warn("⚠️ 網路已斷開，天氣模組進入休眠，等待網路恢復...");
            // 掛載「一次性」的監聽器，只要網路一恢復，馬上抓一次天氣！
            window.addEventListener('online', fetchWeather, { once: true });
        } else {
            // 如果是有網路但 API 掛掉，才進行標準的 30 秒後重試
            console.warn("⚠️ 天氣 API 讀取失敗，將於 30 秒後重試", e);
            setTimeout(fetchWeather, 30000);
        }
    }
}

window.rfApp = window.rfApp || {};
window.rfApp.ui = window.rfApp.ui || {};
window.rfApp.ui.fetchWeather = fetchWeather;
