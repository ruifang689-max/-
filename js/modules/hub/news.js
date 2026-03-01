// js/modules/hub/news.js (真實 API 串接版)

export async function renderNewsPanel() {
    const panel = document.getElementById('dash-panel-news');
    if (!panel) return;

    // 1. 先畫出「載入中」的骨架與外部新聞搜尋按鈕
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0; color:var(--primary);"><i class="fas fa-bullhorn"></i> 在地情報局</h4>
            <span id="news-status-badge" style="font-size:12px; background:var(--primary); color:white; padding:3px 8px; border-radius:12px;">
                <i class="fas fa-sync fa-spin"></i> 即時同步中
            </span>
        </div>

        <div id="news-dynamic-container">
            <div style="text-align:center; padding:40px 20px; color:#888;">
                <i class="fas fa-satellite-dish fa-spin" style="font-size:30px; margin-bottom:15px; color:var(--primary);"></i>
                <div style="font-size:14px; font-weight:bold;">正在連接新北市政府資料庫...</div>
            </div>
        </div>

        <div style="margin-top:25px; padding-top:15px; border-top:1px dashed #ddd;">
            <h5 style="margin:0 0 12px 0; color:#888; font-size:13px;"><i class="fas fa-search"></i> 瑞芳最新時事搜尋</h5>
            <div style="display:flex; gap:10px;">
                <a href="https://news.google.com/search?q=%E7%91%9E%E8%8A%B3%20%E6%97%85%E9%81%8A&hl=zh-TW&gl=TW&ceid=TW%3Azh-Hant" target="_blank" style="flex:1; background:white; padding:12px; border-radius:12px; text-align:center; color:#444; text-decoration:none; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.05); border:1px solid #eee; transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                    <i class="fab fa-google" style="color:#ea4335; margin-right:4px;"></i> Google 新聞
                </a>
                <a href="https://tw.news.yahoo.com/tag/%E7%91%9E%E8%8A%B3" target="_blank" style="flex:1; background:white; padding:12px; border-radius:12px; text-align:center; color:#444; text-decoration:none; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.05); border:1px solid #eee; transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                    <i class="fab fa-yahoo" style="color:#410093; margin-right:4px;"></i> Yahoo 新聞
                </a>
            </div>
        </div>
    `;

    // 2. 在背景默默呼叫您部署的 GAS API
    try {
        const apiURL = "https://script.google.com/macros/s/AKfycbwhEEPTab-Z8nc00uxCF-xfgZZIwC5fYOKYwzdTa_l6710xudkGNzNhmtbZZKqrycej/exec";
        
        const res = await fetch(apiURL);
        const json = await res.json();
        
        const container = document.getElementById('news-dynamic-container');
        
        if (json.status === "success" && json.data.length > 0) {
            let html = "";
            
            // 將抓回來的每一筆新聞轉成精緻的卡片
            json.data.forEach((news, index) => {
                // 為了視覺豐富度，讓第一筆重要新聞用紅色，其他用橘色/藍色
                const isFirst = index === 0;
                const borderColor = isFirst ? "#e74c3c" : "#3498db";
                const icon = isFirst ? "fa-exclamation-triangle" : "fa-info-circle";
                const badgeText = isFirst ? "最新公告" : "市政快訊";
                const bgIconColor = isFirst ? "rgba(231,76,60,0.05)" : "rgba(52,152,219,0.05)";

                html += `
                <div style="background:white; padding:16px; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,0.05); margin-bottom:12px; border-left:4px solid ${borderColor}; position:relative; overflow:hidden;">
                    <div style="position:absolute; top:-10px; right:-10px; font-size:60px; color:${bgIconColor}; pointer-events:none;"><i class="fas ${icon}"></i></div>
                    <div style="font-size:12px; color:${borderColor}; font-weight:bold; margin-bottom:6px;">🚨 ${badgeText} · ${news.date}</div>
                    <h5 style="margin:0 0 12px 0; font-size:15px; color:#2c3e50; line-height:1.4;">${news.title}</h5>
                    <a href="${news.link}" target="_blank" style="display:inline-block; font-size:12px; background:#f1f2f6; color:#333; padding:6px 12px; border-radius:12px; text-decoration:none; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='${borderColor}'; this.style.color='white';" onmouseout="this.style.background='#f1f2f6'; this.style.color='#333';">閱讀完整公告 ➔</a>
                </div>
                `;
            });
            
            // 替換掉原本的載入中動畫
            if(container) container.innerHTML = html;

            // 把右上角的標籤改為綠色打勾
            const statusBadge = document.getElementById('news-status-badge');
            if(statusBadge) {
                statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> 最新同步';
                statusBadge.style.background = '#27ae60';
            }

        } else {
            throw new Error("無新聞資料");
        }
    } catch (err) {
        console.error("新聞串接失敗:", err);
        const container = document.getElementById('news-dynamic-container');
        if (container) {
            container.innerHTML = `
                <div style="background:white; padding:16px; border-radius:16px; border-left:4px solid #f39c12; color:#666; font-size:13px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                    <i class="fas fa-exclamation-circle" style="color:#f39c12;"></i> 無法取得最新市政新聞，請檢查網路連線或稍後再試。
                </div>
            `;
        }
    }
}
