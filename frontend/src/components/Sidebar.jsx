import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language, changeLanguage } = useLanguage();

    // Close on navigation
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname, setIsOpen]);

    const navItems = [
        { path: '/', icon: '🏠', label: t('nav.home') },
        { path: '/ai', icon: '🤖', label: t('nav.ai') },
        { path: '/translator', icon: '🌍', label: t('nav.translator') || 'Translator' },
        { path: '/weather', icon: '🌤️', label: t('nav.weather') },
        { path: '/mandi-rates', icon: '📈', label: t('nav.mandi') || 'Mandi Rates' },
        { path: '/marketplace', icon: '🛒', label: t('nav.market') },
        { path: '/crop-recommendation', icon: '🌾', label: t('home.cropRec') || 'Crop Guide' },
        { path: '/disease-detection', icon: '🔬', label: t('home.disease') || 'Disease Detection' },
        { path: '/fertilizer-guide', icon: '🧪', label: t('home.fertilizer') || 'Fertilizer' },
        { path: '/profit-calculator', icon: '💰', label: t('home.profit') || 'Profit Calc' },
        { path: '/profile', icon: '👤', label: t('nav.profile') },
    ];

    return (
        <>
            {/* Global Hamburger Icon */}
            <button
                className={`menu-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Menu"
            >
                <div className="hamburger-box">
                    <div className="hamburger-inner"></div>
                </div>
            </button>

            {/* Overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={() => setIsOpen(false)} />

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand" onClick={() => navigate('/')}>
                    <div className="brand-logo">🌱</div>
                    <div className="brand-info">
                        <div className="brand-name">KrishiMitra AI</div>
                        <div className="brand-sub">Smart Farming Platform</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                            {location.pathname === item.path && <div className="active-dot" />}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="lang-switcher">
                        {[
                            { code: 'en', label: 'EN' },
                            { code: 'hi', label: 'हिं' },
                            { code: 'kn', label: 'ಕನ್ನ' },
                        ].map(l => (
                            <button
                                key={l.code}
                                className={`lang-btn ${language === l.code ? 'active' : ''}`}
                                onClick={() => changeLanguage(l.code)}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}
