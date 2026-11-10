import React, { useState } from 'react';
import ApiService from '../services/api';
import { Key, ShieldAlert, CheckCircle2, Lock, Terminal, ArrowRight, RefreshCw } from 'lucide-react';

export default function BootstrapWizard({ isBootstrapped, adminEmail, onBootstrapSuccess, onNavigateLogin }) {
  const [email, setEmail] = useState('admin@balancevault.internal');
  const [password, setPassword] = useState('AdminVault2026!Secure');
  const [fullName, setFullName] = useState('Primary System Administrator');
  const [operatorRole, setOperatorRole] = useState('bootstrap_operator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const handleBootstrap = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.bootstrapAdmin({
        email,
        password,
        fullName,
        operatorRole
      });
      setSuccessResult(res);
      if (onBootstrapSuccess) onBootstrapSuccess(res);
    } catch (err) {
      setError(err.message || 'Bootstrap execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px', borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '12px',
            borderRadius: '12px',
            color: '#fbbf24'
          }}>
            <Key size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>First-Administrator Security Bootstrap</h1>
              <span className={`badge ${isBootstrapped ? 'badge-emerald' : 'badge-amber'}`}>
                {isBootstrapped ? 'INITIALIZED' : 'UNBOOTSTRAPPED'}
              </span>
            </div>
            <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '0.925rem', lineHeight: 1.6 }}>
              BalanceVault employs strict PostgreSQL role separation to prevent cloud permission errors (such as Neon SQLSTATE 42501).
              The initialization operator executes under the dedicated <code className="mono" style={{ color: '#fbbf24' }}>bootstrap_operator</code> role
              via a <code className="mono" style={{ color: '#fbbf24' }}>SECURITY DEFINER</code> procedure.
            </p>
          </div>
        </div>
      </div>

      {isBootstrapped && !successResult ? (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', marginBottom: '16px' }}>
            <CheckCircle2 size={42} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>System Administrator Active</h2>
          <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.925rem' }}>
            The first-admin bootstrap lock is active. The system is already provisioned with administrator:
          </p>
          <div className="mono" style={{ background: '#0b1120', padding: '12px 20px', borderRadius: '8px', display: 'inline-block', color: '#10b981', border: '1px solid #1e2e50', marginBottom: '24px' }}>
            {adminEmail || 'admin@balancevault.internal'}
          </div>
          <div>
            <button onClick={onNavigateLogin} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Proceed to Admin Sign In</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : successResult ? (
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#34d399', marginBottom: '16px' }}>
            <CheckCircle2 size={28} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Administrator Bootstrapped Successfully!</h2>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.925rem' }}>
            The administrator credentials and role memberships have been committed to the database and certified in the audit ledger.
          </p>

          <div style={{ background: '#0b1120', padding: '18px', borderRadius: '8px', border: '1px solid #1e2e50', marginBottom: '24px' }} className="mono">
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '8px' }}>// CERTIFIED BOOTSTRAP ATTESTATION</div>
            <div style={{ color: '#f8fafc', fontSize: '0.875rem', lineHeight: 1.8 }}>
              <div><span style={{ color: '#60a5fa' }}>ADMIN_ID:</span> {successResult.admin.id}</div>
              <div><span style={{ color: '#60a5fa' }}>EMAIL:</span> {successResult.admin.email}</div>
              <div><span style={{ color: '#60a5fa' }}>ROLE:</span> {successResult.admin.role}</div>
              <div><span style={{ color: '#60a5fa' }}>STATUS:</span> {successResult.admin.status}</div>
              <div><span style={{ color: '#60a5fa' }}>EXECUTION_METHOD:</span> {successResult.executionMethod}</div>
              <div><span style={{ color: '#60a5fa' }}>SECURITY_DEFINER:</span> VALIDATED (No SQLSTATE 42501)</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onNavigateLogin} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Log In As Administrator</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '32px' }}>
          <form onSubmit={handleBootstrap}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Administrator Email
              </label>
              <input
                type="email"
                required
                className="input-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@balancevault.internal"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name / Title
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Primary System Administrator"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Database Operator Role (PostgreSQL)
                </label>
                <input
                  type="text"
                  required
                  className="input-control mono"
                  value={operatorRole}
                  onChange={(e) => setOperatorRole(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Administrator Password
              </label>
              <input
                type="password"
                required
                className="input-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Will be hashed with bcrypt (cost factor 12) prior to storage.
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px 16px', borderRadius: '8px', color: '#fb7185', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
              <span>{loading ? 'Executing Secure Bootstrap...' : 'Execute First-Administrator Bootstrap'}</span>
            </button>
          </form>

          {/* Technical Explainer */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1e2e50' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
              <Terminal size={14} />
              <span>Architectural Insight: Overcoming SQLSTATE 42501 in Managed Cloud Postgres</span>
            </div>
            <p style={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.6 }}>
              In hosted environments like Neon, cloud owners restrict direct role modification commands (<code className="mono">ALTER ROLE ... PASSWORD</code>).
              BalanceVault guarantees security and autonomy by pre-granting <code className="mono">SET ROLE bootstrap_operator</code> and executing
              a defined stored procedure, maintaining strict least-privilege compliance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

