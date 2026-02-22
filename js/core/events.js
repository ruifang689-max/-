// js/core/events.js (v646) - 中央事件匯流排
export const events = {
    events: {},

    // 訂閱事件
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    },

    // 取消訂閱
    off(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listenerToRemove);
    },

    // 發布事件 (廣播)
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
};

// 掛載到全域，方便除錯
window.rfApp = window.rfApp || {};
window.rfApp.events = events;
