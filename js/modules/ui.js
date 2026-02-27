// js/modules/ui.js (v663) - 加入分享功能版
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

    window.rfApp.ui.goToStation = () => { 
        if(state.mapInstance) state.mapInstance.flyTo([25.108, 121.805], 16); 
        if(typeof window.rfApp.ui.closeCard === 'function') window.rfApp.ui.closeCard(); 
        const ruiBtn = document.querySelector('.rui-icon');
        if (ruiBtn) { ruiBtn.classList.remove('stamped'); void ruiBtn.offsetWidth; ruiBtn.classList.add('stamped'); }
    };

    // 🌟 新增：推薦地圖給好友的功能
    window.rfApp.ui.shareAppMap = () => {
        const shareData = {
            title: '瑞芳導覽地圖',
            text: '發現一個超棒的瑞芳與九份秘境導覽地圖！',
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            // 如果電腦瀏覽器不支援 Web Share API，改為複製網址
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof window.showToast === 'function') window.showToast('地圖網址已複製到剪貼簿！', 'success');
            });
        }
    };

    window.enterMap = window.rfApp.ui.enterMap;
    window.toggleSidePanel = window.rfApp.ui.toggleSidePanel;
    window.toggleDropdown = window.rfApp.ui.toggleDropdown;
    window.openSettings = window.rfApp.ui.openSettings;
    window.closeSettings = window.rfApp.ui.closeSettings;
    window.goToStation = window.rfApp.ui.goToStation;
    window.shareAppMap = window.rfApp.ui.shareAppMap; // 🌟 開放全域呼叫

    window.enableDeveloperMode = () => {
        if (typeof window.showToast === 'function') {
            window.showToast("🔓 已啟用開發者模式！您現在可以直接將景點同步至官方資料庫。", "success");
        }
        window.rfApp.isDeveloper = true; 
        window.closeSettings();
    };
}
