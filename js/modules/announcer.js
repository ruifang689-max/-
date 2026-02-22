// js/modules/announcer.js (v646) - 事件監聽版
import { state } from '../core/store.js';
import { events } from '../core/events.js?v=646'; // 🌟 引入事件匯流排

const ruifangMap = {
    "龍潭里": "瑞芳市區", "龍鎮里": "瑞芳市區", "龍安里": "瑞芳市區", "龍川里": "瑞芳市區", "龍山里": "瑞芳市區", 
    "爪峰里": "瑞芳市區", "新峰里": "瑞芳市區", "東和里": "瑞芳車站",
    "基山里": "九份老街", "頌德里": "九份", "福住里": "九份", "崇文里": "九份", "永慶里": "九份",
    "銅山里": "金瓜石", "石山里": "金瓜石", "瓜山里": "黃金博物館", "新山里": "金瓜石",
    "濂新里": "水湳洞", "濂洞里": "水湳洞", "長仁里": "水湳洞",
    "南雅里": "鼻頭角", "海濱里": "深澳", "深澳里": "深澳", "瑞濱里": "深澳",
    "弓橋里": "猴硐貓村", "猴硐里": "猴硐", "光復里": "猴硐",
    "碩仁里": "三貂嶺",
    "吉慶里": "四腳亭", "吉安里": "四腳亭", "上天里": "四腳亭"
};

let cachedAddress = "";
let lastLat = 0;
let lastLng = 0;
let isFetching = false;
let isUserPanning = false; // 🌟 自己維護這個狀態，不再依賴外部

export function fetchRealAddress(lat, lng, accuracy = null) {
    const addrEl = document.getElementById("addr-text");
    if (!addrEl) return;

    const render = (addr) => {
        if (accuracy !== null) {
            addrEl.innerText = `你在：${addr}｜精度：±${accuracy}m`; // 保持您要的全形格式
        } else {
            addrEl.innerText = addr;
        }
    };

    const distSq = Math.pow(lat - lastLat, 2) + Math.pow(lng - lastLng, 2);
    if (distSq < 0.000001 && cachedAddress) {
        render(cachedAddress);
        return;
    }

    if (isFetching) return;
    isFetching = true;
    if (accuracy === null) addrEl.innerText = "定位中...";

    const primaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`;
    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-tw`;

    fetch(primaryUrl)
    .then(res => { if(!res.ok) throw new Error(); return res.json(); })
    .then(data => { 
        let areaStr = "未知地點";
        if (data && data.address) { 
            const a = data.address; 
            const city = a.city || a.county || a.state || "";
            const dist = a.town || a.suburb || a.district || "";
            const village = a.village || a.hamlet || a.neighbourhood || "";
            const parts = [city, dist].filter(Boolean);
            const uniqueParts = [...new Set(parts)];
            let baseStr = uniqueParts.join('');
            let matchedArea = "";
            if (village) {
                if (ruifangMap[village]) {
                    matchedArea = ruifangMap[village];
                } else {
                    const villageCore = village.substring(0, 2);
                    for (let key in ruifangMap) { if (key.startsWith(villageCore)) { matchedArea = ruifangMap[key]; break; } }
                }
            }
            if (dist === "瑞芳區" && matchedArea) areaStr = `${baseStr}${village} (${matchedArea})`;
            else if (baseStr || village) areaStr = `${baseStr}${village}`;
            else if (a.road) areaStr = a.road;
        } 
        cachedAddress = areaStr; lastLat = lat; lastLng = lng;
        render(areaStr);
        isFetching = false;
    })
    .catch(() => { 
        fetch(fallbackUrl).then(res => res.json()).then(data => {
            let areaStr = "未知地點";
            if(data) {
                let city = data.principalSubdivision || "";
                let dist = data.city || "";
                let village = data.locality || "";
                if (data.localityInfo && data.localityInfo.administrative) {
                    const v = data.localityInfo.administrative.find(a => a.name.endsWith('里') || a.adminLevel === 10);
                    if (v && v.name) village = v.name;
                }
                const parts = [city, dist].filter(Boolean);
                const uniqueParts = [...new Set(parts)];
                let baseStr = uniqueParts.join('');
                let matchedArea = "";
                if (village) {
                    if (ruifangMap[village]) {
                        matchedArea = ruifangMap[village];
                    } else {
                        const villageCore = village.substring(0, 2);
                        for (let key in ruifangMap) { if (key.startsWith(villageCore)) { matchedArea = ruifangMap[key]; break; } }
                    }
                }
                if (dist === "瑞芳區" && matchedArea) areaStr = `${baseStr}${village} (${matchedArea})`;
                else areaStr = `${baseStr}${village}`;
            }
            cachedAddress = areaStr; lastLat = lat; lastLng = lng;
            render(areaStr);
            isFetching = false;
        }).catch(() => { if(!cachedAddress) cachedAddress = "探索瑞芳中..."; render(cachedAddress); isFetching = false; });
    });
}

export function initAnnouncer() {
    let geocodeTimer = null;
    
    window.rfApp.announcer = { fetchRealAddress };

    // 🌟 1. 監聽地圖操作，維護自己的狀態
    if (state.mapInstance) {
        state.mapInstance.on('dragstart', () => { 
            isUserPanning = true; 
            const addrEl = document.getElementById("addr-text");
            if (addrEl) {
                addrEl.style.opacity = '0.5'; 
                if (addrEl.innerText.includes('精度')) addrEl.innerText = "隨處逛逛中...";
            }
        });
        
        state.mapInstance.on('dragend', function() {
            clearTimeout(geocodeTimer); 
            const addrEl = document.getElementById("addr-text");
            if(addrEl) { addrEl.innerText = "定位中..."; addrEl.style.opacity = '1'; }
            
            geocodeTimer = setTimeout(() => {
                isUserPanning = false; // 停止拖曳後，恢復更新
                const center = state.mapInstance.getCenter();
                fetchRealAddress(center.lat, center.lng, null);
            }, 800); 
        });
    }

    // 🌟 2. 訂閱 GPS 更新事件 (這是新架構的核心！)
    // 只要 GPS 說位置變了，我們就檢查是否該更新地址
    events.on('location_update', (data) => {
        // 只有當使用者沒有在手動滑地圖，且我們想鎖定使用者時，才更新地址
        if (!isUserPanning) {
            fetchRealAddress(data.lat, data.lng, Math.round(data.accuracy));
            
            // 順便幫地圖平移 (如果這是我們想要的行為)
            if (state.mapInstance) state.mapInstance.panTo([data.lat, data.lng]);
        }
    });
}
