// js/modules/hub/transport.js

export function renderTransportPanel() {
    const panel = document.getElementById('dash-panel-transport');
    if (!panel) return;

    // 建立一個漂亮且具備「即時動態」感覺的介面 (目前先佈署 UI 框架與模擬數據，未來可串接 TDX API)
    panel.innerHTML = `
        <div style="background:white; padding:18px; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,0.05); margin-bottom:15px;">
            <h4 style="margin:0 0 15px 0; color:var(--primary); display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fas fa-bus"></i> 熱門公車動態 (瑞芳火車站)</span>
                <span style="font-size:12px; color:#888; font-weight:normal;"><i class="fas fa-sync-alt"></i> 剛剛更新</span>
            </h4>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f2f6; padding-bottom:12px; margin-bottom:12px;">
                <div>
                    <div style="font-weight:900; font-size:18px; color:#2c3e50; margin-bottom:4px;">788 <span style="font-size:12px; background:#f1f2f6; padding:3px 8px; border-radius:6px; color:#666; font-weight:bold;">往 九份 / 金瓜石</span></div>
                </div>
                <div style="color:#e74c3c; font-weight:bold; font-size:15px; background:rgba(231, 76, 60, 0.1); padding:4px 10px; border-radius:8px;">即將進站</div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f2f6; padding-bottom:12px; margin-bottom:12px;">
                <div>
                    <div style="font-weight:900; font-size:18px; color:#2c3e50; margin-bottom:4px;">965 <span style="font-size:12px; background:#f1f2f6; padding:3px 8px; border-radius:6px; color:#666; font-weight:bold;">往 台北 / 板橋</span></div>
                </div>
                <div style="color:#f39c12; font-weight:bold; font-size:15px; background:rgba(243, 156, 18, 0.1); padding:4px 10px; border-radius:8px;">約 5 分鐘</div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:900; font-size:18px; color:#2c3e50; margin-bottom:4px;">856 <span style="font-size:12px; background:#f1f2f6; padding:3px 8px; border-radius:6px; color:#666; font-weight:bold;">台灣好行 (黃金福隆線)</span></div>
                </div>
                <div style="color:#27ae60; font-weight:bold; font-size:15px; background:rgba(39, 174, 96, 0.1); padding:4px 10px; border-radius:8px;">約 12 分鐘</div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <a href="https://www.railway.gov.tw/tra-tip-web/tip" target="_blank" style="background:white; padding:15px; border-radius:16px; text-align:center; color:#2c3e50; text-decoration:none; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.05); transition:transform 0.2s;">
                <i class="fas fa-train" style="font-size:28px; color:#3498db; display:block; margin-bottom:8px;"></i> 台鐵時刻表
            </a>
            <a href="https://www.taxitw.com/" target="_blank" style="background:white; padding:15px; border-radius:16px; text-align:center; color:#2c3e50; text-decoration:none; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.05); transition:transform 0.2s;">
                <i class="fas fa-taxi" style="font-size:28px; color:#f1c40f; display:block; margin-bottom:8px;"></i> 預約計程車
            </a>
        </div>
    `;
}
