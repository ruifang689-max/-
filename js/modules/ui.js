// =========================================
    // 🌟 狀態驅動：進入地圖核心流程
    // =========================================
    window.enterMap = () => { 
        // 1. 優雅隱藏開場與歡迎幕 (交給 CSS 處理過渡動畫)
        ['intro', 'welcome-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('u-fade-out');
                setTimeout(() => el.classList.add('u-hidden'), 400); // 動畫結束後徹底拔除
            }
        });

        // 2. 喚醒側邊功能列
        const functionPanel = document.getElementById("side-function-zone");
        if(functionPanel) {
            functionPanel.classList.remove("collapsed", "u-hidden");
            functionPanel.classList.add("u-flex");
        }
        
        // 3. 關閉干擾元素
        const sug = document.getElementById("suggest");
        if(sug) sug.classList.add("u-hidden");
        if (typeof window.closeCard === 'function') window.closeCard();

        // 4. 判斷並觸發導覽
        setTimeout(() => { 
            const skipTour = localStorage.getItem('rf_skip_tour') === 'true';
            const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';
            
            if (!skipTour) window.startFeatureTour();
            else if (!skipTutorial) window.startTutorialOverlay();
        }, 400); 
    };

    // =========================================
    // 🌟 狀態驅動：略過設定與開場記憶
    // =========================================
    window.loadSkipSettings = () => {
        const skipAnim = localStorage.getItem('rf_skip_anim') === 'true';
        const skipWelcome = localStorage.getItem('rf_skip_welcome') === 'true';
        const skipTour = localStorage.getItem('rf_skip_tour') === 'true';
        const skipTutorial = localStorage.getItem('rf_skip_tutorial') === 'true';

        // 同步 UI 開關狀態
        ['anim', 'welcome', 'tour', 'tutorial'].forEach(key => {
            const toggle = document.getElementById(`toggle-skip-${key}`);
            if (toggle) toggle.checked = eval(`skip${key.charAt(0).toUpperCase() + key.slice(1)}`);
        });

        // 執行略過邏輯
        if (skipAnim) { 
            const anim = document.getElementById('intro-animation') || document.querySelector('.intro-overlay'); 
            if (anim) anim.classList.add('u-hidden'); 
        }
        if (skipWelcome) {
            const welcome = document.getElementById('welcome-screen');
            if (welcome) welcome.classList.add('u-hidden');
            
            if (!skipTour) setTimeout(window.startFeatureTour, 500);
            else if (!skipTutorial) setTimeout(window.startTutorialOverlay, 500);
        }
    };

    // =========================================
    // 🌟 狀態驅動：統一的視窗開關管理 (Modal Controllers)
    // =========================================
    window.openSettings = () => { 
        const modal = document.getElementById('settings-modal-overlay');
        if (modal) { modal.classList.remove('u-hidden'); modal.classList.add('u-flex'); }
    };
    
    window.closeSettings = () => { 
        const modal = document.getElementById('settings-modal-overlay');
        if (modal) { modal.classList.remove('u-flex'); modal.classList.add('u-hidden'); }
    };

    window.openFavManage = () => { 
        const modal = document.getElementById('fav-manage-overlay') || document.getElementById('fav-manage-modal');
        if (modal) { modal.classList.remove('u-hidden'); modal.classList.add('u-flex'); renderFavManageList(); }
    };
    
    window.closeFavManage = () => { 
        const modal = document.getElementById('fav-manage-overlay') || document.getElementById('fav-manage-modal');
        if (modal) { modal.classList.remove('u-flex'); modal.classList.add('u-hidden'); }
    };

    // (其他如 startFeatureTour, startTutorialOverlay 等若有 .style.display，也可全數替換為 classList 增刪)
