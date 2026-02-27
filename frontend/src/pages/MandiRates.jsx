import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { mandiAPI, alertsAPI } from '../services/api';
import './MandiRates.css';

export default function MandiRates() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);
    const [filters, setFilters] = useState({ state: '', district: '', commodity: '' });
    const [alertModal, setAlertModal] = useState(null);
    const [alertForm, setAlertForm] = useState({ targetPrice: '', condition: 'above' });
    const [toast, setToast] = useState('');

    useEffect(() => { fetchRates(); }, [filters]);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await mandiAPI.getRates({ state: filters.state || undefined, district: filters.district || undefined, commodity: filters.commodity || undefined });
            setRates(res.data.data || []);
            setIsFallback(res.data.isFallback);
        } catch { } finally { setLoading(false); }
    };

    const setAlert = async () => {
        if (!alertForm.targetPrice) return;
        try {
            await alertsAPI.create({
                commodity: alertModal.commodity,
                state: alertModal.state,
                district: alertModal.district,
                targetPrice: Number(alertForm.targetPrice),
                condition: alertForm.condition
            });
            setAlertModal(null);
            setToast(`✅ Alert set for ${alertModal.commodity}!`);
            setTimeout(() => setToast(''), 3000);
        } catch (e) {
            setToast('❌ Failed to set alert');
            setTimeout(() => setToast(''), 3000);
        }
    };

    const states = ['Karnataka', 'Maharashtra', 'Punjab', 'Uttar Pradesh', 'Andhra Pradesh', 'Gujarat', 'Madhya Pradesh'];

    return (
        <div className="mandi-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate('/')}>←</button>
                <div style={{ marginLeft: 48 }}>
                    <h1>📈 {t('mandi.title')}</h1>
                    <p>{isFallback ? <span className="fallback-tag">⚠️ {t('mandi.fallback')}</span> : '🟢 Live Data'}</p>
                </div>
            </header>

            <div className="mandi-filters card">
                <div className="filter-row">
                    <select value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}>
                        <option value="">All States</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" placeholder="District" value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))} />
                </div>
                <input type="text" placeholder="🌾 Search commodity..." value={filters.commodity} onChange={e => setFilters(f => ({ ...f, commodity: e.target.value }))} style={{ marginTop: 8 }} />
            </div>

            {loading ? <div className="spinner" /> : (
                <div className="mandi-table-wrap">
                    <table className="mandi-table">
                        <thead>
                            <tr>
                                <th>Commodity</th>
                                <th>Market</th>
                                <th>Modal ₹/q</th>
                                <th>Variation</th>
                                <th>Alert</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.map((row, i) => (
                                <tr key={i}>
                                    <td>
                                        <strong>{row.commodity}</strong>
                                        <div className="mandi-sub">{row.variety}</div>
                                        <div className="price-range">₹{row.minPrice} - ₹{row.maxPrice}</div>
                                    </td>
                                    <td>
                                        <div className="mandi-market">{row.market}</div>
                                        <div className="mandi-sub">{row.district}</div>
                                    </td>
                                    <td className="modal-price">₹{row.modalPrice}</td>
                                    <td className={`variation-cell ${row.variation >= 0 ? 'price-up' : 'price-down'}`}>
                                        {row.variation >= 0 ? '↑' : '↓'} {Math.abs(row.variation)}%
                                    </td>
                                    <td>
                                        <button className="alert-btn" onClick={() => setAlertModal(row)} title="Set Price Alert">🔔</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rates.length === 0 && <div className="empty-state">No data found. Try different filters.</div>}
                </div>
            )}

            {alertModal && (
                <div className="modal-overlay" onClick={() => setAlertModal(null)}>
                    <div className="alert-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setAlertModal(null)}>✕</button>
                        <h3>🔔 Set Price Alert</h3>
                        <p className="alert-modal-sub">Commodity: <strong>{alertModal.commodity}</strong> in {alertModal.market}</p>
                        <p className="alert-current">Current price: <strong>₹{alertModal.modalPrice}/quintal</strong></p>
                        <div className="form-group">
                            <label>Notify me when price goes</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select value={alertForm.condition} onChange={e => setAlertForm(f => ({ ...f, condition: e.target.value }))}>
                                    <option value="above">Above ↑</option>
                                    <option value="below">Below ↓</option>
                                </select>
                                <input type="number" placeholder="₹ Target price" value={alertForm.targetPrice} onChange={e => setAlertForm(f => ({ ...f, targetPrice: e.target.value }))} />
                            </div>
                        </div>
                        <button className="btn btn-primary btn-full" onClick={setAlert}>🔔 Set Alert</button>
                    </div>
                </div>
            )}

            {toast && <div className="toast-mandi">{toast}</div>}
        </div>
    );
}
