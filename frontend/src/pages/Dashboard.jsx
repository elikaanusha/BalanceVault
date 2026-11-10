import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Hash,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Send,
  Download
} from 'lucide-react';

export default function Dashboard({ user, onNavigateOnboarding }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);
  const [ledger, setLedger] = useState([]);

  // Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositRef, setDepositRef] = useState('External Bank Transfer');
  const [depositLoading, setDepositLoading] = useState(false);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('150');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [transferRef, setTransferRef] = useState('Invoice Payment');
  const [transferLoading, setTransferLoading] = useState(false);

  // New Account Modal State
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState('SAVINGS');

  const loadData = async () => {
    setLoading(true);
    try {
      const accs = await ApiService.getAccounts();
      setAccounts(accs);
      if (accs.length > 0) {
        const current = activeAccount ? accs.find(a => a.id === activeAccount.id) || accs[0] : accs[0];
        setActiveAccount(current);
        loadLedger(current.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (accId) => {
    try {
      const data = await ApiService.getAccountLedger(accId);
      setLedger(data.transactions || []);
    } catch (err) {
      console.error('Ledger fetch error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!activeAccount) return;
    setDepositLoading(true);
    try {
      await ApiService.deposit({
        accountId: activeAccount.id,
        amount: parseFloat(depositAmount),
        reference: depositRef
      });
      setShowDepositModal(false);
      await loadData();
    } catch (err) {
      alert('Deposit Failed: ' + err.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!activeAccount) return;
    setTransferLoading(true);
    try {
      await ApiService.transfer({
        fromAccountId: activeAccount.id,
        toAccountId: targetAccountId,
        amount: parseFloat(transferAmount),
        reference: transferRef
      });
      setShowTransferModal(false);
      await loadData();
    } catch (err) {
      alert('Transfer Failed: ' + err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await ApiService.createAccount({ accountType: newAccountType });
      setShowNewAccountModal(false);
      await loadData();
    } catch (err) {
      alert('Account Creation Failed: ' + err.message);
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <p>Loading accounts and provable ledger state...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '30px auto', padding: '0 24px' }}>
      {/* Onboarding Notice for Pending Users */}
      {user?.status === 'PENDING_ONBOARDING' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertCircle size={24} color="#fbbf24" />
            <div>
              <div style={{ fontWeight: 700, color: '#fef3c7' }}>Identity Onboarding Pending</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Your account is in sandbox preview mode. Submit KYC onboarding verification to unlock full money movement capabilities.
              </div>
            </div>
          </div>
          <button onClick={onNavigateOnboarding} className="btn-primary" style={{ background: '#f59e0b', fontSize: '0.85rem' }}>
            Complete KYC Onboarding &rarr;
          </button>
        </div>
      )}

      {/* Account Cards Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Financial Accounts & Balances</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Managed multi-role accounts with real-time provable ledger records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowDepositModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Download size={16} />
            <span>Deposit Funds</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Send size={16} />
            <span>Transfer Money</span>
          </button>
          <button
            onClick={() => setShowNewAccountModal(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <PlusCircle size={16} />
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {accounts.map(acc => {
          const isSelected = activeAccount?.id === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => { setActiveAccount(acc); loadLedger(acc.id); }}
              className="glass-card"
              style={{
                padding: '24px',
                cursor: 'pointer',
                borderColor: isSelected ? '#10b981' : '#1e2e50',
                background: isSelected ? 'rgba(19, 29, 53, 0.95)' : '#131d35',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)'
                }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>{acc.accountType}</span>
                  <div className="mono" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{acc.accountNumber}</div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#10b981'
                }}>
                  <Wallet size={20} />
                </div>
              </div>

              <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>{acc.currency}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Status: <strong style={{ color: '#34d399' }}>{acc.status}</strong></span>
                <span>Created: {new Date(acc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provable Ledger Transactions View */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Provable Ledger Transactions</h2>
              <span className="badge badge-emerald">SHA-256 HASH CHAIN</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
              Every transaction is cryptographically linked to the preceding block hash, guaranteeing tamper evidence.
            </p>
          </div>
          <button
            onClick={() => activeAccount && loadLedger(activeAccount.id)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {ledger.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No transactions recorded for this account yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Make a deposit or transfer to generate your first provable ledger block.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ledger.map((tx, idx) => {
              const isDeposit = tx.type === 'DEPOSIT';
              const isOutflow = tx.fromAccountId === activeAccount?.id;

              return (
                <div
                  key={tx.id}
                  style={{
                    background: '#0b1120',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: isDeposit ? 'rgba(16, 185, 129, 0.15)' : isOutflow ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: isDeposit ? '#34d399' : isOutflow ? '#fb7185' : '#60a5fa'
                      }}>
                        {isDeposit ? <Download size={18} /> : isOutflow ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {tx.type} — {tx.reference || 'Standard Ledger Movement'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(tx.timestamp).toLocaleString()} &bull; TX ID: {tx.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: isDeposit ? '#34d399' : isOutflow ? '#fb7185' : '#34d399'
                      }}>
                        {isOutflow ? '-' : '+'}${tx.amount.toFixed(2)} {tx.currency}
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        {tx.status}
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Hash Chaining Proof Bar */}
                  <div style={{
                    background: '#080d19',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '8px 16px',
                    border: '1px solid #141e33'
                  }} className="mono">
                    <span style={{ color: '#64748b' }}>PREV_HASH:</span>
                    <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>{tx.previousHash}</span>
                    <span style={{ color: '#10b981' }}>BLOCK_HASH:</span>
                    <span style={{ color: '#34d399', wordBreak: 'break-all', fontWeight: 600 }}>{tx.ledgerHash}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
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
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Deposit Funds</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Funds will be deposited into <strong className="mono">{activeAccount?.accountNumber}</strong> and sealed in the provable ledger.
            </p>
            <form onSubmit={handleDeposit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  className="input-control"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Reference Description
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={depositRef}
                  onChange={e => setDepositRef(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={depositLoading} className="btn-primary">
                  {depositLoading ? 'Chaining Block...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
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
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Transfer Money</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Transfer from <strong className="mono">{activeAccount?.accountNumber}</strong> (Available: ${activeAccount?.balance.toFixed(2)})
            </p>
            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Destination Account ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. paste recipient Account ID"
                  className="input-control mono"
                  value={targetAccountId}
                  onChange={e => setTargetAccountId(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Transfer Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  max={activeAccount?.balance}
                  className="input-control"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Memo / Purpose
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={transferRef}
                  onChange={e => setTransferRef(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={transferLoading} className="btn-primary">
                  {transferLoading ? 'Executing Transfer...' : 'Send Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showNewAccountModal && (
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
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Open New Account</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Select account type to instantiate in the BalanceVault ledger.
            </p>
            <form onSubmit={handleCreateAccount}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Account Type
                </label>
                <select
                  className="input-control"
                  value={newAccountType}
                  onChange={e => setNewAccountType(e.target.value)}
                >
                  <option value="CHECKING">CHECKING (Daily Operational Movements)</option>
                  <option value="SAVINGS">SAVINGS (Interest Bearing Reserve)</option>
                  <option value="ESCROW">ESCROW (Secured Conditional Holding)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewAccountModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

