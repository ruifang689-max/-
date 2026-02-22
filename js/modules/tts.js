// js/modules/tts.js (v653) - 語音導覽架構升級版
import { state } from '../core/store.js';

export function initTTS() {
    
    // 🌟 將功能完整封裝在命名空間中
    window.rfApp.tts.toggleTTS = () => {
        // 1. 檢查瀏覽器支援度
        if (!window.speechSynthesis) {
            if(typeof window.showToast === 'function') window.showToast('您的瀏覽器不支援語音功能', 'error');
            return;
        }
        
        // 2. 如果正在播放，則充當「停止鍵」
        if (window.speechSynthesis.speaking) {
            window.rfApp.tts.stopTTS();
            if(typeof window.showToast === 'function') window.showToast('🔇 語音導覽已停止', 'info');
            return;
        }

        const s = state.targetSpot;
        if (!s) return;
        
        // 3. 內容抓取與過濾 (去除 HTML 標籤確保發音流暢)
        const rawText = (s.description || s.highlights || s.history || "暫無詳細介紹").replace(/<[^>]*>?/gm, '');
        const textToSpeak = `${s.name}。${rawText}`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // 4. 自動根據目前語系切換口音
        const langMap = { 'zh': 'zh-TW', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR', 'vi': 'vi-VN' };
        utterance.lang = langMap[state.currentLang] || 'zh-TW';
        utterance.rate = 0.95; // 稍微放慢，讓解說更親切
        
        window.speechSynthesis.speak(utterance);
        
        if(typeof window.showToast === 'function') window.showToast('🔊 語音導覽播放中...', 'success');
    };

    window.rfApp.tts.stopTTS = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    // 🌟 向下相容橋樑，確保 HTML onclick 依然有效
    window.toggleTTS = window.rfApp.tts.toggleTTS;
    window.stopTTS = window.rfApp.tts.stopTTS;
    
    console.log("🔊 語音導覽模組 (TTS) 已升級為 v653");
}
