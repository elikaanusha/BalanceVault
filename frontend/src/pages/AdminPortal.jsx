import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Activity,
  FileCheck,
  RefreshCw,
  Search,
  Check,
  Key,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminPortal({ user }) {
  const [subTab, setSubTab] = useState('overview'); // overview, users, onboarding, ledger, audit
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [onboardingList, setOnboardingList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [ledgerVerification, setLedgerVerification] = useState(null);
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewerNotes, setReviewerNotes] = useState('Verified against incorporation filings. Risk cleared.');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, onboardingData, logsData] = await Promise.all([
        ApiService.getAdminStats(),
        ApiService.getAdminUsers(),
        ApiService.getAdminOnboarding(),
        ApiService.getAuditLogs()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setOnboardingList(onboardingData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleVerifyLedger = async () => {
    setVerifyingLedger(true);
    try {
      const res = await ApiService.verifyLedger();
      setLedgerVerification(res);
    } catch (err) {
      alert('Verification Failed: ' + err.message);
    } finally {
      setVerifyingLedger(false);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await ApiService.updateUserStatus(targetUser.id, nextStatus);
      await fetchAllAdminData();
    } catch (err) {
      alert('Status Change Failed: ' + err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setSubmittingReview(true);
    try {
      await ApiService.reviewOnboarding(reviewingItem.id, reviewDecision, reviewerNotes);
      setReviewingItem(null);
      await fetchAllAdminData();
    } catch (err) {
      alert('Review Action Failed: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Admin & Audit Command Center</h1>
            <span className="badge badge-rose">RESTRICTED ROLE: {user?.role}</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Provable financial movements, account holder lifecycle management, and cryptographic audit ledger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleVerifyLedger} disabled={verifyingLedger} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            <span>{verifyingLedger ? 'Verifying Hashes...' : 'Verify Ledger Cryptographic Proof'}</span>
          </button>
          <button onClick={fetchAllAdminData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '28px', overflowX: 'auto' }}>
        {[
          { key: 'overview', label: 'Platform Metrics', icon: Activity },
          { key: 'onboarding', label: `Onboarding Queue (${onboardingList.filter(o => o.status === 'SUBMITTED').length})`, icon: FileCheck },
          { key: 'users', label: `User Management (${users.length})`, icon: Users },
          { key: 'ledger', label: 'Provable Ledger Explorer', icon: Layers },
          { key: 'audit', label: `Audit Log Trail (${auditLogs.length})`, icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#34d399' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: isActive ? '1px solid #334155' : '1px solid transparent'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Ledger Verification Proof Modal / Banner */}
      {ledgerVerification && (
        <div style={{
          background: ledgerVerification.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${ledgerVerification.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={28} color={ledgerVerification.isValid ? '#34d399' : '#fb7185'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: ledgerVerification.isValid ? '#34d399' : '#fb7185' }}>
                  {ledgerVerification.isValid ? 'CRYPTOGRAPHIC LEDGER INTEGRITY: VERIFIED' : 'TAMPER ALERT: COMPROMISED BLOCKS DETECTED'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{ledgerVerification.message}</div>
              </div>
            </div>
            <button onClick={() => setLedgerVerification(null)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              Dismiss
            </button>
          </div>
          <div className="mono" style={{ marginTop: '14px', background: '#0b1120', padding: '12px', borderRadius: '8px', fontSize: '0.775rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px' }}>
            <span style={{ color: '#64748b' }}>TOTAL_CHAIN_LENGTH:</span>
            <span>{ledgerVerification.chainLength} Blocks</span>
            <span style={{ color: '#64748b' }}>GENESIS_BLOCK:</span>
            <span style={{ color: '#94a3b8' }}>{ledgerVerification.genesisHash}</span>
            <span style={{ color: '#10b981' }}>HEAD_BLOCK_HASH:</span>
            <span style={{ color: '#34d399', wordBreak: 'break-all' }}>{ledgerVerification.headHash}</span>
          </div>
        </div>
      )}

      {/* SUBTAB 1: OVERVIEW METRICS */}
      {subTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>TOTAL USERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.metrics?.totalUsers || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>{stats?.metrics?.activeUsers || 0} Active</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>PENDING ONBOARDING</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{stats?.metrics?.pendingOnboarding || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Awaiting Review</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>LEDGER TRANSACTIONS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.metrics?.totalTransactions || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>SHA-256 Chained Blocks</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>TOTAL TRANSACTED VOLUME</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
                ${(stats?.metrics?.totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>USD Inflow / Movement</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>AUDIT LOG CHECKSUMS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.metrics?.totalAuditLogs || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '4px' }}>Immutable Records</div>
            </div>
          </div>

          {/* Architecture & RBAC overview */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>Security & RBAC Architecture</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e50' }}>
                <div style={{ fontWeight: 700, color: '#fb7185', marginBottom: '4px' }}>ADMIN Role</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Full administrative capabilities: user lifecycle, onboarding approval, rate limit configuration, and audit verification.
                </div>
              </div>

              <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e50' }}>
                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>AUDITOR Role</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Cryptographic read-only access to transaction ledgers, checksum chains, and immutable security audit logs.
                </div>
              </div>

              <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e50' }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>ACCOUNT_HOLDER Role</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Client money movements, deposits, peer-to-peer transfers, and self-service account creation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ONBOARDING QUEUE */}
      {subTab === 'onboarding' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Account Holder Onboarding Applications</h3>
          {onboardingList.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>No onboarding applications found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 16px' }}>Applicant</th>
                    <th style={{ padding: '12px 16px' }}>Business / Entity</th>
                    <th style={{ padding: '12px 16px' }}>Doc Type / ID</th>
                    <th style={{ padding: '12px 16px' }}>Submitted Date</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {onboardingList.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #141e33' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{req.user?.fullName || req.userId}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.user?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{req.businessName || 'Individual Account'}</td>
                      <td style={{ padding: '12px 16px' }} className="mono">
                        <div>{req.documentType}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.registrationNumber || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${req.status === 'APPROVED' ? 'badge-emerald' : req.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {req.status === 'SUBMITTED' ? (
                          <button
                            onClick={() => setReviewingItem(req)}
                            className="btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Decided by {req.reviewedBy || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: USER MANAGEMENT */}
      {subTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Platform Users & Role Assignments</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>User Details</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Accounts Count</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Created</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Lifecycle Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #141e33' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }} className="mono">{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-rose' : u.role === 'AUDITOR' ? 'badge-amber' : 'badge-emerald'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.accounts?.length || 0} Account(s)
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-emerald' : u.status === 'SUSPENDED' ? 'badge-rose' : 'badge-amber'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={u.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PROVABLE LEDGER EXPLORER */}
      {subTab === 'ledger' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cryptographic Provable Ledger Chain</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Mathematical SHA-256 hash chaining of every money movement operation
              </p>
            </div>
            <button onClick={handleVerifyLedger} disabled={verifyingLedger} className="btn-primary" style={{ padding: '8px 16px' }}>
              {verifyingLedger ? 'Recalculating Proofs...' : 'Run Cryptographic Audit'}
            </button>
          </div>

          <div style={{ background: '#080d1a', border: '1px solid #141e33', borderRadius: '10px', padding: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>
              GENESIS BLOCK POINTER &rarr; <span className="mono" style={{ color: '#10b981' }}>00000000000000000000000000000000</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6 }}>
              Every transaction computes its block hash as: <br />
              <code className="mono" style={{ color: '#38bdf8' }}>
                SHA-256(previousHash | fromAccountId | toAccountId | amount | currency | type | reference | timestamp)
              </code>
              <br />
              Any retrospective modification of amounts, balances, or references immediately invalidates the entire subsequent chain.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 5: AUDIT LOG TRAIL */}
      {subTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tamper-Evident Immutable Audit Trail</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                System events recorded with SHA-256 integrity checksums
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 14px' }}>Timestamp</th>
                  <th style={{ padding: '10px 14px' }}>Actor Role</th>
                  <th style={{ padding: '10px 14px' }}>Action</th>
                  <th style={{ padding: '10px 14px' }}>Entity</th>
                  <th style={{ padding: '10px 14px' }}>Integrity Checksum (SHA-256)</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #141e33' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.775rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }} className="mono">
                      {log.entityType}
                    </td>
                    <td style={{ padding: '10px 14px' }} className="mono">
                      <span style={{ color: '#10b981', fontSize: '0.75rem' }}>
                        {log.checksum?.substring(0, 16)}...{log.checksum?.substring(48)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Review Onboarding Application</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '18px' }}>
              Applicant: <strong>{reviewingItem.user?.fullName || reviewingItem.userId}</strong> ({reviewingItem.businessName})
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Administrative Decision
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: reviewDecision === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                      border: `1px solid ${reviewDecision === 'APPROVED' ? '#10b981' : '#334155'}`,
                      color: reviewDecision === 'APPROVED' ? '#34d399' : '#94a3b8',
                      fontWeight: 600
                    }}
                  >
                    APPROVE & PROVISION
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('REJECTED')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: reviewDecision === 'REJECTED' ? 'rgba(244, 63, 94, 0.2)' : '#1e293b',
                      border: `1px solid ${reviewDecision === 'REJECTED' ? '#f43f5e' : '#334155'}`,
                      color: reviewDecision === 'REJECTED' ? '#fb7185' : '#94a3b8',
                      fontWeight: 600
                    }}
                  >
                    REJECT
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Reviewer Notes / Compliance Feedback
                </label>
                <textarea
                  rows="3"
                  required
                  className="input-control"
                  value={reviewerNotes}
                  onChange={e => setReviewerNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setReviewingItem(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingReview} className="btn-primary">
                  {submittingReview ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

