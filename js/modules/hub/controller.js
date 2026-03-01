// js/modules/hub/controller.js (CSS 拆分模組化版)
import { state } from '../../core/store.js';
import { fetchWeatherData } from './weather.js';
import { renderTransportPanel } from './transport.js';
import { renderNewsPanel } from './news.js';

let isDashboardInjected = false;

export function initDashboard() {
    if (!isDashboardInjected) {
        injectDashboardUI();
        isDashboardInjected = true;
        renderTransportPanel(); 
        renderNewsPanel();
    }

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

    const miniWeatherBox = document.getElementById('weather-box');
    if (miniWeatherBox) {
        miniWeatherBox.style.cursor = 'pointer';
        miniWeatherBox.onclick = () => window.rfApp.dashboard.open();
    }

    // 啟動資料抓取
    fetchWeatherData();
}

function injectDashboardUI() {
    // 🌟 CSS 已經抽離到 css/components/dashboard.css 檔案中，這裡只保留純淨的 HTML 骨架
    const overlay = document.createElement('div');
    overlay.id = 'dashboard-overlay';
    overlay.innerHTML = `
        <div class="dash-container" id="dash-container">
            <div class="dash-header bg-cloud" id="dash-header-bg">
                <div class="dash-drag-pill"></div>
                <button class="dash-close-btn" onclick="window.rfApp.dashboard.close()"><i class="fas fa-times"></i></button>
                <div class="dash-weather-hero">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 6px; font-weight: bold; letter-spacing: 1px;">
                            <i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i> 瑞芳區
                        </div>
                        
                        <div style="display:flex; align-items:baseline; gap:8px;">
                            <div class="dash-temp-main" id="dash-main-temp">--°</div>
                            <div style="font-size:15px; opacity:0.8; font-weight:normal;" id="dash-main-feels">體感 --°</div>
                        </div>
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
                    <div class="weather-detail-grid">
                        <div class="detail-card"><i class="fas fa-tint" style="color:#3498db;"></i><div class="detail-info"><span class="detail-label">相對濕度</span><span class="detail-val" id="dash-detail-hum">--%</span></div></div>
                        <div class="detail-card"><i class="fas fa-wind" style="color:#95a5a6;"></i><div class="detail-info"><span class="detail-label">風速</span><span class="detail-val" id="dash-detail-wind">-- km/h</span></div></div>
                        <div class="detail-card"><i class="fas fa-sun" style="color:#f39c12;"></i><div class="detail-info"><span class="detail-label">紫外線</span><span class="detail-val" id="dash-detail-uv">--</span></div></div>
                        <div class="detail-card"><i class="fas fa-moon" style="color:#e67e22;"></i><div class="detail-info"><span class="detail-label">日落時間</span><span class="detail-val" id="dash-detail-sunset">--:--</span></div></div>
                    </div>
                    <h4 style="margin: 5px 0 10px 5px; color: #555; font-size: 15px;"><i class="far fa-calendar-alt"></i> 一週預報</h4>
                    <div id="forecast-list"><div style="text-align:center; padding:20px; color:#888;"><i class="fas fa-spinner fa-spin"></i> 預報資料載入中...</div></div>
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

                <div id="dash-panel-transport" class="dash-panel"></div>
                <div id="dash-panel-news" class="dash-panel"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) window.rfApp.dashboard.close();
    });
}
