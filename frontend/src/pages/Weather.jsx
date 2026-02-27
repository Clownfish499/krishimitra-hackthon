import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { weatherAPI } from '../services/api';
import './Weather.css';

export default function Weather() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    fetchWeather({ lat, lng });
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                        const data = await res.json();
                        setLocationName(data.address?.city || data.address?.town || data.address?.village || 'Current Location');
                    } catch { setLocationName('Current Location'); }
                },
                () => fetchWeather({ city: 'New Delhi' })
            );
        } else fetchWeather({ city: 'New Delhi' });
    }, []);

    async function fetchWeather(params) {
        try {
            const res = await weatherAPI.getForecast(params);
            setWeather(res.data.forecast);
        } catch { } finally { setLoading(false); }
    }

    const icons = { Clear: '☀️', Sunny: '☀️', 'Partly Cloudy': '⛅', Cloudy: '☁️', 'Light Rain': '🌦️', Rain: '🌧️', Thunderstorm: '⛈️', Snow: '❄️', Fog: '🌫️' };
    const getIcon = (desc) => Object.entries(icons).find(([k]) => desc?.includes(k))?.[1] || '🌡️';

    const getThemeClass = (desc) => {
        if (!desc) return 'theme-sunny';
        const d = desc.toLowerCase();
        if (d.includes('rain') || d.includes('shower') || d.includes('thunder')) return 'theme-rainy';
        if (d.includes('cloud') || d.includes('overcast')) return 'theme-cloudy';
        if (d.includes('snow') || d.includes('cold') || d.includes('freeze')) return 'theme-cold';
        return 'theme-sunny';
    };

    if (loading) return <div className="weather-page theme-sunny"><div className="spinner"></div></div>;

    const themeClass = getThemeClass(weather?.current?.description);

    return (
        <div className={`weather-page ${themeClass}`}>
            <header className="page-header" style={{ background: 'transparent' }}>
                <button className="back-btn" onClick={() => navigate('/')}>←</button>
                <div style={{ marginLeft: 48 }}>
                    <h1>🌤️ {t('weather.title')}</h1>
                    <p style={{ opacity: 0.8 }}>{locationName || t('weather.currentLocation')}</p>
                </div>
            </header>

            <div className="weather-container">
                {weather && (
                    <>
                        <div className="weather-hero-section">
                            <div className="glass-card current-main">
                                <div className="main-temp-row">
                                    <div className="hero-icon">{getIcon(weather.current?.description)}</div>
                                    <div className="hero-temp-wrap">
                                        <div className="hero-temp">{weather.current?.temp}°</div>
                                        <div className="hero-desc">{weather.current?.description}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card detail-grid">
                                <div className="detail-item">
                                    <span className="detail-icon">🌡️</span>
                                    <span className="detail-val">{weather.current?.feelsLike}°C</span>
                                    <span className="detail-lbl">Feels Like</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">💧</span>
                                    <span className="detail-val">{weather.current?.humidity}%</span>
                                    <span className="detail-lbl">Humidity</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">💨</span>
                                    <span className="detail-val">{weather.current?.windSpeed} <small>km/h</small></span>
                                    <span className="detail-lbl">Wind</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">🧭</span>
                                    <span className="detail-val">1012 <small>hPa</small></span>
                                    <span className="detail-lbl">Pressure</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card">
                            <h3 className="section-title">📅 {t('weather.forecast')}</h3>
                            <div className="forecast-scroll-wrap">
                                {weather.daily?.map((day, i) => (
                                    <div key={i} className="forecast-card">
                                        <div className="f-day">{day.day}</div>
                                        <div className="f-icon">{getIcon(day.description)}</div>
                                        <div className="f-temp">{day.tempMax}°</div>
                                        <div className="f-rain">💧{day.rainChance}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {weather.agriculturalAlerts?.length > 0 && (
                            <div className="agri-alerts">
                                <h3 className="section-title">🌾 {t('weather.alerts')}</h3>
                                {weather.agriculturalAlerts.map((alert, i) => (
                                    <div key={i} className={`alert-item ${alert.severity}`}>
                                        <div className="alert-header">
                                            <span className="alert-type">{t(`weather.alert_${alert.type}`) || alert.type.toUpperCase()}</span>
                                            <span className="alert-severity">{alert.severity.toUpperCase()}</span>
                                        </div>
                                        <p className="alert-msg">{alert.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
