import { state } from '../core/store.js';

export function initPWA() {
    let deferredPrompt; 
    const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; 
    const isStandalone = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    
    window.addEventListener('beforeinstallprompt', (e) => { 
        e.preventDefault(); deferredPrompt = e; 
        const btn = document.getElementById('install-btn-container'); 
        if(btn) { btn.classList.remove('u-hidden'); btn.classList.add('u-block'); } 
    });
    
    window.installPWA = () => { 
        if (isIos() && !isStandalone()) { 
            const m = document.getElementById('ios-instruction-modal');
            if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); }
            if(typeof window.closeSettings === 'function') window.closeSettings(); 
            return; 
        } 
        if (!deferredPrompt) return; 
        const btn = document.getElementById('install-btn-container');
        if(btn) btn.classList.add('u-hidden'); 
        deferredPrompt.prompt(); 
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); 
    };
    
    window.closeIosInstruction = () => { 
        const m = document.getElementById('ios-instruction-modal');
        if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); }
    };
    
    window.shareSpot = () => { 
        if(!state.targetSpot) return; 
        const spotUrl = new URL(window.location.href.split('?')[0]); 
        spotUrl.searchParams.set('spot', state.targetSpot.name); 
        const shareData = { title: `瑞芳導覽 - ${state.targetSpot.name}`, text: `我在瑞芳發現了「${state.targetSpot.name}」！`, url: spotUrl.toString() }; 
        if (navigator.share) navigator.share(shareData).catch(()=>{}); 
        else navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => alert('✅ 已複製景點連結！')); 
    };
    
    window.shareAppMap = () => { 
        const shareData = { title: '瑞芳導覽地圖 App', text: '快來看看這個瑞芳專屬的智慧導覽地圖！', url: 'https://ruifang689-max.github.io/-/' }; 
        if (navigator.share) navigator.share(shareData).catch(()=>{}); 
        else navigator.clipboard.writeText(shareData.url).then(() => alert('✅ 網址已複製！')); 
    };
}
