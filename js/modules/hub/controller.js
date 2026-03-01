// js/modules/hub/controller.js
import { state } from '../../core/store.js';
import { fetchWeatherData } from './weather.js';

let isDashboardInjected = false;

export function initDashboard() {
    if (!isDashboardInjected) {
        injectDashboardUI();
        isDashboardInjected = true;
    }

    // 註冊全域 API
    window.rfApp = window.rfApp || {};
    window.rfApp.dashboard = {
        open: () => {
            const overlay = document.getElementById('dashboard-overlay');
            if(overlay) overlay.classList.add('active');
        },
        close: () => {
            const overlay = document.getElementById('dashboard-overlay');
            if(overlay) overlay.classList.remove('active');
        },
        switchTab: (tabId, element) => {
            document.querySelectorAll('#dash-tabs .dash-tab').forEach(el => el.classList.remove('active'));
            if (element) element.classList.add('active');
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

    // 綁定右上角天氣小按鈕
    const miniWeatherBox = document.getElementById('weather-box');
    if (miniWeatherBox) {
        miniWeatherBox.style.cursor = 'pointer';
        miniWeatherBox.onclick = () => window.rfApp.dashboard.open();
    }

    // 啟動氣象資料載入 (它內部會順便呼叫 AI 大腦)
    fetchWeatherData();
}

function injectDashboardUI() {
    const style = document.createElement('style');
    style.id = 'dashboard-style-v700';
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
                    <div id="forecast-list" style="margin-top:5px;"><div style="text-align:center; padding:20px; color:#888;"><i class="fas fa-spinner fa-spin"></i> 預報資料載入中...</div></div>
                </div>
                <div id="dash-panel-ai" class="dash-panel"><div style="text-align:center; padding:40px 20px;"><i class="fas fa-robot fa-spin" style="font-size:40px; color:var(--primary); margin-bottom:15px;"></i><p style="color:#888; font-size:14px;">小瑞正在分析目前情境...</p></div></div>
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
}
