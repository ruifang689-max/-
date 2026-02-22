// js/modules/ui.js (v701) - 雙層主題設定面板版
import { state } from '../core/store.js';

export function initUI() {
    // CSS 注入 (包含綠色外框與色票選擇器)
    const style = document.createElement('style');
    style.innerHTML = `
        .settings-container { background: #fff; width: 90%; max-width: 400px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: background 0.3s; }
        .settings-header { background: var(--primary); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: bold; }
        .settings-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
        .setting-group { margin-bottom: 20px; }
        .setting-group label { display: block; font-weight: bold; color: #555; margin-bottom: 8px; font-size: 14px; }
        
        /* 綠色外框下拉 (Item 22) */
        .green-select { width: 100%; padding: 12px; border: 2px solid #2ecc71; border-radius: 10px; background: #f9fbf9; color: #333; font-weight: bold; font-size: 15px; outline: none; appearance: none; cursor: pointer; }
        .green-select:focus { border-color: #27ae60; box-shadow: 0 0 8px rgba(46,204,113,0.3); }

        /* 顏色選擇器列 */
        .color-picker-row { display: flex; gap: 8px; align-items: center; }
        .color-dot { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s; }
        .color-dot:active { transform: scale(0.9); }
        .color-dot.active { border-color: #333; box-shadow: 0 0 0 2px white inset; }
        #custom-color-picker { width: 40px; height: 40px; padding: 0; border: none; background: none; cursor: pointer; }

        /* 開關 */
        .toggle-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 10px; }
        .toggle-row span { font-weight: bold; color: #444; font-size: 14px; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #2ecc71; }
        input:checked + .slider:before { transform: translateX(20px); }
    `;
    document.head.appendChild(style);

    const injectSettingsUI = () => {
        const overlay = document.getElementById('settings-modal-overlay');
        if (!overlay) return;
        
        const curColor = localStorage.getItem('ruifang_color') || '#007bff';
        const curSkin = localStorage.getItem('ruifang_skin') || 'default';
        const curLayer = localStorage.getItem('rf_base_layer') || 'standard';
        
        // 預設顏色列表
        const colors = ['#007bff', '#e67e22', '#27ae60', '#8e44ad', '#c0392b', '#2c3e50'];
        const colorDots = colors.map(c => 
            `<div class="color-dot ${curColor===c?'active':''}" style="background:${c}" onclick="window.rfApp.ui.pickColor('${c}')"></div>`
        ).join('');

        overlay.innerHTML = `
            <div class="settings-container">
                <div class="settings-header">
                    <span><i class="fas fa-cog"></i> 設定 (Settings)</span>
                    <i class="fas fa-times" onclick="window.rfApp.ui.closeSettings()" style="cursor:pointer;"></i>
                </div>
                <div class="settings-body">
                    
                    <div class="setting-group">
                        <label>🌐 語言 / Language</label>
                        <select class="green-select" onchange="window.rfApp.theme.applyLanguage(this.value)">
                            <option value="zh" ${state.currentLang==='zh'?'selected':''}>繁體中文</option>
                            <option value="en" ${state.currentLang==='en'?'selected':''}>English</option>
                            <option value="ja" ${state.currentLang==='ja'?'selected':''}>日本語</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label>🎨 主題顏色 (Primary Color)</label>
                        <div class="color-picker-row">
                            ${colorDots}
                            <input type="color" id="custom-color-picker" value="${curColor}" onchange="window.rfApp.ui.pickColor(this.value)">
                        </div>
                    </div>

                    <div class="setting-group">
                        <label>✨ 介面裝飾 (Interface Style)</label>
                        <select class="green-select" onchange="window.rfApp.theme.changeSkin(this.value)">
                            <option value="default" ${curSkin==='default'?'selected':''}>系統預設 (Clean)</option>
                            <option value="glass" ${curSkin==='glass'?'selected':''}>💧 液態玻璃 (Glass)</option>
                            <option value="newyear" ${curSkin==='newyear'?'selected':''}>🧧 新年喜慶 (Lunar New Year)</option>
                            <option value="sakura" ${curSkin==='sakura'?'selected':''}>🌸 浪漫櫻花 (Sakura)</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label>🗺️ 地圖圖層</label>
                        <select class="green-select" onchange="window.rfApp.ui.handleLayerChange(this.value)">
                            <option value="standard" ${curLayer==='standard'?'selected':''}>標準街道圖</option>
                            <option value="satellite" ${curLayer==='satellite'?'selected':''}>衛星空照圖</option>
                            <option value="topo" ${curLayer==='topo'?'selected':''}>地形等高線</option>
                            <option value="history" ${curLayer==='history'?'selected':''}>歷史懷舊圖</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label>⚙️ 進階功能</label>
                        <div class="toggle-row">
                            <span>顯示大眾交通路網</span>
                            <label class="switch"><input type="checkbox" id="tog-transit" onchange="window.rfApp.map.toggleTransitLayer(this.checked)"><span class="slider"></span></label>
                        </div>
                        <div id="pwa-install-row" class="toggle-row" style="display:none; justify-content:center; background:var(--primary); color:white; cursor:pointer;" onclick="installPWA()">
                            <span>📲 安裝 App 到主畫面</span>
                        </div>
                    </div>

                </div>
            </div>
        `;
    };

    window.rfApp.ui.enterMap = () => { 
        ['intro', 'welcome-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('u-fade-out'); setTimeout(() => el.classList.add('u-hidden'), 400); }
        });
        const functionPanel = document.getElementById("side-function-zone");
        if(functionPanel) { functionPanel.classList.remove("collapsed", "u-hidden"); functionPanel.classList.add("u-flex"); }
    };

    window.rfApp.ui.openSettings = () => { 
        injectSettingsUI(); 
        const m = document.getElementById('settings-modal-overlay'); 
        if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); } 
    };
    
    window.rfApp.ui.closeSettings = () => { 
        const m = document.getElementById('settings-modal-overlay'); 
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } 
    };

    // 處理顏色選擇
    window.rfApp.ui.pickColor = (color) => {
        window.rfApp.theme.changeColor(color);
        injectSettingsUI(); // 重繪以更新選中狀態
    };

    window.rfApp.ui.handleLayerChange = (layerType) => {
        localStorage.setItem('rf_base_layer', layerType);
        if (window.rfApp.map && typeof window.rfApp.map.switchBaseLayer === 'function') {
            window.rfApp.map.switchBaseLayer(layerType);
        }
    };

    setTimeout(() => {
        const savedLayer = localStorage.getItem('rf_base_layer');
        if (savedLayer && window.rfApp.map.switchBaseLayer) window.rfApp.map.switchBaseLayer(savedLayer);
    }, 1500);

    window.enterMap = window.rfApp.ui.enterMap;
    window.openSettings = window.rfApp.ui.openSettings;
    window.closeSettings = window.rfApp.ui.closeSettings;
}
