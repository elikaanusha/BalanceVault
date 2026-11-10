import React from 'react';
import { ShieldCheck, User, LogOut, CheckCircle, AlertTriangle, Key } from 'lucide-react';

export default function Navbar({ user, onLogout, activeTab, setActiveTab, systemHealth, isBootstrapped }) {
  return (
    <header style={{
      borderBottom: '1px solid #1e293b',
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Balance<span style={{ color: '#10b981' }}>Vault</span></span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>PROVABLE LEDGER</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Money movement with a ledger you can prove
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('home')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: activeTab === 'home' ? '#1e293b' : 'transparent',
              color: activeTab === 'home' ? '#f8fafc' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Overview
          </button>

          {!isBootstrapped && (
            <button
              onClick={() => setActiveTab('bootstrap')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: activeTab === 'bootstrap' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                color: '#fbbf24',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Key size={14} />
              Admin Bootstrap
            </button>
          )}

          {user && user.role === 'ACCOUNT_HOLDER' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: activeTab === 'dashboard' ? '#1e293b' : 'transparent',
                  color: activeTab === 'dashboard' ? '#f8fafc' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Accounts & Movements
              </button>
              <button
                onClick={() => setActiveTab('onboarding')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: activeTab === 'onboarding' ? '#1e293b' : 'transparent',
                  color: activeTab === 'onboarding' ? '#f8fafc' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Onboarding KYC
              </button>
            </>
          )}

          {user && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: activeTab === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: activeTab === 'admin' ? '#34d399' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShieldCheck size={14} />
              Admin Management & Audit
            </button>
          )}
        </nav>

        {/* User Identity & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Health indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: systemHealth?.status === 'UP' || systemHealth?.status === 'READY' ? '#10b981' : '#f59e0b',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span className="mono">API: {systemHealth?.status || 'ONLINE'}</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName}</div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-rose' : user.role === 'AUDITOR' ? 'badge-amber' : 'badge-emerald'}`}>
                    {user.role}
                  </span>
                  <span className={`badge ${user.status === 'ACTIVE' ? 'badge-emerald' : 'badge-amber'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Log out"
              >
                <LogOut size={14} />
                <span style={{ fontSize: '0.8rem' }}>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

