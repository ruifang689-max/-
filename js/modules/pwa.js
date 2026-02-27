// js/modules/pwa.js (v662) - 跨平台 PWA 安裝與 iOS 教學模組

let deferredPrompt = null;

export function initPWA() {
    const installBtnContainer = document.getElementById('install-btn-container');
    const iosModal = document.getElementById('ios-instruction-modal');
    
    // 預設先將 iOS 教學視窗隱藏 (防跑版)
    if (iosModal) iosModal.style.display = 'none';

    // 🌟 1. 偵測裝置與環境
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // 偵測是否已經安裝並以 App 模式執行
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // 如果是 iOS 且還沒安裝：因為 iOS 永遠不會觸發自動安裝事件，所以我們直接強制顯示設定裡的「安裝 App」按鈕
    if (isIOS && !isStandalone) {
        if (installBtnContainer) installBtnContainer.style.display = 'block';
    }

    // 🌟 2. 監聽 PWA 安裝事件 (針對 Android / 電腦版瀏覽器)
    window.addEventListener('beforeinstallprompt', (e) => {
        // 防止瀏覽器在啟動時直接彈出安裝提示 (太煩人，把主控權留在設定選單內)
        e.preventDefault();
        deferredPrompt = e;
        
        // 此時才顯示設定選單內的「安裝 App」按鈕
        if (installBtnContainer) installBtnContainer.style.display = 'block';
    });

    // 🌟 3. 監聽「安裝成功」事件
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        // 安裝完畢後隱藏按鈕
        if (installBtnContainer) installBtnContainer.style.display = 'none';
        
        if (typeof window.showToast === 'function') {
            const msg = window.rfApp.t('app_installed') || 'App 已成功安裝至桌面！';
            window.showToast(msg, 'success');
        }
    });

    // 🌟 4. 註冊全域安裝功能 (讓 HTML 上的按鈕呼叫)
    window.rfApp.pwa = window.rfApp.pwa || {};
    
    window.rfApp.pwa.installPWA = async () => {
        if (isStandalone) {
            if (typeof window.showToast === 'function') {
                window.showToast(window.rfApp.t('already_installed') || '您已經安裝此 App 囉！', 'info');
            }
            return;
        }

        if (isIOS) {
            // iOS 裝置：彈出精美的圖文手動教學 Modal
            if (iosModal) {
                iosModal.style.display = 'flex';
                // 順便把背後的系統設定視窗關掉，避免畫面太雜亂
                if (typeof window.closeSettings === 'function') window.closeSettings();
            }
        } else if (deferredPrompt) {
            // Android/電腦版：觸發系統原生 PWA 安裝詢問
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`使用者的安裝意願: ${outcome}`);
            
            // 詢問過後清空，並隱藏按鈕
            deferredPrompt = null;
            if (installBtnContainer) installBtnContainer.style.display = 'none';
        } else {
            // 瀏覽器不支援，或是不符合 PWA 條件 (例如沒有 SSL 或 Service Worker)
            if (typeof window.showToast === 'function') {
                window.showToast(window.rfApp.t('install_not_supported') || '請透過瀏覽器的選單手動「加入主畫面」。', 'info');
            }
        }
    };

    // 關閉 iOS 教學視窗
    window.rfApp.pwa.closeIosInstruction = () => {
        if (iosModal) iosModal.style.display = 'none';
    };

    // 🌟 5. 將函數掛載回 window 供 HTML 點擊事件使用
    window.installPWA = window.rfApp.pwa.installPWA;
    window.closeIosInstruction = window.rfApp.pwa.closeIosInstruction;

    // 🌟 6. 正式註冊 Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('📦 Service Worker 註冊成功，PWA 就緒！'))
                .catch(err => console.error('Service Worker 註冊失敗:', err));
        });
    }
}
