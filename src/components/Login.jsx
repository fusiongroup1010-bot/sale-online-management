import React, { useState, useEffect } from 'react';
import { useAuth, EMPLOYEES } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/fusion-logo.png';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberId, setRememberId] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedId = localStorage.getItem('rememberedId');
    if (savedId) {
      setUserId(savedId);
      setRememberId(true);
    }
  }, []);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(userId, password);
      
      if (rememberId && userId.toLowerCase() !== 'guest') {
        localStorage.setItem('rememberedId', userId);
      } else {
        localStorage.removeItem('rememberedId');
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    try {
      setError('');
      setLoading(true);
      await login('guest');
      navigate('/');
    } catch (err) {
      setError('Guest login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card animate-fade-in">
        <div className="login-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src={logo} 
            alt="Fusion Group Logo" 
            style={{ width: '120px', height: 'auto', marginBottom: '16px' }} 
          />
          <h1 className="text-gradient" style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.2' }}>Sale Online Management</h1>
          <p className="login-subtitle" style={{ fontSize: '18px', fontWeight: '800', marginTop: '24px', color: 'var(--primary-accent)' }}>Please sign in</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userId">Employee ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              placeholder="e.g.: TraRD, NgaMedia..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontSize: '15px' }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontSize: '15px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <input 
              type="checkbox" 
              id="remember" 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
            />
            <label htmlFor="remember" style={{ margin: 0, cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>Remember me</label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              disabled={loading} 
              className="btn-primary login-btn" 
              type="submit"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p style={{ marginBottom: '8px' }}>© 2026 Sale Online Management</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
