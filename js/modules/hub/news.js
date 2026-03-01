// js/modules/hub/news.js (靜動態完美融合版)

export function renderNewsPanel() {
    const panel = document.getElementById('dash-panel-news');
    if (!panel) return;

    // 1. 立即渲染完美的靜態骨架 (包含預留給動態新聞的空位)
    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0; color:var(--primary);"><i class="fas fa-bullhorn"></i> 在地情報局</h4>
            <span id="news-status-badge" style="font-size:12px; background:var(--primary); color:white; padding:3px 8px; border-radius:12px;">
                <i class="fas fa-sync fa-spin"></i> 嘗試同步中
            </span>
        </div>

        <div id="dynamic-news-container"></div>

        <div style="background:white; padding:16px; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,0.05); margin-bottom:12px; border-left:4px solid #e74c3c; position:relative; overflow:hidden;">
            <div style="position:absolute; top:-10px; right:-10px; font-size:60px; color:rgba(231,76,60,0.05); pointer-events:none;"><i class="fas fa-exclamation-triangle"></i></div>
            <div style="font-size:12px; color:#e74c3c; font-weight:bold; margin-bottom:6px;">🚨 瑞芳區公所 公告</div>
            <h5 style="margin:0 0 8px 0; font-size:15px; color:#2c3e50; line-height:1.4;">山區氣候多變，前往步道請注意安全</h5>
            <p style="font-size:13px; color:#666; margin:0 0 12px 0; line-height:1.5;">受天候影響，瑞芳山區可能有局部大雨。為維護遊客安全，行走無耳茶壺山等陡峭步道時，請隨時注意落石與自身步伐...</p>
            <a href="https://www.ruifang.ntpc.gov.tw/" target="_blank" style="display:inline-block; font-size:12px; background:#f1f2f6; color:#333; padding:6px 12px; border-radius:12px; text-decoration:none; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#e74c3c'; this.style.color='white';" onmouseout="this.style.background='#f1f2f6'; this.style.color='#333';">前往官網確認 ➔</a>
        </div>

        <div style="background:white; padding:16px; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,0.05); margin-bottom:12px; border-left:4px solid #f39c12; position:relative; overflow:hidden;">
            <div style="position:absolute; top:-10px; right:-10px; font-size:60px; color:rgba(243,156,18,0.05); pointer-events:none;"><i class="fas fa-star"></i></div>
            <div style="font-size:12px; color:#f39c12; font-weight:bold; margin-bottom:6px;">✨ 新北市觀旅局 活動快訊</div>
            <h5 style="margin:0 0 8px 0; font-size:15px; color:#2c3e50; line-height:1.4;">探索黃金山城，體驗在地特色節慶！</h5>
            <p style="font-size:13px; color:#666; margin:0 0 12px 0; line-height:1.5;">瑞芳擁有豐富的礦業歷史與絕美海岸。無論是九份的紅燈籠、猴硐的貓村生態，或是深澳鐵道自行車，都歡迎您來探索...</p>
            <a href="https://newtaipei.travel/zh-tw/regional/detail/118" target="_blank" style="display:inline-block; font-size:12px; background:#f1f2f6; color:#333; padding:6px 12px; border-radius:12px; text-decoration:none; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#f39c12'; this.style.color='white';" onmouseout="this.style.background='#f1f2f6'; this.style.color='#333';">探索更多景點 ➔</a>
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

    // 2. 靜默抓取您部署的 GAS API (不使用 await 阻塞畫面)
    const apiURL = "https://script.google.com/macros/s/AKfycbwhEEPTab-Z8nc00uxCF-xfgZZIwC5fYOKYwzdTa_l6710xudkGNzNhmtbZZKqrycej/exec";
    
    fetch(apiURL)
        .then(res => res.json())
        .then(json => {
            if (json.status === "success" && json.data.length > 0) {
                const container = document.getElementById('dynamic-news-container');
                let html = "";
                
                // 為了不讓版面過長，只取前兩筆最新新聞
                const topNews = json.data.slice(0, 2);
                
                topNews.forEach(news => {
                    const borderColor = "#3498db";
                    html += `
                    <div style="background:white; padding:16px; border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,0.05); margin-bottom:12px; border-left:4px solid ${borderColor}; position:relative; overflow:hidden;">
                        <div style="position:absolute; top:-10px; right:-10px; font-size:60px; color:rgba(52,152,219,0.05); pointer-events:none;"><i class="fas fa-info-circle"></i></div>
                        <div style="font-size:12px; color:${borderColor}; font-weight:bold; margin-bottom:6px;">📡 市政快訊 · ${news.date}</div>
                        <h5 style="margin:0 0 8px 0; font-size:15px; color:#2c3e50; line-height:1.4;">${news.title}</h5>
                        <a href="${news.link}" target="_blank" style="display:inline-block; font-size:12px; background:#f1f2f6; color:#333; padding:6px 12px; border-radius:12px; text-decoration:none; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='${borderColor}'; this.style.color='white';" onmouseout="this.style.background='#f1f2f6'; this.style.color='#333';">閱讀完整公告 ➔</a>
                    </div>
                    `;
                });
                
                // 如果成功抓到，就把藍色的新聞卡片插進去
                if (container) container.innerHTML = html;

                // 將右上角的標籤改為綠色的成功狀態
                const badge = document.getElementById('news-status-badge');
                if (badge) {
                    badge.innerHTML = '<i class="fas fa-check-circle"></i> 最新同步';
                    badge.style.background = '#27ae60';
                }
            } else {
                throw new Error("API 回傳無效的資料格式");
            }
        })
        .catch(err => {
            // 🌟 核心防護：如果發生網路錯誤或超時，我們什麼醜字都不顯示！
            // 只需要默默地把右上角的標籤還原成預設狀態即可。
            console.warn("GAS 新聞連線超時或阻擋，維持靜態備援顯示:", err);
            const badge = document.getElementById('news-status-badge');
            if (badge) {
                badge.innerHTML = '<i class="fas fa-bolt"></i> 精選情報';
                badge.style.background = 'var(--primary)';
            }
        });
}
