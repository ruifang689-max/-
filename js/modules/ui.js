// js/modules/ui.js (v661) - 解決命名衝突版
import { state } from '../core/store.js';

export function initUI() {
    window.rfApp.ui.enterMap = () => { 
        ['intro', 'welcome-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('u-fade-out'); setTimeout(() => el.classList.add('u-hidden'), 400); }
        });
        const functionPanel = document.getElementById("side-function-zone");
        if(functionPanel) { functionPanel.classList.remove("collapsed", "u-hidden"); functionPanel.classList.add("u-flex"); }
        const sug = document.getElementById("suggest");
        if(sug) sug.classList.add("u-hidden");
        if (typeof window.rfApp.ui.closeCard === 'function') window.rfApp.ui.closeCard();

        setTimeout(() => { 
            const skipTour = localStorage.getItem('rf_skip_tour') === 'true';
            const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';
            if (!skipTour) { if(typeof window.startFeatureTour === 'function') window.startFeatureTour(); }
            else if (!skipTutorial) { if(typeof window.startTutorialOverlay === 'function') window.startTutorialOverlay(); }
        }, 400); 
    };

    window.rfApp.ui.toggleSidePanel = () => {
        const targetPanel = document.getElementById("side-function-zone");
        const icon = document.getElementById("side-panel-icon");
        if (targetPanel) {
            targetPanel.classList.toggle("collapsed");
            if (icon) { icon.className = targetPanel.classList.contains("collapsed") ? "fas fa-angle-double-left" : "fas fa-angle-double-right"; }
        }
    };

    window.rfApp.ui.toggleDropdown = (listId) => {
        document.querySelectorAll('.custom-select-options').forEach(list => { 
            if (list.id !== listId) list.classList.add('u-hidden'); list.classList.remove('u-flex');
        });
        const targetList = document.getElementById(listId); 
        if(targetList) {
            if (targetList.classList.contains('u-hidden') || targetList.style.display === 'none' || !targetList.classList.contains('u-flex')) {
                targetList.classList.remove('u-hidden'); targetList.classList.add('u-flex');
            } else {
                targetList.classList.remove('u-flex'); targetList.classList.add('u-hidden');
            }
        }
    };
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) { 
            document.querySelectorAll('.custom-select-options').forEach(list => { list.classList.remove('u-flex'); list.classList.add('u-hidden'); });
        }
    });

    window.rfApp.ui.openSettings = () => { const m = document.getElementById('settings-modal-overlay'); if(m) { m.classList.remove('u-hidden'); m.classList.add('u-flex'); } };
    window.rfApp.ui.closeSettings = () => { const m = document.getElementById('settings-modal-overlay'); if(m) { m.classList.remove('u-flex'); m.classList.add('u-hidden'); } };

    // 🌟 已移除會產生衝突的 resetNorth，由 gps.js 統一接管
    window.rfApp.ui.goToStation = () => { 
        if(state.mapInstance) state.mapInstance.flyTo([25.108, 121.805], 16); 
        if(typeof window.rfApp.ui.closeCard === 'function') window.rfApp.ui.closeCard(); 
        const ruiBtn = document.querySelector('.rui-icon');
        if (ruiBtn) { ruiBtn.classList.remove('stamped'); void ruiBtn.offsetWidth; ruiBtn.classList.add('stamped'); }
    };

    window.enterMap = window.rfApp.ui.enterMap;
    window.toggleSidePanel = window.rfApp.ui.toggleSidePanel;
    window.toggleDropdown = window.rfApp.ui.toggleDropdown;
    window.openSettings = window.rfApp.ui.openSettings;
    window.closeSettings = window.rfApp.ui.closeSettings;
    window.goToStation = window.rfApp.ui.goToStation;
}
