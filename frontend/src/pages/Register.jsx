import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser, loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [accountType, setAccountType] = useState('company'); // 'company' | 'individual'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // For individuals: Name; for companies: Contact Person
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [budget, setBudget] = useState('');
  const [desiredDeadline, setDesiredDeadline] = useState('');
  const [socialAccounts, setSocialAccounts] = useState(['']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  // Check URL parameters for login mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setIsLoginMode(true);
    }
  }, [searchParams]);

  const budgetOptions = [
    { label: '€500 - €2.000', value: '500-2000' },
    { label: '€2.000 - €5.000', value: '2000-5000' },
    { label: '> €5.000', value: '5000+' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic client-side validation according to account type
    if (!email) return setError('Email is required.');
    if (!password && !isLoginMode) return setError('Password is required.');

    if (!isLoginMode) {
      if (accountType === 'company') {
        if (!companyName) return setError('Company Name is required.');
        if (!vatNumber) return setError('VAT Number is required.');
        if (!fullName) return setError('Contact Person is required.');
        if (!budget) return setError('Please select a budget range.');
      } else {
        // individual
        if (!fullName) return setError('Name is required.');
        if (!budget) return setError('Please select a budget range.');
      }
    }

    try {
      if (isLoginMode) {
        const res = await loginUser({ email, password });
        
        // Store authentication data
        if (res.token && res.user) {
          login(res.user, res.token);
          setSuccess(res.message || 'Login successful!');
          navigate('/home'); // Navigate immediately after login
        } else {
          setError('Invalid response from server');
        }
      } else {
        // Build registration payload
        const payload = {
          email,
          password,
          accountType,
          fullName: fullName, // backend expects `fullName`
          contactNumber: contactNumber || undefined,
          budget: budget || undefined
        };
        if (accountType === 'company') {
          payload.companyName = companyName;
          payload.vatNumber = vatNumber;
          // keep fullName as contact person
          if (desiredDeadline) payload.desiredDeadline = desiredDeadline;
        } else {
          // keep fullName as individual name
          payload.socialAccounts = socialAccounts.filter(s => s && s.trim());
        }

        const res = await registerUser(payload);
        setSuccess(res.message || 'Registration successful!');
        
        // Store authentication data if token is provided
        if (res.token && res.user) {
          login(res.user, res.token);
        }
        
        // ---- MODIFICATION START ----
        // Conditionally navigate based on the account type
        if (accountType === 'company') {
          navigate('/profile-setup');
        } else {
          navigate('/home'); // Or your desired home page route
        }
        // ---- MODIFICATION END ----
      }
    } catch (err) {
      setError(err.response?.data?.error || (isLoginMode ? 'Login failed.' : 'Registration failed.'));
    }
  };

  const updateSocialAccount = (index, value) => {
    const copy = [...socialAccounts];
    copy[index] = value;
    setSocialAccounts(copy);
  };

  const addSocialAccount = () => setSocialAccounts(prev => [...prev, '']);
  const removeSocialAccount = (index) => setSocialAccounts(prev => prev.filter((_, i) => i !== index));

  // New function to handle admin login navigation
  const handleAdminLogin = () => {
    navigate('/admin');
  };

  return (
    <div style={{ 
      background: '#f8f9fa', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 20px 20px 20px', // Added top padding for fixed header
      fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        overflow: 'hidden'
      }}>
        
        {/* Left Section - Light Blue Background */}
        <div style={{
          flex: '1',
          background: '#e6f3ff',
          padding: '60px 40px',
          color: '#000000',
          position: 'relative'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '60px'
          }}>
            <img 
              src="/LOGO.png" 
              alt="Company Logo" 
              style={{ 
                height: '40px',
                objectFit: 'contain'
              }} 
            />
            <span style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#000000'
            }}>
              IntakeAI
            </span>
          </div>

          {/* Left Section Text */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              fontSize: '16px',
              marginBottom: '8px',
              opacity: 0.9
            }}>
              {isLoginMode ? 'Welcome Back 👋' : 'Join Us to Build 🛠️'}
            </div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              margin: '0 0 16px 0',
              lineHeight: '1.2'
            }}>
              {isLoginMode ? 'Sign In to Continue' : 'Start your Journey'}
            </h1>
            <p style={{
              fontSize: '18px',
              opacity: 0.9,
              lineHeight: '1.5'
            }}>
              {isLoginMode ? 'Access your dashboard and manage your AI intake system.' : 'Follow these simple steps to set up your account.'}
            </p>
          </div>

          {/* Steps Cards */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '60px'
          }}>
            {/* Step 1 - Active */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              flex: '1',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#667eea',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '18px'
              }}>
                {isLoginMode ? '🔑' : '1'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#000000',
                fontWeight: 600
              }}>
                {isLoginMode ? 'Enter credentials' : 'Register your account'}
              </div>
            </div>

            {/* Step 2 - Inactive */}
            <div style={{
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              flex: '1',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(102, 126, 234, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#667eea',
                fontWeight: 700,
                fontSize: '18px'
              }}>
                {isLoginMode ? '✅' : '2'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontWeight: 600
              }}>
                {isLoginMode ? 'Access dashboard' : 'Set up your profile'}
              </div>
            </div>

            {/* Step 3 - Inactive */}
            <div style={{
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              flex: '1',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(102, 126, 234, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#667eea',
                fontWeight: 700,
                fontSize: '18px'
              }}>
                {isLoginMode ? '🚀' : '3'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontWeight: 600
              }}>
                {isLoginMode ? 'Manage your system' : 'Start using AI'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div style={{
          flex: '1',
          padding: '60px 40px',
          background: '#ffffff'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#000000',
            margin: '0 0 40px 0',
            textAlign: 'center'
          }}>
            {isLoginMode ? 'Welcome Back' : 'Join Us'}
          </h2>

          <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
            {/* Account type toggle (register mode only) */}
            {!isLoginMode && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAccountType('company')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: accountType === 'company' ? '2px solid #667eea' : '1px solid #e5e7eb',
                    background: accountType === 'company' ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Companies (VAT-liable)
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('individual')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: accountType === 'individual' ? '2px solid #667eea' : '1px solid #e5e7eb',
                    background: accountType === 'individual' ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Private Individuals
                </button>
              </div>
            )}

            {/* Company fields */}
            {!isLoginMode && accountType === 'company' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Company Name *
                  </label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter company name" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    VAT Number *
                  </label>
                  <input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="Enter VAT number" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Contact Person *
                  </label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Name of contact person" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
              </>
            )}

            {/* Private individual fields */}
            {!isLoginMode && accountType === 'individual' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Name *
                  </label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
              </>
            )}

            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email *
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '48px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '8px 0 0 0',
                lineHeight: '1.4'
              }}>
                At least 8 characters, including uppercase letters, lowercase letters, numbers, and symbols.
              </p>
            </div>

            {/* Budget (mandatory for both account types when registering) */}
            {!isLoginMode && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Budget Indication *
                </label>
                <select value={budget} onChange={e => setBudget(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <option value="">Select a budget range</option>
                  {budgetOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>This helps us understand your expectations.</p>
              </div>
            )}

            {/* Optional Phone Number */}
            {!isLoginMode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Phone Number (optional)
                </label>
                <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="+49 170 000000" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
            )}

            {/* Desired Deadline (optional for companies) */}
            {!isLoginMode && accountType === 'company' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Desired Deadline (optional)
                </label>
                <input type="date" value={desiredDeadline} onChange={e => setDesiredDeadline(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
            )}

            {/* Social Media Accounts (optional for individuals) */}

            {/* Submit Button */}
            <button 
              type="submit" 
              style={{
                width: '100%',
                background: '#667eea',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '24px',
                transition: 'background-color 0.2s ease'
              }}
            >
              {isLoginMode ? 'Sign In' : 'Continue'}
            </button>

            {/* Error/Success Messages */}
            {error && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ 
                color: '#059669', 
                marginBottom: '16px',
                padding: '12px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                {success}
              </div>
            )}

            {/* Toggle Link */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button 
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>

            {/* NEW: Admin Login Link */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <button 
                type="button"
                onClick={handleAdminLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: 0.8
                }}
              >
                🔐 Admin Login
              </button>
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ flex: '1', height: '1px', background: '#e5e7eb' }}></div>
              <span style={{ padding: '0 16px', color: '#6b7280', fontSize: '14px' }}>Or</span>
              <div style={{ flex: '1', height: '1px', background: '#e5e7eb' }}></div>
            </div>

            {/* Google Sign Up */}
            <button 
              type="button"
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}
            >
              <span style={{ fontSize: '20px' }}>🔍</span>
              Sign up with Google
            </button>

            {/* Terms */}
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              By signing up I confirm that I carefully have read and agree to the{' '}
              <a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>Privacy Policy</a>
              {' '}and{' '}
              <a href="#" style={{ color: '#667eea', textDecoration: 'none' }}>Terms of Service</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}