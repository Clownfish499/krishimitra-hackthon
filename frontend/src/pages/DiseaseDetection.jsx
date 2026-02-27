import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { diseaseAPI, cropsAPI } from '../services/api';
import './DiseaseDetection.css';

const symptomList = [
    'Yellow leaves', 'Brown spots', 'White powder', 'Wilting', 'Leaf curl',
    'Black spots', 'Holes in leaves', 'Stem rot', 'Root rot', 'Stunted growth',
    'Drying leaves', 'Sticky residue', 'Moldy growth', 'Fruit rot', 'Deformed fruit',
    'Yellow veins', 'Mosaic pattern', 'Early leaf drop', 'Premature ripening', 'Webbing on leaves'
];
const partList = ['Leaves', 'Stem', 'Roots', 'Fruits', 'Flowers', 'Whole plant', 'Buds', 'Bark', 'Seeds', 'Branches'];

export default function DiseaseDetection() {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [dbCrops, setDbCrops] = useState([]);
    const [tab, setTab] = useState('image');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [symptomForm, setSymptomForm] = useState({ crop: '', symptoms: [], affectedPart: '' });

    React.useEffect(() => {
        cropsAPI.getAll().then(res => {
            if (res.data.success) setDbCrops(res.data.crops);
        }).catch(e => console.error(e));
    }, []);

    const speak = (text) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const analyzeImage = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('image', image);
            const res = await diseaseAPI.identify(fd);
            setResult(res.data);
            if (res.data.voiceSuggestion) speak(res.data.voiceSuggestion);
        } catch (e) {
            setResult({ fallback: true, message: 'Analysis failed. Please try symptom checker.' });
        } finally { setLoading(false); }
    };

    const analyzeSymptoms = async () => {
        if (!symptomForm.crop || symptomForm.symptoms.length === 0) return;
        setLoading(true);
        try {
            const res = await diseaseAPI.analyzeSymptoms(symptomForm);
            setResult(res.data);
            if (res.data.voiceSuggestion) speak(res.data.voiceSuggestion);
        } catch (e) {
            setResult({ fallback: true, message: 'Analysis failed.' });
        } finally { setLoading(false); }
    };

    const toggleSymptom = (s) => {
        setSymptomForm(f => ({
            ...f,
            symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s]
        }));
    };

    const severityColor = { low: '#4caf50', medium: '#ff8f00', high: '#e53935', none: '#9e9e9e' };

    return (
        <div className="disease-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate('/')}>←</button>
                <div style={{ marginLeft: 48 }}>
                    <h1>🔬 {t('disease.title')}</h1>
                    <p>AI-powered plant diagnosis</p>
                </div>
            </header>

            <div className="tab-bar">
                <button className={`tab-btn ${tab === 'image' ? 'active' : ''}`} onClick={() => { setTab('image'); setResult(null); }}>📷 Image Analysis</button>
                <button className={`tab-btn ${tab === 'symptoms' ? 'active' : ''}`} onClick={() => { setTab('symptoms'); setResult(null); }}>📋 {t('disease.symptomChecker')}</button>
            </div>

            {tab === 'image' && (
                <div className="card">
                    <label className="image-upload-area">
                        {preview ? <img src={preview} alt="Upload" className="preview-img" /> : <div className="upload-placeholder"><span>📷</span><p>Tap to upload plant photo</p></div>}
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                    {image && <button className="btn btn-primary btn-full" onClick={analyzeImage} disabled={loading}>{loading ? '🔬 Analyzing...' : '🔬 ' + t('disease.analyze')}</button>}
                </div>
            )}

            {tab === 'symptoms' && (
                <div className="card">
                    <div className="form-group">
                        <label>{t('disease.selectCrop')}</label>
                        <select value={symptomForm.crop} onChange={e => setSymptomForm(f => ({ ...f, crop: e.target.value }))}>
                            <option value="">{t('disease.selectCrop')}</option>
                            {dbCrops.map(c => <option key={c._id} value={c.name.en}>{c.name[language] || c.name.en}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('disease.symptoms')}</label>
                        <div className="symptom-grid">
                            {symptomList.map(s => (
                                <button key={s} className={`symptom-chip ${symptomForm.symptoms.includes(s) ? 'selected' : ''}`} onClick={() => toggleSymptom(s)}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('disease.affectedPart')}</label>
                        <select value={symptomForm.affectedPart} onChange={e => setSymptomForm(f => ({ ...f, affectedPart: e.target.value }))}>
                            <option value="">Select part</option>
                            {partList.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={analyzeSymptoms} disabled={loading || !symptomForm.crop}>
                        {loading ? '🔬 Diagnosing...' : '🔬 ' + t('disease.diagnose')}
                    </button>
                </div>
            )}

            {result && (
                <div className="result-card card fade-in">
                    {result.isHealthy ? (
                        <div className="healthy-result">✅ {t('disease.healthy')}</div>
                    ) : result.fallback ? (
                        <div className="fallback-result">⚠️ {result.message}</div>
                    ) : (
                        <>
                            <div className="disease-header">
                                <h3>{result.disease || 'Unknown Disease'}</h3>
                                <div className="action-row">
                                    <button className={`icon-btn ${isSpeaking ? 'active' : ''}`} onClick={() => speak(result.voiceSuggestion)}>🔊</button>
                                    <span className="severity-badge" style={{ background: `${severityColor[result.severity || 'medium']}22`, color: severityColor[result.severity || 'medium'] }}>{result.severity?.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="confidence-bar">
                                <div className="confidence-fill" style={{ width: `${result.confidence || 0}%`, background: result.confidence > 70 ? '#4caf50' : '#ff8f00' }}></div>
                            </div>
                            <div className="confidence-label">{t('disease.confidence')}: {result.confidence}% ({result.type})</div>

                            <div className="ai-discuss-banner">
                                <p>{t('disease.discuss_title')}</p>
                                <button className="discuss-btn" onClick={() => {
                                    const contextPattern = t('disease.discuss_context');
                                    const finalContext = contextPattern
                                        .replace('{{disease}}', result.disease)
                                        .replace('{{crop}}', result.crop || t('disease.plant'));
                                    navigate(`/ai?mode=voice&context=${encodeURIComponent(finalContext)}`);
                                }}>
                                    💬 {t('disease.discuss_btn')}
                                </button>
                            </div>

                            {result.treatment?.length > 0 && (
                                <div className="result-section">
                                    <h4>💊 {t('disease.treatment')}</h4>
                                    <ul>{result.treatment.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                </div>
                            )}
                            {result.prevention?.length > 0 && (
                                <div className="result-section">
                                    <h4>🛡️ {t('disease.prevention')}</h4>
                                    <ul>{result.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
