export const state = {
    userPos: null,
    userMarker: null,
    targetSpot: null,
    currentRoute: null,
    navMode: 'driving',
    tourModeInterval: null,
    currentEditingSpotName: "",
    mapInstance: null,
    cluster: null,
    myFavs: JSON.parse(localStorage.getItem('ruifang_favs')) || [],
    savedCustomSpots: JSON.parse(localStorage.getItem('ruifang_custom_spots')) || [],
    searchHistory: JSON.parse(localStorage.getItem('ruifang_search_history')) || [],
    currentLang: localStorage.getItem('ruifang_lang') || 'zh'
};

export const saveState = {
    favs: () => localStorage.setItem('ruifang_favs', JSON.stringify(state.myFavs)),
    customSpots: () => localStorage.setItem('ruifang_custom_spots', JSON.stringify(state.savedCustomSpots)),
    history: () => localStorage.setItem('ruifang_search_history', JSON.stringify(state.searchHistory))
};
