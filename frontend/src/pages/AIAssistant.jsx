import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../services/api';
import './AIAssistant.css';

export default function AIAssistant() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    // Voice Mode State
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('idle'); // idle, connecting, listening, speaking, error
    const [voiceTranscript, setVoiceTranscript] = useState('');

    // Initial message localization
    const getInitialMessage = () => {
        if (language === 'hi') return 'नमस्ते! मैं कृषिमित्र AI हूं। खेती के बारे में कुछ भी पूछें!';
        if (language === 'kn') return 'ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿಮಿತ್ರ AI. ಕೃಷಿ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ!';
        return 'Hello! I\'m KrishiMitra AI. Ask me anything about farming!';
    };

    const [messages, setMessages] = useState([
        { role: 'assistant', text: getInitialMessage() }
    ]);
    const messagesRef = useRef(messages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [continuousVoice, setContinuousVoice] = useState(true);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const hasProcessedContext = useRef(false);

    // Sync ref with state to avoid stale closure issues in async callbacks
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Handle initial mode and context from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const mode = params.get('mode');
        const context = params.get('context');

        if (context && !hasProcessedContext.current) {
            hasProcessedContext.current = true;
            const initialHistory = [{ role: 'assistant', content: getInitialMessage() }];
            const newMessages = [
                { role: 'assistant', text: getInitialMessage() },
                { role: 'user', text: context }
            ];
            setMessages(newMessages);
            messagesRef.current = newMessages; // Immediate sync for the first call
            sendMessage(context, initialHistory);
        }

        if (mode === 'voice' && !isVoiceMode) {
            startVoiceLive();
        }
    }, [location, language]); // Added language to re-init if lang changes mid-load

    // Update initial message if language changes and no conversation has started
    useEffect(() => {
        if (messages.length === 1) {
            setMessages([{ role: 'assistant', text: getInitialMessage() }]);
        }
    }, [language]);

    const examples = [
        t('home.cropRec_desc'),
        t('home.fertilizer_desc'),
        t('home.disease_desc'),
        t('home.mandi_desc')
    ];

    const speakResponse = (text) => {
        if (!text || !isVoiceMode) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Match language
        if (language === 'hi') utterance.lang = 'hi-IN';
        else if (language === 'kn') utterance.lang = 'kn-IN';
        else utterance.lang = 'en-IN';

        utterance.onstart = () => {
            setVoiceStatus('speaking');
        };

        utterance.onend = () => {
            if (continuousVoice && isVoiceMode) {
                setVoiceStatus('listening');
                setTimeout(startVoice, 300);
            } else {
                setVoiceStatus('idle');
            }
        };

        utterance.onerror = () => {
            setVoiceStatus('error');
            setTimeout(() => setVoiceStatus('listening'), 2000);
        };

        window.speechSynthesis.speak(utterance);
    };

    const sendMessage = async (text, existingHistory = null) => {
        if (!text.trim() || loading) return;
        const userMsg = { role: 'user', text };

        // If we didn't just manually set messages in the effect, add the user message
        if (!existingHistory) {
            setMessages(prev => [...prev, userMsg]);
        }

        setInput('');
        setLoading(true);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            // Use messagesRef to get REAL latest history during async transitions
            const history = existingHistory || messagesRef.current.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.text
            }));

            const res = await aiAPI.chat({
                message: text,
                language,
                userProfile: user,
                conversationHistory: history
            });
            const responseText = res.data.response;
            setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);

            if (isVoiceMode) {
                speakResponse(responseText);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', text: '❌ ' + t('common.error') }]);
        } finally {
            setLoading(false);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const startVoiceLive = () => {
        setIsVoiceMode(true);
        setVoiceStatus('connecting');
        setTimeout(() => {
            setVoiceStatus('listening');
            startVoice();
        }, 1000);
    };

    const stopVoiceLive = () => {
        window.speechSynthesis.cancel();
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsVoiceMode(false);
        setVoiceStatus('idle');
        setVoiceTranscript('');
    };

    const startVoice = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return alert('Voice not supported in this browser.');
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';

        rec.onstart = () => {
            if (isVoiceMode) setVoiceTranscript('');
        };

        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (isVoiceMode) {
                setVoiceTranscript(transcript);
                sendMessage(transcript);
            } else {
                setInput(transcript);
                setIsListening(false);
                sendMessage(transcript);
            }
        };
        rec.onend = () => setIsListening(false);
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
    };

    return (
        <div className="ai-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate('/')}>←</button>
                <div style={{ marginLeft: 48 }}>
                    <h1>🤖 {t('ai.title')}</h1>
                    <p>{language === 'hi' ? 'गूगल जेमिनी AI द्वारा संचालित' : language === 'kn' ? 'ಗೂಗಲ್ ಜೆಮಿನಿ AI ಮೂಲಕ ಚಾಲಿತವಾಗಿದೆ' : 'Powered by Google Gemini AI'}</p>
                </div>
                {!isVoiceMode && (
                    <button className="voice-mode-toggle" onClick={startVoiceLive}>
                        🎙️ Live Voice
                    </button>
                )}
            </header>

            {/* Voice Mode Overlay */}
            {isVoiceMode && (
                <div className="voice-overlay">
                    <div className="voice-overlay-content">
                        <div className={`visualizer-container ${voiceStatus}`}>
                            <div className="pulse-ripple"></div>
                            <div className="visualizer-circle">
                                {voiceStatus === 'listening' ? '👤' : voiceStatus === 'speaking' ? '🤖' : '🌱'}
                            </div>
                        </div>

                        <div className="voice-status-indicator">
                            <span className={`status-dot ${voiceStatus}`}></span>
                            {t(`voiceAgent.${voiceStatus}`) || voiceStatus.toUpperCase()}
                        </div>

                        <div className="voice-transcript-area">
                            {voiceTranscript && <div className="user-transcript">"{voiceTranscript}"</div>}
                        </div>

                        <div className="voice-controls">
                            <label className="voice-toggle-label">
                                <input
                                    type="checkbox"
                                    checked={continuousVoice}
                                    onChange={e => setContinuousVoice(e.target.checked)}
                                />
                                {language === 'hi' ? 'लगातार बातचीत' : language === 'kn' ? 'ನಿರಂತರ ಸಂಭಾಷಣೆ' : 'Continuous Chat'}
                            </label>
                            <div className="voice-action-btns">
                                <button className="voice-action-btn listening" onClick={startVoice}>🎤</button>
                                <button className="voice-close-btn" onClick={stopVoiceLive}>Close Voice Mode</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {messages.length === 1 && (
                <div className="ai-examples">
                    <p className="section-title">{language === 'hi' ? 'पूछ कर देखें:' : language === 'kn' ? 'ಹೀಗೆ ಕೇಳಿ:' : 'Try asking:'}</p>
                    {examples.map((ex, i) => (
                        <button key={i} className="example-chip" onClick={() => sendMessage(ex)}>{ex}</button>
                    ))}
                </div>
            )}

            <div className="ai-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                        {m.role === 'assistant' && <div className="msg-avatar">🌱</div>}
                        <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    </div>
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="msg-avatar">🌱</div>
                        <div className="msg-bubble typing"><span /><span /><span /></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-bar">
                <button className={`voice-btn ${isListening ? 'listening' : ''}`} onClick={startVoice}>🎤</button>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                    placeholder={isListening ? t('ai.listening') : t('ai.placeholder')}
                    className="ai-input"
                />
                <button className="send-btn" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>➤</button>
            </div>
        </div>
    );
}
