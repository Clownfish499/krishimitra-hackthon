import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { aiAPI } from '../services/api';
import './Translator.css';

export default function Translator() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('hi');
    const [inputText, setInputText] = useState('');
    const [resultText, setResultText] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        setLoading(true);

        try {
            const prompt = `Translate the following agricultural text from ${sourceLang} to ${targetLang}. 
            Only provide the translation, no extra text:
            "${inputText}"`;

            const res = await aiAPI.chat({
                message: prompt,
                language: targetLang,
                conversationHistory: []
            });

            const translation = res.data.response;
            setResultText(translation);
            setHistory(prev => [{ source: inputText, target: translation }, ...prev].slice(0, 5));
        } catch (err) {
            setResultText("Error: Unable to translate at this moment.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(resultText);
        alert("Copied to clipboard!");
    };

    return (
        <div className="translator-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate('/')}>←</button>
                <div style={{ marginLeft: 48 }}>
                    <h1>🌍 {t('translator.title')}</h1>
                    <p>{t('translator.desc')}</p>
                </div>
            </header>

            <div className="translator-container">
                <div className="lang-selectors">
                    <div className="selector-group">
                        <label>{t('translator.source')}</label>
                        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                            <option value="en">English</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="kn">Kannada (ಕನ್ನಡ)</option>
                        </select>
                    </div>
                    <div className="swap-icon">⇄</div>
                    <div className="selector-group">
                        <label>{t('translator.target')}</label>
                        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                            <option value="en">English</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="kn">Kannada (ಕನ್ನಡ)</option>
                        </select>
                    </div>
                </div>

                <div className="translation-grid">
                    <div className="text-area-box">
                        <textarea
                            placeholder={t('translator.placeholder')}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button
                            className="translate-action-btn"
                            disabled={loading || !inputText.trim()}
                            onClick={handleTranslate}
                        >
                            {loading ? t('translator.translating') : t('translator.translate')}
                        </button>
                    </div>

                    <div className={`result-area-box ${resultText ? 'has-content' : ''}`}>
                        <div className="result-display">
                            {resultText || "The translation will appear here..."}
                        </div>
                        {resultText && (
                            <button className="copy-btn" onClick={copyToClipboard}>
                                📋 {t('translator.copy')}
                            </button>
                        )}
                    </div>
                </div>

                {history.length > 0 && (
                    <div className="translation-history">
                        <h3>{t('translator.history')}</h3>
                        {history.map((item, i) => (
                            <div key={i} className="history-item">
                                <div className="h-source">{item.source}</div>
                                <div className="h-target">{item.target}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
