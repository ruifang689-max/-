// js/modules/tour.js (v651) - 導覽教學架構優化版
import { state } from '../core/store.js';

export function initTour() {
    
    // --- 跳過設定管理 ---
    window.rfApp.tour.saveSkipSettings = () => {
        const anim = document.getElementById('toggle-skip-anim');
        const welcome = document.getElementById('toggle-skip-welcome');
        const tour = document.getElementById('toggle-skip-tour');
        const tutorial = document.getElementById('toggle-skip-tutorial');

        if(anim) localStorage.setItem('rf_skip_anim', anim.checked);
        if(welcome) localStorage.setItem('rf_skip_welcome', welcome.checked);
        if(tour) localStorage.setItem('rf_skip_tour', tour.checked);
        if(tutorial) localStorage.setItem('rf_skip_tutorial', tutorial.checked);
    };

    window.rfApp.tour.loadSkipSettings = () => {
        const skipAnim = localStorage.getItem('rf_skip_anim') === 'true';
        const skipWelcome = localStorage.getItem('rf_skip_welcome') === 'true';
        const skipTour = localStorage.getItem('rf_skip_tour') === 'true';
        const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';

        if(document.getElementById('toggle-skip-anim')) document.getElementById('toggle-skip-anim').checked = skipAnim;
        if(document.getElementById('toggle-skip-welcome')) document.getElementById('toggle-skip-welcome').checked = skipWelcome;
        if(document.getElementById('toggle-skip-tour')) document.getElementById('toggle-skip-tour').checked = skipTour;
        if(document.getElementById('toggle-skip-tutorial')) document.getElementById('toggle-skip-tutorial').checked = skipTutorial;

        // 執行跳過動作
        if (skipAnim) { 
            const animOverlay = document.getElementById('intro-animation') || document.querySelector('.intro-overlay'); 
            if (animOverlay) animOverlay.classList.add('u-hidden', 'u-fade-out'); 
        }
        
        if (skipWelcome) {
            const welcomeScreen = document.getElementById('welcome-screen');
            if (welcomeScreen) welcomeScreen.classList.add('u-hidden', 'u-fade-out');
            
            // 智慧接續：如果沒做過功能導覽就做導覽，否則檢查操作教學
            if (!skipTour) {
                setTimeout(() => window.rfApp.tour.startFeatureTour(), 500);
            } else if (!skipTutorial) {
                setTimeout(() => window.rfApp.tour.startTutorialOverlay(), 500);
            }
        }
    };

    // --- 功能導覽步驟 (Feature Tour) ---
    let currentTourStep = 0;
    const tourSteps = [
        { target: '#search', text: '🔍 <b style="color:var(--primary); font-size:16px;">搜尋景點</b><br>在這裡輸入關鍵字，可以快速尋找景點與秘境！', pos: 'bottom' },
        { target: '#category-chips', text: '🏷️ <b style="color:var(--primary); font-size:16px;">分類標籤</b><br>左右滑動並點擊標籤，地圖會瞬間過濾出想去的類型！', pos: 'bottom' },
        { target: 'button[onclick*="openSettings"]', text: '⚙️ <b style="color:var(--primary); font-size:16px;">系統設定</b><br>從這裡可以管理收藏夾、切換語言、更改主題顏色與字體喔！', pos: 'top' },
        { target: 'center', text: '🗺️ <b style="color:var(--primary); font-size:16px;">探索地圖</b><br>💡 <b>隱藏技巧</b>：長按地圖任一處，還能新增專屬的自訂景點！', pos: 'center' }
    ];

    window.rfApp.tour.startFeatureTour = () => { 
        const overlay = document.getElementById('tour-overlay');
        if(overlay) { overlay.classList.remove('u-hidden'); overlay.classList.add('u-block'); }
        currentTourStep = 0; 
        window.rfApp.tour.showTourStep(); 
    };

    window.rfApp.tour.showTourStep = () => {
        if(currentTourStep >= tourSteps.length) { window.rfApp.tour.endTour(); return; }
        
        const step = tourSteps[currentTourStep]; 
        const ring = document.getElementById('tour-focus-ring'); 
        const tooltip = document.getElementById('tour-tooltip');
        const textEl = document.getElementById('tour-text');
        const nextBtn = document.getElementById('tour-next-btn');
        
        if(textEl) textEl.innerHTML = step.text;
        if(nextBtn) nextBtn.innerText = (currentTourStep === tourSteps.length - 1) ? '開始探索！' : '下一步';

        if (step.target !== 'center' && ring && tooltip) {
            const targetEl = document.querySelector(step.target);
            if(targetEl) {
                const rect = targetEl.getBoundingClientRect(); 
                const pad = 6;
                ring.classList.remove('u-hidden'); ring.classList.add('u-block'); 
                ring.style.top = (rect.top - pad) + 'px'; 
                ring.style.left = (rect.left - pad) + 'px'; 
                ring.style.width = (rect.width + pad*2) + 'px'; 
                ring.style.height = (rect.height + pad*2) + 'px'; 
                ring.style.borderRadius = window.getComputedStyle(targetEl).borderRadius;
                
                tooltip.style.left = '50%'; 
                tooltip.style.transform = 'translateX(-50%)';
                if(step.pos === 'bottom') { 
                    tooltip.style.top = (rect.bottom + pad + 15) + 'px'; tooltip.style.bottom = 'auto'; 
                } else if(step.pos === 'top') { 
                    tooltip.style.bottom = (window.innerHeight - rect.top + pad + 15) + 'px'; tooltip.style.top = 'auto'; 
                }
            }
        } else if (ring && tooltip) {
            ring.classList.remove('u-hidden'); ring.classList.add('u-block'); 
            ring.style.top = '50%'; ring.style.left = '50%'; ring.style.width = '0px'; ring.style.height = '0px'; ring.style.border = 'none';
            tooltip.style.top = '50%'; tooltip.style.left = '50%'; tooltip.style.transform = 'translate(-50%, -50%)'; tooltip.style.bottom = 'auto';
        }
    };

    window.rfApp.tour.nextTourStep = () => { currentTourStep++; window.rfApp.tour.showTourStep(); };

    window.rfApp.tour.endTour = () => {
        const overlay = document.getElementById('tour-overlay');
        const ring = document.getElementById('tour-focus-ring');
        if(overlay) { overlay.classList.remove('u-block'); overlay.classList.add('u-hidden'); }
        if(ring) { ring.classList.remove('u-block'); ring.classList.add('u-hidden'); }
        
        localStorage.setItem('rf_skip_tour', 'true');
        const toggleTour = document.getElementById('toggle-skip-tour');
        if(toggleTour) toggleTour.checked = true;
        
        const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';
        if (!skipTutorial) setTimeout(() => window.rfApp.tour.startTutorialOverlay(), 300);
    };

    // --- 操作教學 (Tutorial Overlay) ---
    window.rfApp.tour.startTutorialOverlay = () => {
        const tutorial = document.getElementById('tutorial-overlay');
        if(tutorial) {
            tutorial.classList.remove('u-hidden', 'u-fade-out');
            tutorial.classList.add('u-flex'); 
            setTimeout(() => { tutorial.classList.add('u-fade-in'); }, 50); 
            
            const step1 = document.getElementById('tut-step-1');
            const step2 = document.getElementById('tut-step-2');
            if (step1) { step1.classList.remove('u-hidden'); step1.classList.add('u-block'); }
            if (step2) { step2.classList.remove('u-block'); step2.classList.add('u-hidden'); }
        }
    };

    window.rfApp.tour.nextTutorial = () => { 
        const step1 = document.getElementById('tut-step-1');
        const step2 = document.getElementById('tut-step-2');
        if(step1) { step1.classList.remove('u-block'); step1.classList.add('u-hidden'); }
        if(step2) { step2.classList.remove('u-hidden'); step2.classList.add('u-block'); }
    };

    window.rfApp.tour.prevTutorial = () => { 
        const step1 = document.getElementById('tut-step-1');
        const step2 = document.getElementById('tut-step-2');
        if(step2) { step2.classList.remove('u-block'); step2.classList.add('u-hidden'); }
        if(step1) { step1.classList.remove('u-hidden'); step1.classList.add('u-block'); }
    };

    window.rfApp.tour.finishTutorial = () => { 
        const tut = document.getElementById('tutorial-overlay');
        if(tut) {
            tut.classList.remove('u-fade-in');
            tut.classList.add('u-fade-out'); 
            setTimeout(() => { 
                tut.classList.remove('u-flex', 'u-fade-out'); 
                tut.classList.add('u-hidden'); 
                localStorage.setItem('rf_skip_tutorial', 'true');
                const toggleTut = document.getElementById('toggle-skip-tutorial');
                if(toggleTut) toggleTut.checked = true;
                if (state.mapInstance) state.mapInstance.invalidateSize(); 
            }, 400); 
        }
    };

    window.rfApp.tour.reopenTutorial = () => { 
        // 關閉可能開啟的設定面板
        if(window.rfApp.ui && typeof window.rfApp.ui.closeSettings === 'function') {
            window.rfApp.ui.closeSettings(); 
        }
        
        localStorage.setItem('rf_skip_tour', 'false'); 
        localStorage.setItem('rf_skip_tutorial', 'false');
        
        const toggleTour = document.getElementById('toggle-skip-tour');
        const toggleTut = document.getElementById('toggle-skip-tutorial');
        if(toggleTour) toggleTour.checked = false;
        if(toggleTut) toggleTut.checked = false;
        
        const tut = document.getElementById('tutorial-overlay');
        if(tut) { tut.classList.remove('u-flex', 'u-block'); tut.classList.add('u-hidden'); }
        
        setTimeout(() => window.rfApp.tour.startFeatureTour(), 300); 
    };

    // 🌟 向下相容橋樑
    window.saveSkipSettings = window.rfApp.tour.saveSkipSettings;
    window.loadSkipSettings = window.rfApp.tour.loadSkipSettings;
    window.startFeatureTour = window.rfApp.tour.startFeatureTour;
    window.showTourStep = window.rfApp.tour.showTourStep;
    window.nextTourStep = window.rfApp.tour.nextTourStep;
    window.endTour = window.rfApp.tour.endTour;
    window.startTutorialOverlay = window.rfApp.tour.startTutorialOverlay;
    window.nextTutorial = window.rfApp.tour.nextTutorial;
    window.prevTutorial = window.rfApp.tour.prevTutorial;
    window.finishTutorial = window.rfApp.tour.finishTutorial;
    window.reopenTutorial = window.rfApp.tour.reopenTutorial;
    
    // 初始化執行
    window.rfApp.tour.loadSkipSettings();
}
