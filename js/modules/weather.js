// js/modules/weather.js (v410)
export async function fetchWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=25.108&longitude=121.805&current_weather=true&timezone=Asia%2FTaipei');
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        let iconClass = 'fa-cloud weather-cloud'; 
        
        if(code === 0) iconClass = 'fa-sun weather-sun'; 
        else if(code > 3) iconClass = 'fa-cloud-rain weather-rain'; 
        
        document.getElementById('weather-temp').innerText = `${temp}°C`; 
        document.querySelector('#weather-box i').className = `fas ${iconClass}`; 
    } catch (e) { 
        console.warn("天氣 API 讀取失敗", e);
        document.getElementById('weather-temp').innerText = "--"; 
        // 🌟 發生錯誤時，將 fa-spin (轉圈動畫) 拔除，換成靜態雲朵
        document.querySelector('#weather-box i').className = `fas fa-cloud`; 
    }
}
