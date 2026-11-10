import React, { useState } from 'react';
import ApiService from '../services/api';
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight, Check } from 'lucide-react';

export default function AuthModal({ onLoginSuccess, onNavigateBootstrap }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await ApiService.register({ email, password, fullName });
        ApiService.setToken(res.token);
        onLoginSuccess(res.user);
      } else {
        const res = await ApiService.login({ email, password });
        ApiService.setToken(res.token);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoRole) => {
    if (demoRole === 'admin') {
      setEmail('admin@balancevault.internal');
      setPassword('AdminVault2026!Secure');
    } else if (demoRole === 'alice') {
      setEmail('alice.investor@example.com');
      setPassword('AlicePassword2026!');
    } else if (demoRole === 'bob') {
      setEmail('bob.merchant@example.com');
      setPassword('BobPassword2026!');
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 20px' }}>
      <div className="glass-card" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            marginBottom: '12px'
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {isRegister ? 'Register Account Holder' : 'Sign In to BalanceVault'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '6px' }}>
            {isRegister
              ? 'Create a secure financial account with auditable ledger tracking'
              : 'Access your account management dashboard and provable ledger'}
          </p>
        </div>

        {/* Demo Credentials Quick Fill */}
        {!isRegister && (
          <div style={{ background: '#0b1120', padding: '12px', borderRadius: '8px', border: '1px solid #1e2e50', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              DEMO SHORTCUTS (AUTO-FILL):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#fb7185' }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('alice')}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#34d399' }}
              >
                Alice (Account Holder)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('bob')}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#60a5fa' }}
              >
                Bob (Merchant)
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            color: '#fb7185',
            marginBottom: '18px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Full Legal Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ paddingLeft: '38px' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alice Walker"
                />
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="input-control"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
              />
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="input-control"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                style={{ color: '#10b981', fontWeight: 600, background: 'none' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New account holder?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                style={{ color: '#10b981', fontWeight: 600, background: 'none' }}
              >
                Register Now
              </button>
            </span>
          )}
        </div>

        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #1e2e50', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onNavigateBootstrap}
            style={{ background: 'none', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 500 }}
          >
            Need to initialize the First Administrator? Open Bootstrap Wizard &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

