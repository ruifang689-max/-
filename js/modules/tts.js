// js/modules/tts.js (v630) - 獨立語音模組
import { state } from '../core/store.js';

export function initTTS() {
    
    // 🌟 核心播放/停止邏輯
    window.rfApp.tts.toggleTTS = () => {
        if (!window.speechSynthesis) {
            if(typeof window.showToast === 'function') window.showToast('您的瀏覽器不支援語音功能', 'error');
            return;
        }
        
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if(typeof window.showToast === 'function') window.showToast('🔇 語音導覽已停止', 'info');
            return;
        }

        const s = state.targetSpot;
        if (!s) return;
        
        // 過濾 HTML 標籤
        const rawText = (s.description || s.highlights || s.history || "暫無詳細介紹").replace(/<[^>]*>?/gm, '');
        const textToSpeak = `${s.name}。${rawText}`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        const langMap = { 'zh': 'zh-TW', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR' };
        utterance.lang = langMap[state.currentLang] || 'zh-TW';
        utterance.rate = 0.95; 
        
        window.speechSynthesis.speak(utterance);
        
        if(typeof window.showToast === 'function') window.showToast('🔊 語音導覽播放中...', 'success');
    };

    // 🌟 提供一個純粹停止語音的 API (供關閉卡片等情境呼叫)
    window.rfApp.tts.stopTTS = () => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    };

    // 🌟 向下相容橋樑
    window.toggleTTS = window.rfApp.tts.toggleTTS;
    window.stopTTS = window.rfApp.tts.stopTTS;
    
    console.log("🔊 語音導覽模組 (TTS) 已載入");
}
