/**
 * js/modules/firebase-sync.js
 * 負責：Firebase 雲端同步、Google 登入、攔截 LocalStorage 達成無痛背景備份
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 🌟 您的 Firebase 專案金鑰
const firebaseConfig = {
    apiKey: "AIzaSyDe_FZeqKtEZuPo7geC4jd-nbTP6xURFZM",
    authDomain: "ruifang689-max.firebaseapp.com",
    projectId: "ruifang689-max",
    storageBucket: "ruifang689-max.firebasestorage.app",
    messagingSenderId: "29945788628",
    appId: "1:29945788628:web:274d5a74a728d5b4aa6341",
    measurementId: "G-997TLWCZQ2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let isSyncing = false; // 防護機制，避免無限迴圈同步

// =========================================
// 🌟 核心黑科技：攔截 LocalStorage 達成「無痛綁定」
// =========================================
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments); // 讓原本地機存檔繼續正常運作
    
    // 只要是我們 App 的資料有變動，且處於登入狀態，就觸發背景上傳
    if ((key.startsWith('ruifang_') || key.startsWith('rf_')) && currentUser && !isSyncing) {
        scheduleCloudUpload();
    }
};

let uploadTimer;
function scheduleCloudUpload() {
    clearTimeout(uploadTimer);
    // 延遲 2 秒上傳，將使用者的連續操作「打包」成一次雲端寫入，節省資源
    uploadTimer = setTimeout(async () => {
        const dataToSync = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('ruifang_') || key.startsWith('rf_')) {
                dataToSync[key] = localStorage.getItem(key);
            }
        }
        try {
            await setDoc(doc(db, "users", currentUser.uid), { 
                settings: dataToSync, 
                lastUpdated: new Date() 
            }, { merge: true });
            console.log("☁️ [Firebase] 資料已完美同步至雲端");
        } catch (error) {
            console.error("雲端同步失敗", error);
        }
    }, 2000); 
}

// =========================================
// 🌟 登入 / 登出與 UI 控制
// =========================================
export function initFirebase() {
    const loginBtn = document.getElementById('google-login-btn');
    if(loginBtn) {
        loginBtn.onclick = async () => {
            if (currentUser) {
                if(confirm("確定要登出您的 Google 帳號嗎？\n(您的本機紀錄依然會保留喔！)")) await signOut(auth);
            } else {
                try {
                    const result = await signInWithPopup(auth, provider);
                    // 登入成功，拉取雲端資料
                    await pullFromCloud(result.user.uid);
                } catch (error) {
                    console.error("登入失敗", error);
                    alert("登入被取消或發生錯誤，請稍後再試！");
                }
            }
        };
    }

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateLoginUI(user);
    });
}

// ... (上方 import 與變數保持不變) ...

function updateLoginUI(user) {
    const btnText = document.getElementById('login-btn-text');
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('google-login-btn');
    
    // 🌟 獲取開發者按鈕區塊
    const devModeContainer = document.getElementById('dev-mode-container'); 

    if (user) {
        if(btnText) btnText.innerText = "登出帳號";
        if(userInfo) {
            userInfo.style.display = "block";
            userInfo.innerHTML = `👋 歡迎回來，<span style="color:var(--primary);">${user.displayName}</span>！<br><span style="font-size:12px; font-weight:normal; color:var(--success);">您的地圖資料已啟用雲端同步 <i class="fas fa-cloud-upload-alt"></i></span>`;
        }
        if(loginBtn) { loginBtn.style.background = "var(--divider-color)"; loginBtn.style.color = "var(--text-main)"; }
        
        // 🌟 核心驗證：判斷登入的 Email 是否為官方帳號
        if (devModeContainer) {
            if (user.email === 'ruifang689@gmail.com') {
                devModeContainer.style.display = 'block'; // 是開發者 -> 顯示按鈕
            } else {
                devModeContainer.style.display = 'none';  // 是一般使用者 -> 隱藏按鈕
            }
        }
    } else {
        if(btnText) btnText.innerText = "使用 Google 帳號登入";
        if(userInfo) userInfo.style.display = "none";
        if(loginBtn) { loginBtn.style.background = "#4285F4"; loginBtn.style.color = "white"; }
        
        // 🌟 沒登入時，一律隱藏開發者按鈕
        if (devModeContainer) devModeContainer.style.display = 'none';
    }
}

// ... (下方 pullFromCloud 等函數保持不變) ...

async function pullFromCloud(uid) {
    try {
        isSyncing = true;
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists() && docSnap.data().settings) {
            const cloudData = docSnap.data().settings;
            let hasChanges = false;
            
            // 比較雲端與本機差異，若雲端有資料則覆寫本機
            for (const key in cloudData) {
                if (localStorage.getItem(key) !== cloudData[key]) {
                    originalSetItem.call(localStorage, key, cloudData[key]);
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                // 最安全的無痛套用方式：重新整理網頁，讓原程式自動讀取最新的 localStorage
                alert("☁️ 雲端同步完成！已找回您的專屬設定與秘境收藏。\n地圖即將重新載入以套用設定...");
                window.location.reload();
            } else {
                console.log("☁️ [Firebase] 本機資料已是最新。");
                scheduleCloudUpload(); // 確保剛登入時把最新的本機資料推上去
            }
        } else {
            // 新用戶，主動把現有本機資料上傳
            scheduleCloudUpload();
        }
        isSyncing = false;
    } catch (error) {
        console.error("載入雲端資料失敗", error);
        isSyncing = false;
    }
}
