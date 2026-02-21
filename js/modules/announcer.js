import { state } from '../core/store.js';

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

export function initAnnouncer() {
    let geocodeTimer = null;
    state.mapInstance.on('dragstart', () => { document.getElementById("addr-text").style.opacity = '0.5'; });
    
    state.mapInstance.on('dragend', function() {
        clearTimeout(geocodeTimer); 
        document.getElementById("addr-text").innerText = "定位中..."; 
        document.getElementById("addr-text").style.opacity = '1';
        
        geocodeTimer = setTimeout(() => {
            const center = state.mapInstance.getCenter();
            const lat = center.lat; const lng = center.lng;
            
            const primaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW&email=ruifang689@gmail.com`;
            const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-tw`;

            // 1. 先嘗試主 API
            fetch(primaryUrl)
            .then(res => { if(!res.ok) throw new Error(); return res.json(); })
            .then(data => { 
                let areaStr = "探索瑞芳中...";
                if (data && data.address) { 
                    const a = data.address; 
                    const city = a.city || a.county || "";
                    const dist = a.town || a.suburb || a.district || "";
                    const village = a.village || a.hamlet || "";
                    
                    let baseStr = city + dist + village;
                    if (!baseStr) baseStr = a.road || "";
                    
                    if (dist === "瑞芳區" && village && ruifangMap[village]) areaStr = `${baseStr} (${ruifangMap[village]})`;
                    else if (baseStr) areaStr = baseStr;
                } 
                document.getElementById("addr-text").innerText = areaStr; 
            })
            .catch(() => { 
                // 🌟 2. 主 API 被封鎖時，無縫啟動備用 API (進階去重與九大區域版)
                fetch(fallbackUrl)
                .then(res => res.json())
                .then(data => {
                    let areaStr = "探索瑞芳中...";
                    if(data) {
                        let city = data.principalSubdivision || "";
                        let dist = data.city || "";
                        let village = data.locality || "";
                        
                        // 🌟 深度挖掘：抓出精確的「里」
                        if (data.localityInfo && data.localityInfo.administrative) {
                            const v = data.localityInfo.administrative.find(a => a.name.endsWith('里') || a.adminLevel === 10);
                            if (v && v.name) village = v.name;
                        }

                        // 🌟 陣列去重：消除「新北市新北市」
                        const parts = [city, dist].filter(Boolean);
                        const uniqueParts = [...new Set(parts)];
                        let baseStr = uniqueParts.join('');

                        // 🌟 智慧匹配九大區域
                        let matchedArea = "";
                        if (village && typeof ruifangMap !== 'undefined') {
                            if (ruifangMap[village]) {
                                matchedArea = ruifangMap[village];
                            } else {
                                // 模糊比對 (解決「龍潭堵」與「龍潭里」的字尾差異)
                                const villageCore = village.substring(0, 2);
                                for (let key in ruifangMap) {
                                    if (key.startsWith(villageCore)) {
                                        matchedArea = ruifangMap[key];
                                        break;
                                    }
                                }
                            }
                        }

                        if (dist === "瑞芳區" && matchedArea) {
                            // 完美組合出：新北市瑞芳區龍潭里(瑞芳市區)
                            areaStr = `${baseStr}${village}(${matchedArea})`;
                        } else {
                            areaStr = `${baseStr}${village}`;
                        }
                    }
                    document.getElementById("addr-text").innerText = areaStr; 
                })
                .catch(() => {
                    document.getElementById("addr-text").innerText = "探索瑞芳中...";
                });
            }); 
        }, 1000); 
    });
}
