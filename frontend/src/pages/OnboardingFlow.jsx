import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { FileCheck, Shield, AlertCircle, CheckCircle2, Clock, ArrowRight, Building2, FileText } from 'lucide-react';

export default function OnboardingFlow({ user, onApproved }) {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getOnboardingStatus();
      setStatusData(data);
      if (data.onboarding && data.onboarding.businessName) {
        setBusinessName(data.onboarding.businessName);
        setRegistrationNumber(data.onboarding.registrationNumber || '');
        setDocumentType(data.onboarding.documentType || 'PASSPORT');
        setNotes(data.onboarding.notes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await ApiService.submitOnboarding({
        businessName,
        registrationNumber,
        documentType,
        notes
      });
      setMessage({ type: 'success', text: 'Onboarding application successfully submitted for administrative review.' });
      await fetchStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus = statusData?.onboarding?.status || 'NOT_SUBMITTED';

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px', borderLeft: '4px solid #10b981' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '12px',
            borderRadius: '12px',
            color: '#34d399'
          }}>
            <FileCheck size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Account Holder Onboarding & KYC</h1>
              <span className={`badge ${currentStatus === 'APPROVED' ? 'badge-emerald' : currentStatus === 'SUBMITTED' ? 'badge-amber' : 'badge-blue'}`}>
                {currentStatus}
              </span>
            </div>
            <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Compliant financial ledger operations require structured identity verification. Once approved by a platform administrator,
              your primary operational checking account is provisioned with verified access control.
            </p>
          </div>
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              1
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Registration</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>COMPLETED</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: currentStatus !== 'NOT_SUBMITTED' ? '#10b981' : '#334155',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              2
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>KYC Submission</span>
            <span className={`badge ${currentStatus !== 'NOT_SUBMITTED' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
              {currentStatus !== 'NOT_SUBMITTED' ? 'SUBMITTED' : 'REQUIRED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: currentStatus === 'APPROVED' ? '#10b981' : '#334155',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              3
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Admin Verification</span>
            <span className={`badge ${currentStatus === 'APPROVED' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
              {currentStatus === 'APPROVED' ? 'APPROVED' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Card */}
      {currentStatus === 'APPROVED' ? (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', marginBottom: '16px' }}>
            <CheckCircle2 size={44} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>Identity & Account Verified</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', marginBottom: '20px' }}>
            Your account is fully cleared for auditable money movements, deposits, and inter-account transfers.
          </p>
          <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e50', display: 'inline-block', textAlign: 'left', minWidth: '320px' }} className="mono">
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '6px' }}>ATTESTATION RECORD:</div>
            <div style={{ fontSize: '0.85rem' }}><strong>Business:</strong> {statusData?.onboarding?.businessName}</div>
            <div style={{ fontSize: '0.85rem' }}><strong>Doc Type:</strong> {statusData?.onboarding?.documentType}</div>
            <div style={{ fontSize: '0.85rem' }}><strong>Reviewed By:</strong> {statusData?.onboarding?.reviewedBy || 'admin@balancevault.internal'}</div>
            <div style={{ fontSize: '0.85rem', color: '#10b981' }}><strong>Notes:</strong> {statusData?.onboarding?.reviewerNotes || 'Full compliance clearance granted.'}</div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '32px' }}>
          {message && (
            <div style={{
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              padding: '12px 16px',
              borderRadius: '8px',
              color: message.type === 'success' ? '#34d399' : '#fb7185',
              marginBottom: '20px',
              fontSize: '0.875rem'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Legal Business / Entity Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ paddingLeft: '38px' }}
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Capital Partners LLC"
                />
                <Building2 size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Entity / Tax ID Number
                </label>
                <input
                  type="text"
                  required
                  className="input-control mono"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. EIN-88-29401"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Verification Document Type
                </label>
                <select
                  className="input-control"
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                >
                  <option value="PASSPORT">Government Passport</option>
                  <option value="NATIONAL_ID">National Identity Card</option>
                  <option value="CERTIFICATE_OF_INCORPORATION">Certificate of Incorporation</option>
                  <option value="TAX_IDENTIFICATION_PROOF">Tax Identification Document</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Operational Notes / Proof of Funds Documentation
              </label>
              <textarea
                rows="3"
                className="input-control"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Briefly state intended transaction volume and account jurisdiction..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>{submitting ? 'Submitting Application...' : 'Submit Verification Application'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

