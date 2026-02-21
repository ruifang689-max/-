import { state } from '../core/store.js';

const ruifangMap = { /* 保留你原本那段 */ };

let lastFetchKey = "";
let geocodeTimer = null;
let announcerBound = false;

export function initAnnouncer() {

    if (!state.mapInstance || announcerBound) return;
    announcerBound = true;

    const addrEl = document.getElementById("addr-text");

    state.mapInstance.off('dragstart');
    state.mapInstance.off('dragend');

    state.mapInstance.on('dragstart', () => {
        addrEl.style.opacity = '0.5';
    });

    state.mapInstance.on('dragend', () => {

        clearTimeout(geocodeTimer);
        addrEl.innerText = "定位中...";
        addrEl.style.opacity = '1';

        geocodeTimer = setTimeout(() => {

            const center = state.mapInstance.getCenter();
            const lat = center.lat.toFixed(4);
            const lng = center.lng.toFixed(4);

            // 🔥 快取 key（減少重複請求）
            const fetchKey = `${lat},${lng}`;
            if (fetchKey === lastFetchKey) return;
            lastFetchKey = fetchKey;

            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-tw`;

            fetch(url)
            .then(res => res.json())
            .then(data => {

                let areaStr = "探索瑞芳中...";

                if (data) {

                    let city = data.principalSubdivision || "";
                    let dist = data.city || "";
                    let village = data.locality || "";

                    // 🔍 抓更精確的里
                    if (data.localityInfo && data.localityInfo.administrative) {
                        const v = data.localityInfo.administrative.find(a =>
                            a.name.endsWith('里') || a.adminLevel === 10
                        );
                        if (v && v.name) village = v.name;
                    }

                    // 去重
                    const parts = [city, dist].filter(Boolean);
                    const baseStr = [...new Set(parts)].join('');

                    // 九大區域匹配
                    let matchedArea = "";
                    if (village) {
                        if (ruifangMap[village]) {
                            matchedArea = ruifangMap[village];
                        } else {
                            const core = village.substring(0, 2);
                            for (let key in ruifangMap) {
                                if (key.startsWith(core)) {
                                    matchedArea = ruifangMap[key];
                                    break;
                                }
                            }
                        }
                    }

                    if (dist === "瑞芳區" && matchedArea) {
                        areaStr = `${baseStr}${village} (${matchedArea})`;
                    } else {
                        areaStr = `${baseStr}${village}`;
                    }
                }

                addrEl.innerText = areaStr;

            })
            .catch(() => {
                addrEl.innerText = "探索瑞芳中...";
            });

        }, 600); // ⏱ 降低延遲，更順
    });
}
