import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ identifier: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.identifier.trim()) {
            setError('Please enter your email or phone number.');
            return;
        }
        setLoading(true);
        setError('');

        // Determine if identifier is email or phone
        const isEmail = form.identifier.includes('@');
        const payload = isEmail
            ? { email: form.identifier, password: form.password }
            : { phone: form.identifier, password: form.password };

        try {
            const res = await authAPI.login(payload);
            login(res.data.user, res.data.token);
            navigate('/', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Background decoration */}
            <div className="auth-bg">
                <div className="auth-blob auth-blob-1" />
                <div className="auth-blob auth-blob-2" />
                <div className="auth-blob auth-blob-3" />
            </div>

            <div className="auth-container">
                {/* Left panel – branding */}
                <div className="auth-brand-panel">
                    <div className="auth-logo">🌱</div>
                    <h1 className="auth-brand-name">KrishiMitra AI</h1>
                    <p className="auth-brand-tagline">Smart Farming Platform for every Indian farmer</p>
                    <ul className="auth-features">
                        <li>🌾 AI-powered crop recommendations</li>
                        <li>🌤️ Real-time weather alerts</li>
                        <li>📈 Live mandi price tracking</li>
                        <li>🔬 Crop disease detection</li>
                    </ul>
                </div>

                {/* Right panel – form */}
                <div className="auth-form-panel">
                    <div className="auth-card">
                        <div className="auth-card-header">
                            <h2>Welcome back 👋</h2>
                            <p>Sign in to your KrishiMitra account</p>
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form" noValidate>
                            <div className="form-group">
                                <label htmlFor="login-identifier">Email or Phone Number</label>
                                <div className="input-icon-wrap">
                                    <span className="input-icon">👤</span>
                                    <input
                                        id="login-identifier"
                                        name="identifier"
                                        type="text"
                                        placeholder="Enter email or 10-digit phone"
                                        value={form.identifier}
                                        onChange={handleChange}
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="login-password">Password</label>
                                <div className="input-icon-wrap">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-full auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><span className="btn-spinner" />  Signing in…</>
                                ) : (
                                    <>Sign In →</>
                                )}
                            </button>
                        </form>

                        <div className="auth-divider"><span>New to KrishiMitra?</span></div>

                        <Link to="/register" className="btn btn-secondary btn-full auth-alt-btn">
                            Create an Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
