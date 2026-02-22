// js/modules/toast.js (v625)

// 🌟 1. 優雅的浮動提示系統 (Toast)
export function showToast(message, type = 'info') {
    // 自動建立或獲取 Toast 容器
    let container = document.getElementById('rf-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'rf-toast-container';
        // 將容器固定在畫面上方中央
        container.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none; align-items:center;';
        document.body.appendChild(container);
    }

    // 建立單一提示框
    const toast = document.createElement('div');
    
    // 根據 type 決定背景顏色 (套用您專案的變數)
    let bg = 'rgba(0, 0, 0, 0.8)'; // 預設黑灰色
    let icon = '<i class="fas fa-info-circle"></i>';
    if (type === 'error') { bg = 'var(--danger, #dc3545)'; icon = '<i class="fas fa-exclamation-triangle"></i>'; }
    if (type === 'success') { bg = '#28a745'; icon = '<i class="fas fa-check-circle"></i>'; }

    toast.style.cssText = `background:${bg}; color:white; padding:12px 24px; border-radius:30px; font-size:14px; box-shadow:0 4px 15px rgba(0,0,0,0.2); opacity:0; transform:translateY(-20px); transition:all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); display:flex; align-items:center; gap:8px; font-weight:bold; line-height:1.4; max-width: 90vw; text-align:left; word-break: break-word;`;
    toast.innerHTML = `${icon} <span>${message}</span>`;

    container.appendChild(toast);

    // 觸發進入動畫
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // 3 秒後自動消失
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        // 動畫結束後從 DOM 移除
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// 🌟 2. 全域錯誤防護網 (Global Error Boundary)
export function initErrorHandler() {
    // 攔截一般 JavaScript 執行期錯誤
    window.addEventListener('error', (e) => {
        console.error("🛡️ [全域防護網] 捕捉到程式錯誤:", e.error);
        showToast(`哎呀，系統遇到一點小問題 🤕<br><small style="font-weight:normal;">${e.message}</small>`, 'error');
    });

    // 攔截未處理的 Promise 錯誤 (通常是 Fetch API 網路斷線或超時)
    window.addEventListener('unhandledrejection', (e) => {
        console.error("🛡️ [全域防護網] 捕捉到非同步連線異常:", e.reason);
        // 如果錯誤訊息包含 fetch 或 network，顯示網路異常
        const errorMsg = (e.reason && e.reason.message) ? e.reason.message.toLowerCase() : '';
        if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
            showToast(`網路連線異常 📡<br><small style="font-weight:normal;">請檢查網路訊號後再試</small>`, 'error');
        } else {
            showToast(`處理資料時發生異常 ⚠️`, 'error');
        }
    });

    // 註冊到我們在 v620 建立的命名空間，讓全站都能隨時呼叫
    if (window.rfApp && window.rfApp.ui) {
        window.rfApp.ui.showToast = showToast;
    }
    
    // 向下相容，讓 HTML 也可以直接觸發
    window.showToast = showToast;

    console.log("🛡️ 全域防護網已啟動");
}
