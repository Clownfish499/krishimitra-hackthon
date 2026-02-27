import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

const GOVT_SCHEMES = [
    { icon: '🚜', title: 'PM-KISAN', desc: 'Income support of ₹6,000/year to all landholding farmer families.', link: 'https://pmkisan.gov.in/' },
    { icon: '🌾', title: 'PM Fasal Bima', desc: 'Crop insurance against non-preventable natural risks.', link: 'https://pmfby.gov.in/' },
    { icon: '💳', title: 'Kisan Credit Card', desc: 'Simplified credit for agriculture and allied activities.', link: 'https://www.pmkisan.gov.in/' },
    { icon: '🏪', title: 'e-NAM', desc: 'National Agriculture Market — unified online trading platform.', link: 'https://enam.gov.in/' },
    { icon: '👴', title: 'PM-KMY', desc: 'Pension scheme for small & marginal farmers above age 60.', link: 'https://maandhan.in/' },
    { icon: '💧', title: 'PMKSY', desc: 'PM Krishi Sinchai Yojana — Water to every field.', link: 'https://pmksy.gov.in/' },
    { icon: '🧪', title: 'Soil Health Card', desc: 'Free soil testing and recommendation card for every farm.', link: 'https://soilhealth.dac.gov.in/' },
];

export default function Home() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const features = [
        { path: '/crop-recommendation', icon: '🌾', key: 'cropRec', color: '#16a34a', bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' },
        { path: '/fertilizer-guide', icon: '🧪', key: 'fertilizer', color: '#2563eb', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
        { path: '/disease-detection', icon: '🔬', key: 'disease', color: '#dc2626', bg: 'linear-gradient(135deg, #fee2e2, #fecaca)' },
        { path: '/profit-calculator', icon: '💰', key: 'profit', color: '#d97706', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
        { path: '/mandi-rates', icon: '📈', key: 'mandi', color: '#7c3aed', bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' },
        { path: '/marketplace', icon: '🛒', key: 'market', color: '#0891b2', bg: 'linear-gradient(135deg, #cffafe, #a5f3fc)' },
        { path: '/weather', icon: '🌤️', key: 'weather', color: '#059669', bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' },
        { path: '/translator', icon: '🌍', key: 'translator', color: '#0284c7', bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' },
        { path: '/ai', icon: '🤖', key: 'ai', color: '#9333ea', bg: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)' },
    ];

    const newsItems = t('home.news') || [];

    return (
        <div className="home-page">

            {/* ===== HERO SECTION ===== */}
            <div className="hero-section">

                {/* Left: Hero Content */}
                <div className="hero-content">
                    <div className="hero-badge">🌱 Powered by AI</div>
                    <h1 className="hero-title">
                        {t('home.hero_title')}<br />
                        <span className="hero-highlight">{t('home.hero_sub_title')}</span>
                    </h1>
                    <p className="hero-subtitle">{t('home.hero_desc')}</p>
                    <div className="hero-actions">
                        <button className="hero-btn-primary" onClick={() => navigate('/ai?mode=voice')}>
                            🎙️ {t('home.ask_voice')}
                        </button>
                        <button className="hero-btn-secondary" onClick={() => navigate('/ai')}>
                            🤖 {t('home.ask_ai')}
                        </button>
                    </div>
                </div>

                {/* Right: Govt Schemes Panel */}
                <div className="hero-schemes-panel">
                    <div className="hero-schemes-header">
                        <span className="hero-schemes-badge">🏛️ Govt Schemes</span>
                        <p className="hero-schemes-hint">Tap any scheme to visit the official portal</p>
                    </div>
                    <div className="hero-schemes-list">
                        {GOVT_SCHEMES.map((scheme, i) => (
                            <a
                                key={i}
                                href={scheme.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hero-scheme-item"
                                title={`Visit official ${scheme.title} govt portal`}
                            >
                                <span className="hero-scheme-icon">{scheme.icon}</span>
                                <div className="hero-scheme-info">
                                    <strong>{scheme.title}</strong>
                                    <span>{scheme.desc}</span>
                                </div>
                                <span className="hero-scheme-arrow">↗</span>
                            </a>
                        ))}
                    </div>
                </div>

            </div>

            {/* ===== NEWS TICKER ===== */}
            <div className="news-ticker-container">
                <div className="news-label">{t('home.news_label')}</div>
                <div className="news-ticker-wrapper">
                    <div className="news-ticker-track">
                        {newsItems.map((news, i) => (
                            <span className="news-item" key={i}>{news}</span>
                        ))}
                        {newsItems.map((news, i) => (
                            <span className="news-item" key={`dup-${i}`}>{news}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== FEATURES ===== */}
            <div className="features-section">
                <div className="features-header">
                    <h2>{t('home.features_title')}</h2>
                    <p>{t('home.features_subtitle')}</p>
                </div>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <button
                            key={f.path}
                            className="feature-card fade-in"
                            style={{ '--card-color': f.color, '--card-bg': f.bg, animationDelay: `${0.1 + i * 0.06}s` }}
                            onClick={() => navigate(f.path)}
                        >
                            <div className="feature-icon-wrap">
                                <span className="feature-icon">{f.icon}</span>
                            </div>
                            <div className="feature-info">
                                <div className="feature-label">{t(`home.${f.key}`)}</div>
                                <div className="feature-desc">{t(`home.${f.key}_desc`)}</div>
                            </div>
                            <div className="feature-arrow">→</div>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}
