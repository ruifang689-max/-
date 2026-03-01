/**
 * js/modules/firebase-sync.js
 * 負責：Firebase 雲端同步、Google 登入、無痛背景備份、雙軌景點同步
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// 🌟 確保這裡有引入 collection, getDocs, writeBatch
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
let isSyncing = false; 

// =========================================
// 🌟 核心黑科技：攔截 LocalStorage 達成「無痛綁定」
// =========================================
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments); 
    if ((key.startsWith('ruifang_') || key.startsWith('rf_')) && currentUser && !isSyncing) {
        scheduleCloudUpload();
    }
};

let uploadTimer;
function scheduleCloudUpload() {
    clearTimeout(uploadTimer);
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
// 🌟 初始化 Firebase 功能與全域 API 綁定
// =========================================
export function initFirebase() {
    // 確保全域物件存在
    window.rfApp = window.rfApp || {};
    window.rfApp.firebase = window.rfApp.firebase || {};

    // 🚀 1. 單一景點寫入通道 (雙軌同步用)
    window.rfApp.firebase.saveSpot = async (spotData) => {
        if (!db) throw new Error("Firebase 資料庫尚未初始化");
        const collectionName = (window.rfApp && window.rfApp.isDeveloper) ? "official_spots" : "custom_spots";
        try {
            const safeDocId = spotData.name.replace(/[\/\.#$\[\]]/g, '_');
            const docRef = doc(db, collectionName, safeDocId);
            await setDoc(docRef, {
                ...spotData,
                lastUpdated: new Date().toISOString(),
                updatedBy: currentUser ? currentUser.email : "anonymous"
            }, { merge: true });
            console.log(`☁️ [Firebase] 景點「${spotData.name}」已成功寫入 ${collectionName}`);
        } catch (error) {
            console.error("☁️ [Firebase] 景點寫入失敗:", error);
            throw error;
        }
    };

    // 🚀 2. 獲取官方景點
    window.rfApp.firebase.getOfficialSpots = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "official_spots"));
            const spotsList = [];
            querySnapshot.forEach((doc) => {
                spotsList.push(doc.data());
            });
            return spotsList;
        } catch (error) {
            console.error("讀取 Firebase 官方景點失敗:", error);
            return [];
        }
    };

    // 🚀 3. 批次轉移工具 (Google Sheets -> Firebase)
    window.rfApp.firebase.migrateAllToFirebase = async (spotsArray) => {
        if (!spotsArray || spotsArray.length === 0) {
            alert("沒有可轉移的資料！");
            return;
        }
        if (!confirm(`準備將目前地圖上的 ${spotsArray.length} 筆官方景點轉移到 Firebase？\n\n(過程只需約 2 秒鐘)`)) return;
        
        try {
            const batch = writeBatch(db);
            let count = 0;
            
            spotsArray.forEach(spot => {
                if(!spot.name) return;
                const safeDocId = spot.name.replace(/[\/\.#$\[\]]/g, '_');
                const docRef = doc(db, "official_spots", safeDocId);
                batch.set(docRef, {
                    ...spot,
                    lastUpdated: new Date().toISOString(),
                    dataSource: "firebase_official" 
                }, { merge: true });
                count++;
            });
            
            await batch.commit();
            alert(`✅ 太棒了！成功將 ${count} 筆官方景點轉移至 Firebase！\n\n請重新整理網頁，系統就會自動改從 Firebase 讀取資料了。`);
        } catch (e) {
            console.error("轉移失敗", e);
            alert("❌ 轉移失敗，請檢查 Console 報錯");
        }
    };

    // --- 以下為原本的登入 UI 邏輯 ---
    const loginBtn = document.getElementById('google-login-btn');
    if(loginBtn) {
        loginBtn.onclick = async () => {
            if (currentUser) {
                if(confirm("確定要登出您的 Google 帳號嗎？\n(您的本機紀錄依然會保留喔！)")) await signOut(auth);
            } else {
                try {
                    const result = await signInWithPopup(auth, provider);
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

function updateLoginUI(user) {
    const btnText = document.getElementById('login-btn-text');
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('google-login-btn');
    const devModeContainer = document.getElementById('dev-mode-container'); 

    if (user) {
        if(btnText) btnText.innerText = "登出帳號";
        if(userInfo) {
            userInfo.style.display = "block";
            userInfo.innerHTML = `👋 歡迎回來，<span style="color:var(--primary);">${user.displayName}</span>！<br><span style="font-size:12px; font-weight:normal; color:var(--success);">您的地圖資料已啟用雲端同步 <i class="fas fa-cloud-upload-alt"></i></span>`;
        }
        if(loginBtn) { loginBtn.style.background = "var(--divider-color)"; loginBtn.style.color = "var(--text-main)"; }
        
        if (devModeContainer) {
            if (user.email === 'ruifang689@gmail.com') {
                devModeContainer.style.display = 'block'; 
            } else {
                devModeContainer.style.display = 'none';  
            }
        }
    } else {
        if(btnText) btnText.innerText = "使用 Google 帳號登入";
        if(userInfo) userInfo.style.display = "none";
        if(loginBtn) { loginBtn.style.background = "#4285F4"; loginBtn.style.color = "white"; }
        if (devModeContainer) devModeContainer.style.display = 'none';
    }
}

async function pullFromCloud(uid) {
    try {
        isSyncing = true;
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists() && docSnap.data().settings) {
            const cloudData = docSnap.data().settings;
            let hasChanges = false;
            for (const key in cloudData) {
                if (localStorage.getItem(key) !== cloudData[key]) {
                    originalSetItem.call(localStorage, key, cloudData[key]);
                    hasChanges = true;
                }
            }
            if (hasChanges) {
                alert("☁️ 雲端同步完成！已找回您的專屬設定與秘境收藏。\n地圖即將重新載入以套用設定...");
                window.location.reload();
            } else {
                console.log("☁️ [Firebase] 本機資料已是最新。");
                scheduleCloudUpload(); 
            }
        } else {
            scheduleCloudUpload();
        }
        isSyncing = false;
    } catch (error) {
        console.error("載入雲端資料失敗", error);
        isSyncing = false;
    }
}
