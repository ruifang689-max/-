// js/modules/pwa.js (v651) - 現代化 PWA 與分享模組
import { state } from '../core/store.js';

export function initPWA() {
    let deferredPrompt; 
    const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; 
    const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    
    // 🌟 1. 監聽安裝事件
    window.addEventListener('beforeinstallprompt', (e) => { 
        e.preventDefault(); 
        deferredPrompt = e; 
        const btn = document.getElementById('install-btn-container'); 
        if(btn) { btn.classList.remove('u-hidden'); btn.classList.add('u-block'); } 
    });

    // 🌟 2. 安裝邏輯
    window.rfApp.pwa.installPWA = () => { 
        if (isIos() && !isStandalone()) { 
            const m = document.getElementById('ios-instruction-modal');
            if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
            // 呼叫 UI 模組關閉設定面板
            if(window.rfApp.ui && typeof window.rfApp.ui.closeSettings === 'function') {
                window.rfApp.ui.closeSettings(); 
            }
            return; 
        } 
        
        if (!deferredPrompt) {
            if (typeof window.showToast === 'function') window.showToast('您的瀏覽器已安裝或暫不支援直接安裝', 'info');
            return;
        }

        const btn = document.getElementById('install-btn-container');
        if(btn) btn.classList.add('u-hidden'); 
        
        deferredPrompt.prompt(); 
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                if (typeof window.showToast === 'function') window.showToast('感謝安裝！', 'success');
            }
            deferredPrompt = null; 
        }); 
    };
    
    window.rfApp.pwa.closeIosInstruction = () => { 
        const m = document.getElementById('ios-instruction-modal');
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); }
    };
    
    // 🌟 3. 分享功能擴充 (使用精美 Toast)
    window.rfApp.pwa.shareSpot = () => { 
        if(!state.targetSpot) return; 
        
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?spot=${encodeURIComponent(state.targetSpot.name)}`;
        
        const shareData = { 
            title: `瑞芳導覽 - ${state.targetSpot.name}`, 
            text: `我在瑞芳發現了「${state.targetSpot.name}」，快用地圖看看！`, 
            url: shareUrl 
        }; 

        if (navigator.share) {
            navigator.share(shareData).catch(()=>{}); 
        } else {
            navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`).then(() => {
                if (typeof window.showToast === 'function') window.showToast('✅ 景點連結已複製到剪貼簿', 'success');
            }); 
        }
    };
    
    window.rfApp.pwa.shareAppMap = () => { 
        const shareData = { 
            title: '瑞芳導覽地圖', 
            text: '快來看看這個瑞芳專屬的智慧導覽地圖！', 
            url: window.location.origin + window.location.pathname 
        }; 
        if (navigator.share) {
            navigator.share(shareData).catch(()=>{}); 
        } else {
            navigator.clipboard.writeText(shareData.url).then(() => {
                if (typeof window.showToast === 'function') window.showToast('✅ App 網址已複製', 'success');
            }); 
        }
    };

    // 🌟 4. 向下相容橋樑
    window.installPWA = window.rfApp.pwa.installPWA;
    window.closeIosInstruction = window.rfApp.pwa.closeIosInstruction;
    window.shareSpot = window.rfApp.pwa.shareSpot;
    window.shareAppMap = window.rfApp.pwa.shareAppMap;
}
