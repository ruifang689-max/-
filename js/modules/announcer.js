// js/modules/announcer.js
import { state } from '../core/store.js';

// 🌟 瑞芳區「村里」對應「大範圍區域」的在地字典
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
    state.mapInstance.on('movestart', () => { document.getElementById("addr-text").style.opacity = '0.5'; });
    
    state.mapInstance.on('moveend', function() {
        clearTimeout(geocodeTimer); 
        document.getElementById("addr-text").innerText = "定位中..."; 
        document.getElementById("addr-text").style.opacity = '1';
        
        geocodeTimer = setTimeout(() => {
            const center = state.mapInstance.getCenter();
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=18&addressdetails=1&accept-language=zh-TW`)
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
                    
                    // 🌟 核心邏輯：如果是瑞芳區且在字典內，加上括號說明
                    if (dist === "瑞芳區" && village && ruifangMap[village]) {
                        areaStr = `${baseStr} (${ruifangMap[village]})`;
                    } else if (baseStr) {
                        areaStr = baseStr;
                    }
                } 
                document.getElementById("addr-text").innerText = areaStr; 
            }).catch(()=>{ document.getElementById("addr-text").innerText = "探索瑞芳中..."; }); 
        }, 600); 
    });
}
