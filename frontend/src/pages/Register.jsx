import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import './Login.css'; // reuse shared auth styles

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        language: 'en',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const validate = () => {
        if (!form.name.trim()) return 'Full name is required.';
        if (!form.phone && !form.email) return 'Enter at least a phone number or email.';
        if (form.phone && !/^\d{10}$/.test(form.phone)) return 'Phone must be 10 digits.';
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) return 'Invalid email address.';
        if (!form.password) return 'Password is required.';
        if (form.password.length < 6) return 'Password must be at least 6 characters.';
        if (form.password !== form.confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        setError('');
        try {
            const payload = {
                name: form.name,
                phone: form.phone || undefined,
                email: form.email || undefined,
                password: form.password,
                language: form.language,
            };
            const res = await authAPI.register(payload);
            login(res.data.user, res.data.token);
            navigate('/', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-blob auth-blob-1" />
                <div className="auth-blob auth-blob-2" />
                <div className="auth-blob auth-blob-3" />
            </div>

            <div className="auth-container">
                {/* Left panel */}
                <div className="auth-brand-panel">
                    <div className="auth-logo">🌱</div>
                    <h1 className="auth-brand-name">KrishiMitra AI</h1>
                    <p className="auth-brand-tagline">Join thousands of farmers using AI to grow smarter</p>
                    <ul className="auth-features">
                        <li>✅ Free to use — always</li>
                        <li>🗣️ Available in Hindi, English & Kannada</li>
                        <li>📱 Works on any device</li>
                        <li>🔒 Your data stays private</li>
                    </ul>
                </div>

                {/* Right panel */}
                <div className="auth-form-panel">
                    <div className="auth-card">
                        <div className="auth-card-header">
                            <h2>Create Account 🌾</h2>
                            <p>Start your smart farming journey today</p>
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form" noValidate>
                            <div className="form-group">
                                <label htmlFor="reg-name">Full Name *</label>
                                <div className="input-icon-wrap">
                                    <span className="input-icon">👤</span>
                                    <input
                                        id="reg-name"
                                        name="name"
                                        type="text"
                                        placeholder="Your full name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="reg-phone">Phone Number</label>
                                    <div className="input-icon-wrap">
                                        <span className="input-icon">📱</span>
                                        <input
                                            id="reg-phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="10-digit number"
                                            value={form.phone}
                                            onChange={handleChange}
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reg-email">Email Address</label>
                                    <div className="input-icon-wrap">
                                        <span className="input-icon">📧</span>
                                        <input
                                            id="reg-email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-language">Preferred Language</label>
                                <div className="input-icon-wrap">
                                    <span className="input-icon">🌐</span>
                                    <select
                                        id="reg-language"
                                        name="language"
                                        value={form.language}
                                        onChange={handleChange}
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">हिंदी (Hindi)</option>
                                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="reg-password">Password *</label>
                                    <div className="input-icon-wrap">
                                        <span className="input-icon">🔒</span>
                                        <input
                                            id="reg-password"
                                            name="password"
                                            type="password"
                                            placeholder="Min 6 characters"
                                            value={form.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reg-confirm">Confirm Password *</label>
                                    <div className="input-icon-wrap">
                                        <span className="input-icon">🔒</span>
                                        <input
                                            id="reg-confirm"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="Repeat password"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-full auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><span className="btn-spinner" />  Creating Account…</>
                                ) : (
                                    <>Create Account →</>
                                )}
                            </button>
                        </form>

                        <div className="auth-divider"><span>Already have an account?</span></div>

                        <Link to="/login" className="btn btn-secondary btn-full auth-alt-btn">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
