// src/pages/frontoffice/SalaryRespondPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ProposalData {
  id: string;
  recipientName: string;
  senderName: string;
  businessName: string;
  proposedAmount: number;
  counterAmount: number | null;
  currency: string;
  message: string | null;
  responseNote: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  createdAt: string;
  respondedAt: string | null;
}

type Action = 'ACCEPT' | 'REJECT' | 'COUNTER' | null;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency }).format(amount);

const STATUS_CONFIG = {
  ACCEPTED:  { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: '✅', label: 'Accepted' },
  REJECTED:  { color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: '❌', label: 'Rejected' },
  COUNTERED: { color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: '🔄', label: 'Counter-Offered' },
  PENDING:   { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '⏳', label: 'Pending' },
};

// ─── Already Responded Screen ──────────────────────────────────────────────────
const AlreadyResponded = ({ proposal }: { proposal: ProposalData }) => {
  const cfg = STATUS_CONFIG[proposal.status];
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{cfg.icon}</div>
      <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 22 }}>
        Already Responded
      </h2>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 15 }}>
        You already responded to this proposal.
      </p>
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 12, padding: '16px 24px', display: 'inline-block',
      }}>
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: 15 }}>
          {cfg.icon} {cfg.label}
        </span>
        {proposal.counterAmount && (
          <div style={{ color: cfg.color, fontSize: 14, marginTop: 6 }}>
            Counter offer: {formatCurrency(proposal.counterAmount, proposal.currency)}
          </div>
        )}
        {proposal.responseNote && (
          <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
            "{proposal.responseNote}"
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SalaryRespondPage() {
  const { token } = useParams<{ token: string }>();

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [action, setAction]           = useState<Action>(null);
  const [counterAmount, setCounter]   = useState('');
  const [note, setNote]               = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load proposal ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    axiosInstance
      .get(`/salary/respond/${token}`)
      .then((r) => setProposal(r.data))
      .catch(() => setError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Submit response ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!action) return;
    if (action === 'COUNTER') {
      const parsed = parseFloat(counterAmount);
      if (!counterAmount || isNaN(parsed) || parsed <= 0) {
        setSubmitError('Please enter a valid counter amount.');
        return;
      }
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await axiosInstance.post(`/salary/respond/${token}`, {
        action,
        counterAmount: action === 'COUNTER' ? parseFloat(counterAmount) : undefined,
        note: note || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'white', borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 32 }}>💰</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
              Salary Proposal
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
              BizManage · Review &amp; Respond
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 40, height: 40, border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
              }} />
              <p style={{ color: '#64748b', margin: 0 }}>Loading proposal...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Invalid Link</h3>
              <p style={{ color: '#64748b', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Already responded */}
          {!loading && !error && proposal && proposal.status !== 'PENDING' && (
            <AlreadyResponded proposal={proposal} />
          )}

          {/* Success screen */}
          {!loading && !error && submitted && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>
                {action === 'ACCEPT' ? '✅' : action === 'REJECT' ? '❌' : '🔄'}
              </div>
              <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 20 }}>
                Response Sent!
              </h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
                {proposal?.senderName} from {proposal?.businessName} has been notified.
              </p>
            </div>
          )}

          {/* Main form */}
          {!loading && !error && !submitted && proposal && proposal.status === 'PENDING' && (
            <>
              {/* Proposal details */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: 13 }}>
                  From <strong style={{ color: '#1e293b' }}>{proposal.senderName}</strong> at{' '}
                  <strong style={{ color: '#1e293b' }}>{proposal.businessName}</strong>
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                  Sent on {new Date(proposal.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>

              {/* Amount box */}
              <div style={{
                background: '#f0f7ff', border: '2px solid #2563eb',
                borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Proposed Monthly Salary
                </div>
                <div style={{ fontSize: 38, fontWeight: 800, color: '#1e3a5f', marginTop: 6 }}>
                  {formatCurrency(proposal.proposedAmount, proposal.currency)}
                </div>
              </div>

              {/* Manager message */}
              {proposal.message && (
                <div style={{
                  background: '#f8fafc', borderLeft: '4px solid #2563eb',
                  borderRadius: '0 8px 8px 0', padding: '12px 16px',
                  marginBottom: 24, color: '#475569', fontSize: 14, lineHeight: 1.6,
                }}>
                  <strong>Message:</strong> {proposal.message}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                  Your Response *
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {([
                    { key: 'ACCEPT', label: '✅ Accept',        color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
                    { key: 'REJECT', label: '❌ Reject',        color: '#dc2626', bg: '#fee2e2', border: '#dc2626' },
                    { key: 'COUNTER', label: '🔄 Counter',      color: '#d97706', bg: '#fef3c7', border: '#d97706' },
                  ] as const).map(({ key, label, color, bg, border }) => (
                    <button
                      key={key}
                      onClick={() => { setAction(key); setSubmitError(null); }}
                      style={{
                        flex: 1, padding: '11px 6px', borderRadius: 9,
                        border: `2px solid ${action === key ? border : '#e2e8f0'}`,
                        background: action === key ? bg : 'white',
                        color: action === key ? color : '#64748b',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Counter amount input */}
              {action === 'COUNTER' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    Your Counter Offer *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter your proposed amount..."
                    value={counterAmount}
                    onChange={(e) => setCounter(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 8,
                      border: '1.5px solid #d97706', fontSize: 15,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Note */}
              {action && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    Note to Manager (optional)
                  </label>
                  <textarea
                    placeholder="Add a message to accompany your response..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', fontSize: 14,
                      resize: 'vertical', outline: 'none',
                      boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>
              )}

              {/* Error */}
              {submitError && (
                <div style={{
                  background: '#fee2e2', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '10px 14px',
                  color: '#dc2626', fontSize: 13, marginBottom: 16,
                }}>
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!action || submitting}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10,
                  background: !action || submitting
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                  border: 'none', color: 'white', fontWeight: 700,
                  fontSize: 15, cursor: !action || submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.2s',
                }}
              >
                {submitting ? (
                  <>
                    <span style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite', display: 'inline-block',
                    }} />
                    Sending...
                  </>
                ) : (
                  'Submit Response →'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
