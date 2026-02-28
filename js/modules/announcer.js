// js/modules/announcer.js (v666) - 智慧跑馬燈與防閃爍版
import { state } from '../core/store.js';
import { events } from '../core/events.js'; 

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

// 🌟 核心：動態檢查字數並啟動跑馬燈
function updateMarquee(el) {
    if (!el || !el.parentElement) return;
    const container = el.parentElement;
    // 計算容器可用寬度 (扣掉左側 Icon 寬度與 padding)
    const availableWidth = container.clientWidth - 28; 
    
    // 如果文字的實際長度 > 容器能顯示的長度，才啟動跑馬燈
    if (el.scrollWidth > availableWidth) {
        const distance = el.scrollWidth - availableWidth + 8; // 多加 8px 緩衝
        el.style.setProperty('--marquee-dist', `-${distance}px`);
        const duration = Math.max(3.5, distance * 0.04); // 根據字串長度動態調整滑動速度
        el.style.animation = `marquee-ping-pong ${duration}s ease-in-out infinite alternate`;
    } else {
        el.style.animation = 'none'; // 字數夠短就不滑動
    }
}

export function fetchRealAddress(lat, lng, accuracy = null) {
    const addrEl = document.getElementById("addr-text");
    if (!addrEl) return;

    const render = (addr) => {
        const newText = accuracy !== null ? `你在：${addr}｜精度：±${accuracy}m` : addr;
        
        if (addrEl.innerText !== newText) {
            // 🌟 防閃爍機制：切割文字，檢查是「地址換了」還是「只有精度數字換了」
            const oldAddrPart = addrEl.innerText.split('｜')[0];
            const newAddrPart = newText.split('｜')[0];
            
            // 如果連地址都變了，或是剛從「定位中」恢復，加入優雅淡出淡入
            if (oldAddrPart !== newAddrPart && addrEl.innerText !== "定位中...") {
                addrEl.style.opacity = '0';
                setTimeout(() => {
                    addrEl.innerText = newText;
                    addrEl.style.opacity = '1';
                    setTimeout(() => updateMarquee(addrEl), 50); // 重新計算跑馬燈
                }, 300);
            } else {
                // 如果只是 GPS 精度 (15m 變成 16m)，直接替換文字，不要閃爍！
                addrEl.innerText = newText;
                updateMarquee(addrEl);
            }
        }
    };

    const distSq = Math.pow(lat - lastLat, 2) + Math.pow(lng - lastLng, 2);
    if (distSq < 0.000001 && cachedAddress) {
        render(cachedAddress);
        return;
    }

    if (isFetching) return;
    isFetching = true;
    if (accuracy === null) {
        addrEl.innerText = "定位中...";
        updateMarquee(addrEl);
    }

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

    if (state.mapInstance) {
        state.mapInstance.on('dragstart', () => { 
            const addrEl = document.getElementById("addr-text");
            if (addrEl) {
                addrEl.style.opacity = '0.5'; 
                if (addrEl.innerText.includes('精度')) {
                    addrEl.innerText = "隨處逛逛中...";
                    updateMarquee(addrEl); // 確保狀態同步
                }
            }
        });
        
        state.mapInstance.on('dragend', function() {
            clearTimeout(geocodeTimer); 
            const addrEl = document.getElementById("addr-text");
            if(addrEl) { 
                addrEl.innerText = "定位中..."; 
                addrEl.style.opacity = '1'; 
                updateMarquee(addrEl); 
            }
            
            geocodeTimer = setTimeout(() => {
                const center = state.mapInstance.getCenter();
                fetchRealAddress(center.lat, center.lng, null);
            }, 800); 
        });
    }

    events.on('location_update', (data) => {
        if (data.isFollowing) {
            fetchRealAddress(data.lat, data.lng, Math.round(data.accuracy));
        }
    });
}
