import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './pages/AuthModal';
import BootstrapWizard from './pages/BootstrapWizard';
import Dashboard from './pages/Dashboard';
import OnboardingFlow from './pages/OnboardingFlow';
import AdminPortal from './pages/AdminPortal';
import ApiService from './services/api';
import {
  ShieldCheck,
  Database,
  Lock,
  FileCheck,
  ArrowRight,
  Layers,
  Terminal,
  Activity,
  Server,
  Zap
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [systemHealth, setSystemHealth] = useState(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [adminEmail, setAdminEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const initApp = async () => {
    try {
      // 1. Health check
      const readyRes = await ApiService.getReady().catch(e => ({ status: 'UP' }));
      setSystemHealth(readyRes);

      // 2. Check bootstrap state
      const bootRes = await ApiService.getBootstrapStatus().catch(e => ({ isBootstrapped: false }));
      setIsBootstrapped(bootRes.isBootstrapped);
      setAdminEmail(bootRes.adminEmail);

      // 3. Check existing logged in session
      const token = ApiService.getToken();
      if (token) {
        const meRes = await ApiService.getMe().catch(() => null);
        if (meRes && meRes.user) {
          setUser(meRes.user);
        } else {
          ApiService.setToken(null);
        }
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'ADMIN' || userData.role === 'AUDITOR') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    ApiService.setToken(null);
    setUser(null);
    setActiveTab('home');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        isBootstrapped={isBootstrapped}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '20px' }}>
                <ShieldCheck size={16} color="#34d399" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                  IMMUTABLE & AUDITABLE FINANCIAL ARCHITECTURE
                </span>
              </div>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '18px' }}>
                Money Movement with a <br />
                <span style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Ledger You Can Prove
                </span>
              </h1>
              <p style={{ maxWidth: '680px', margin: '0 auto 28px', color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.6 }}>
                A secure account management platform with role-based access control, structured user onboarding,
                tamper-evident SHA-256 ledger chaining, and resilient PostgreSQL role separation.
              </p>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!user ? (
                  <>
                    <button onClick={() => setActiveTab('auth')} className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                      Get Started / Sign In
                    </button>
                    {!isBootstrapped && (
                      <button onClick={() => setActiveTab('bootstrap')} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem', borderColor: '#f59e0b', color: '#fbbf24' }}>
                        Run Admin Bootstrap &rarr;
                      </button>
                    )}
                  </>
                ) : user.role === 'ADMIN' ? (
                  <button onClick={() => setActiveTab('admin')} className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                    Open Admin Command Center &rarr;
                  </button>
                ) : (
                  <button onClick={() => setActiveTab('dashboard')} className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                    Access Accounts & Ledger &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* Core Capabilities 3-Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '56px' }}>
              <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '18px' }}>
                  <Layers size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Provable Ledger Hash Chaining</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Every financial transaction calculates a deterministic SHA-256 hash incorporating the previous transaction’s block hash. Any data tampering breaks the chain of custody.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '18px' }}>
                  <Lock size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>PostgreSQL Role Separation</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Built to avoid cloud permission pitfalls (Neon SQLSTATE 42501). Operates with dedicated <code className="mono">bootstrap_operator</code> roles and <code className="mono">SECURITY DEFINER</code> procedures.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: '18px' }}>
                  <FileCheck size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Onboarding & Auditability</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Full lifecycle onboarding from registration to admin review. Every authentication event, balance change, and role transition produces a tamper-evident audit log.
                </p>
              </div>
            </div>

            {/* Architecture Details */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Terminal size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Built-In System Health & Readiness</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }} className="mono">
                <div style={{ background: '#0b1120', padding: '14px', borderRadius: '8px', border: '1px solid #1e2e50' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>STORAGE ENGINE:</div>
                  <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                    {systemHealth?.components?.database?.engine || 'PostgreSQL + Resilient Engine'}
                  </div>
                </div>

                <div style={{ background: '#0b1120', padding: '14px', borderRadius: '8px', border: '1px solid #1e2e50' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DISTRIBUTED RATE LIMITER:</div>
                  <div style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600 }}>
                    {systemHealth?.components?.rateLimiter?.mode || 'Redis / High-Speed Fallback'}
                  </div>
                </div>

                <div style={{ background: '#0b1120', padding: '14px', borderRadius: '8px', border: '1px solid #1e2e50' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ADMIN BOOTSTRAP:</div>
                  <div style={{ color: isBootstrapped ? '#34d399' : '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
                    {isBootstrapped ? `INITIALIZED (${adminEmail})` : 'READY TO BOOTSTRAP'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <AuthModal
            onLoginSuccess={handleLoginSuccess}
            onNavigateBootstrap={() => setActiveTab('bootstrap')}
          />
        )}

        {activeTab === 'bootstrap' && (
          <BootstrapWizard
            isBootstrapped={isBootstrapped}
            adminEmail={adminEmail}
            onBootstrapSuccess={(res) => {
              setIsBootstrapped(true);
              setAdminEmail(res.admin.email);
            }}
            onNavigateLogin={() => setActiveTab('auth')}
          />
        )}

        {activeTab === 'dashboard' && user && (
          <Dashboard
            user={user}
            onNavigateOnboarding={() => setActiveTab('onboarding')}
          />
        )}

        {activeTab === 'onboarding' && user && (
          <OnboardingFlow
            user={user}
            onApproved={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'admin' && user && (
          <AdminPortal user={user} />
        )}
      </main>

      <footer style={{ borderTop: '1px solid #1e293b', padding: '24px 0', marginTop: '60px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        <p>BalanceVault &bull; Money movement with a ledger you can prove &bull; Built for Auditable Integrity</p>
      </footer>
    </div>
  );
}

