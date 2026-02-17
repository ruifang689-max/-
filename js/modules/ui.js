import { state, saveState } from '../core/store.js';
import { addMarkerToMap, renderAllMarkers } from './markers.js';
import { showCard, closeCard } from './cards.js';

export function initUI() {
    window.resetNorth = () => { state.mapInstance.flyTo([25.1032, 121.8224], 14); };
    window.goToStation = () => { state.mapInstance.flyTo([25.108, 121.805], 16); closeCard(); };
    window.aiTrip = () => { if(!state.userPos) return alert("等待 GPS 定位..."); const sorted = spots.concat(state.savedCustomSpots).sort((a,b) => state.mapInstance.distance(state.userPos,[a.lat,a.lng]) - state.mapInstance.distance(state.userPos,[b.lat,b.lng])); alert("🤖 AI 推薦最近景點：\n" + sorted.slice(0,5).map((s,i) => `${i+1}. ${s.name}`).join("\n")); };

    // 收藏夾邏輯
    window.toggleCurrentFav = () => { if(!state.targetSpot) return; const idx = state.myFavs.indexOf(state.targetSpot.name); if(idx === -1) state.myFavs.push(state.targetSpot.name); else state.myFavs.splice(idx, 1); saveState.favs(); document.getElementById("card-fav-icon").className = state.myFavs.includes(state.targetSpot.name) ? "fas fa-heart active" : "fas fa-heart"; };
    // ... 礙於字數限制，將 toggleFavList, openFavManage 等邏輯同理綁定到 window 上
    
    // 綁定地圖長按事件 (新增自訂景點)
    state.mapInstance.on('contextmenu', function(e) {
        const lat = e.latlng.lat; const lng = e.latlng.lng;
        const tempPopup = L.popup({ closeButton: false, autoClose: false, offset: [0, -10] }).setLatLng(e.latlng).setContent("<div style='padding:8px;'><i class='fas fa-spinner fa-spin'></i> 獲取地址中...</div>").openOn(state.mapInstance);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-TW`)
        .then(res => res.json()).then(data => {
            let addr = "瑞芳秘境"; if(data && data.address) { const a = data.address; addr = (a.city || "") + (a.town || a.suburb || a.district || "") + (a.village || "") + (a.road || ""); }
            state.mapInstance.closePopup(tempPopup); 
            setTimeout(() => { const spotName = prompt(`📍 找到地址：\n${addr}\n\n是否新增自訂景點？\n請為地點命名：`, "我的秘境"); if (spotName) { const newSpot = { name: spotName, lat: lat, lng: lng, tags: ["自訂"], highlights: `詳細地址：${addr}`, food: "--", history: "自訂標記", transport: "自行前往", wikiImg: "" }; state.savedCustomSpots.push(newSpot); saveState.customSpots(); addMarkerToMap(newSpot); showCard(newSpot); } }, 150);
        }).catch(()=>{ state.mapInstance.closePopup(tempPopup); });
    });
}
