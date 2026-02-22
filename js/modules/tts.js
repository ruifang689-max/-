// js/modules/tts.js (v657) - 國際化翻譯支援版
import { state } from '../core/store.js';

export function initTTS() {
    window.rfApp.tts.toggleTTS = () => {
        if (!window.speechSynthesis) {
            // 🌟 替換為動態翻譯
            if(typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_tts_unsupport'), 'error');
            return;
        }
        
        if (window.speechSynthesis.speaking) {
            window.rfApp.tts.stopTTS();
            // 🌟 替換為動態翻譯
            if(typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_tts_stopped'), 'info');
            return;
        }

        const s = state.targetSpot;
        if (!s) return;
        
        const rawText = (s.description || s.highlights || s.history || "暫無詳細介紹").replace(/<[^>]*>?/gm, '');
        const textToSpeak = `${s.name}。${rawText}`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const langMap = { 'zh': 'zh-TW', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR', 'vi': 'vi-VN' };
        utterance.lang = langMap[state.currentLang] || 'zh-TW';
        utterance.rate = 0.95; 
        
        window.speechSynthesis.speak(utterance);
        
        // 🌟 替換為動態翻譯
        if(typeof window.showToast === 'function') window.showToast(window.rfApp.t('toast_tts_playing'), 'success');
    };

    window.rfApp.tts.stopTTS = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    window.toggleTTS = window.rfApp.tts.toggleTTS;
    window.stopTTS = window.rfApp.tts.stopTTS;
}
