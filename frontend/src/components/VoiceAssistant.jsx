import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../services/api';
import './VoiceAssistant.css';

const GREETINGS = {
    en: 'Hello! I\'m KrishiMitra. Tap the mic and ask me anything about farming!',
    hi: 'नमस्ते! मैं कृषिमित्र हूं। माइक दबाएं और खेती के बारे में कुछ भी पूछें!',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿಮಿತ್ರ. ಮೈಕ್ ಒತ್ತಿ ಕೃಷಿ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ!'
};

const STATUS_TEXT = {
    en: { tapToSpeak: 'Tap the mic to speak', listening: '🔴 Listening...', thinking: 'Thinking...', speaking: '🔊 Speaking...' },
    hi: { tapToSpeak: 'माइक दबाएं बोलने के लिए', listening: '🔴 सुन रहा हूं...', thinking: 'सोच रहा हूं...', speaking: '🔊 बोल रहा हूं...' },
    kn: { tapToSpeak: 'ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ', listening: '🔴 ಕೇಳುತ್ತಿದ್ದೇನೆ...', thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...', speaking: '🔊 ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...' }
};

export default function VoiceAssistant() {
    const { language, changeLanguage, t } = useLanguage();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle'); // idle | listening | thinking | speaking
    const [textInput, setTextInput] = useState('');
    const [loading, setLoading] = useState(false);

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);

    // Initialize greeting when language changes or panel opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', text: GREETINGS[language] || GREETINGS.en }]);
        }
    }, [isOpen, language]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [messages, loading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const togglePanel = () => {
        if (isOpen) {
            // Close with animation
            setIsClosing(true);
            stopListening();
            synthRef.current.cancel();
            setStatus('idle');
            setTimeout(() => {
                setIsOpen(false);
                setIsClosing(false);
            }, 250);
        } else {
            setIsOpen(true);
        }
    };

    const getLangCode = useCallback((lang) => {
        switch (lang) {
            case 'hi': return 'hi-IN';
            case 'kn': return 'kn-IN';
            default: return 'en-IN';
        }
    }, []);

    const speakText = useCallback((text) => {
        if (!('speechSynthesis' in window)) return;
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getLangCode(language);
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setStatus('speaking');
        utterance.onend = () => setStatus('idle');
        utterance.onerror = () => setStatus('idle');

        synthRef.current.speak(utterance);
    }, [language, getLangCode]);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || loading) return;

        const userMsg = { role: 'user', text: text.trim() };
        setMessages(prev => [...prev, userMsg]);
        setTextInput('');
        setLoading(true);
        setStatus('thinking');

        try {
            const history = messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.text
            }));

            const res = await aiAPI.chat({
                message: text,
                language,
                userProfile: user,
                conversationHistory: history
            });

            const reply = res.data.response;
            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
            setStatus('idle');

            // Auto-speak the response
            speakText(reply);
        } catch (e) {
            const errMsg = language === 'hi'
                ? '❌ AI से कनेक्ट नहीं हो पा रहा। कृपया बाद में कोशिश करें।'
                : language === 'kn'
                    ? '❌ AI ಗೆ ಸೇರಲು ಆಗಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
                    : '❌ Unable to reach AI. Please try again later.';
            setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
            setStatus('idle');
        } finally {
            setLoading(false);
        }
    }, [loading, messages, language, user, speakText]);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert(language === 'hi' ? 'आपका ब्राउज़र वॉइस सपोर्ट नहीं करता' : language === 'kn' ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ' : 'Voice not supported in this browser. Please use Chrome.');
            return;
        }

        // Stop any ongoing TTS
        synthRef.current.cancel();

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        recognition.lang = getLangCode(language);
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setStatus('listening');

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setStatus('idle');
            if (transcript.trim()) {
                sendMessage(transcript);
            }
        };

        recognition.onerror = (e) => {
            console.warn('Speech recognition error:', e.error);
            setStatus('idle');
        };

        recognition.onend = () => {
            if (status === 'listening') setStatus('idle');
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [language, getLangCode, sendMessage, status]);

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
        setStatus(prev => prev === 'listening' ? 'idle' : prev);
    };

    const handleMicClick = () => {
        if (status === 'listening') {
            stopListening();
        } else if (status === 'speaking') {
            synthRef.current.cancel();
            setStatus('idle');
        } else {
            startListening();
        }
    };

    const handleLangChange = (lang) => {
        changeLanguage(lang);
        // Update greeting
        setMessages([{ role: 'assistant', text: GREETINGS[lang] || GREETINGS.en }]);
        // Stop any active speech
        synthRef.current.cancel();
        if (recognitionRef.current) recognitionRef.current.abort();
        setStatus('idle');
    };

    const statusLabel = (STATUS_TEXT[language] || STATUS_TEXT.en);
    const currentStatusText =
        status === 'listening' ? statusLabel.listening :
        status === 'thinking' ? statusLabel.thinking :
        status === 'speaking' ? statusLabel.speaking :
        statusLabel.tapToSpeak;

    return (
        <>
            {/* Floating Action Button */}
            <button
                id="voice-assistant-fab"
                className={`va-fab ${isOpen ? 'open' : ''}`}
                onClick={togglePanel}
                title={t('voice.title') || 'Voice Assistant'}
                aria-label="Voice Assistant"
            >
                {isOpen ? '✕' : '🎙️'}
            </button>

            {/* Panel */}
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <div className="va-backdrop" onClick={togglePanel} />

                    <div
                        ref={panelRef}
                        className={`va-panel ${isClosing ? 'closing' : ''}`}
                        id="voice-assistant-panel"
                    >
                        {/* Header */}
                        <div className="va-header">
                            <div className="va-header-icon">🌾</div>
                            <div className="va-header-text">
                                <h3>{language === 'hi' ? 'कृषिमित्र वॉइस' : language === 'kn' ? 'ಕೃಷಿಮಿತ್ರ ಧ್ವನಿ' : 'KrishiMitra Voice'}</h3>
                                <span>{language === 'hi' ? 'बोलकर पूछें, सुनकर जानें' : language === 'kn' ? 'ಮಾತನಾಡಿ ಕೇಳಿ, ಕೇಳಿ ತಿಳಿಯಿರಿ' : 'Speak to ask, listen to learn'}</span>
                            </div>
                            <button className="va-close" onClick={togglePanel} aria-label="Close">✕</button>
                        </div>

                        {/* Language Switcher */}
                        <div className="va-lang-bar">
                            {[
                                { code: 'en', label: 'English' },
                                { code: 'hi', label: 'हिंदी' },
                                { code: 'kn', label: 'ಕನ್ನಡ' }
                            ].map(l => (
                                <button
                                    key={l.code}
                                    className={`va-lang-pill ${language === l.code ? 'active' : ''}`}
                                    onClick={() => handleLangChange(l.code)}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div className="va-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`va-msg ${m.role}`}>
                                    {m.role === 'assistant' && <div className="va-msg-avatar">🌱</div>}
                                    <div className="va-msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                                </div>
                            ))}
                            {loading && (
                                <div className="va-msg assistant">
                                    <div className="va-msg-avatar">🌱</div>
                                    <div className="va-msg-bubble va-typing"><span /><span /><span /></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Controls */}
                        <div className="va-controls">
                            <span className={`va-status-text ${status}`}>{currentStatusText}</span>
                            <button
                                className={`va-mic-btn ${status}`}
                                onClick={handleMicClick}
                                disabled={loading}
                                aria-label={status === 'listening' ? 'Stop listening' : 'Start listening'}
                            >
                                {status === 'listening' ? '⏹️' : status === 'speaking' ? '🔊' : '🎤'}
                            </button>
                            <div className="va-input-row">
                                <input
                                    type="text"
                                    className="va-text-input"
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage(textInput)}
                                    placeholder={language === 'hi' ? 'यहां टाइप करें...' : language === 'kn' ? 'ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...' : 'Or type here...'}
                                    disabled={loading}
                                />
                                <button
                                    className="va-send-btn"
                                    onClick={() => sendMessage(textInput)}
                                    disabled={!textInput.trim() || loading}
                                    aria-label="Send"
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
