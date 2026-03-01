// js/modules/hub/assistant.js
export function updateAIAssistant(temp, code) {
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
                <div style="width:50px; height:50px; background:linear-gradient(135deg, var(--primary), #2980b9); border-radius:50%; display:flex; justify-content:center; align-items:center; color:white; font-size:22px; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.2); flex-shrink:0;">瑞</div>
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
