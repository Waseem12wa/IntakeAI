import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { setToken } = useAuth(); // Assuming AuthContext provides this, or we manage it locally like AdminDashboard did
    const [email, setEmail] = useState('admin@intake.ai');
    const [password, setPassword] = useState('admin1234');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // We are not using the main AuthContext for admin presumably, based on AdminDashboard legacy code.
    // But let's check how AuthContext works.
    // If we want "like the other user", maybe we should use the main auth?
    // User said "admin will not be registered from frontend . use this one directly for login".
    // So standard login flow.

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await loginUser({ email, password });

            if (data.token) {
                if (data.user && data.user.role === 'admin') {
                    // Store token in localStorage or Context
                    // Since AdminDashboard used local state, we should probably standardize on localStorage for admin too
                    // or passing it via state. But localStorage is better for reload persistence.
                    localStorage.setItem('adminToken', data.token);
                    // Also set authToken so admin can use user features
                    localStorage.setItem('authToken', data.token);

                    navigate('/admin');
                } else {
                    setError('Access denied: Admin privileges required.');
                }
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Invalid credentials or server error.');
        }
        setLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            width: '100%',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '32px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
            }}>
                <h2 style={{
                    textAlign: 'center',
                    color: '#2196F3',
                    marginBottom: '24px',
                    fontFamily: "'Google Sans', sans-serif"
                }}>Admin Login</h2>

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '20px',
                        background: '#ffebee',
                        color: '#c62828',
                        borderRadius: '6px',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#2196F3',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
