// js/modules/pwa.js (v657) - 國際化翻譯支援版
import { state } from '../core/store.js';

export function initPWA() {
    let deferredPrompt; 
    const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; 
    const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    
    window.addEventListener('beforeinstallprompt', (e) => { 
        e.preventDefault(); 
        deferredPrompt = e; 
        const btn = document.getElementById('install-btn-container'); 
        if(btn) { btn.classList.remove('u-hidden'); btn.classList.add('u-block'); } 
    });

    window.rfApp.pwa.installPWA = () => { 
        if (isIos() && !isStandalone()) { 
            const m = document.getElementById('ios-instruction-modal');
            if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
            if(window.rfApp.ui && typeof window.rfApp.ui.closeSettings === 'function') window.rfApp.ui.closeSettings(); 
            return; 
        } 
        if (!deferredPrompt) return;
        const btn = document.getElementById('install-btn-container');
        if(btn) btn.classList.add('u-hidden'); 
        deferredPrompt.prompt(); 
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); 
    };
    
    window.rfApp.pwa.closeIosInstruction = () => { 
        const m = document.getElementById('ios-instruction-modal');
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); }
    };
    
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
                // 🌟 動態翻譯
                if (typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_copy_success'), 'success');
            }); 
        }
    };
    
    window.rfApp.pwa.shareAppMap = () => { 
        const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: window.location.origin + window.location.pathname }; 
        if (navigator.share) {
            navigator.share(shareData).catch(()=>{}); 
        } else {
            navigator.clipboard.writeText(shareData.url).then(() => {
                // 🌟 動態翻譯
                if (typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_copy_success'), 'success');
            }); 
        }
    };

    window.installPWA = window.rfApp.pwa.installPWA;
    window.closeIosInstruction = window.rfApp.pwa.closeIosInstruction;
    window.shareSpot = window.rfApp.pwa.shareSpot;
    window.shareAppMap = window.rfApp.pwa.shareAppMap;
}
