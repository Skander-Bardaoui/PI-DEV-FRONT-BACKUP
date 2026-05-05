// src/components/treasury/SalaryToPayPage.tsx
import React, { useEffect, useState, useContext } from 'react';
import { salaryApi, SalaryMember } from '../../api/salary.api';
import { AuthContext } from '../../context/AuthContext';
import { getMyBusinesses } from '../../api/business.api';
import axiosInstance from '../../api/axiosInstance';
import SendSalarycomponent from './SendSalarycomponent';
import { SummaryCardSkeleton, MemberCardSkeleton } from './SkeletonLoaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface BusinessMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  salary_permissions?: {
    create_salary: boolean;
    update_salary: boolean;
    delete_salary: boolean;
    send_proposal: boolean;
    pay_salary: boolean;
  };
  is_active: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ProposalState {
  memberId: string;
  amount: string;
  currency: string;
  message: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'PAID';

interface ProposalInfo {
  status: ProposalStatus;
  proposedAmount: number;
  counterAmount: number | null;
  currency: string;
  respondedAt: string | null;
}

async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

async function fetchBusinessMembers(businessId: string): Promise<BusinessMember[]> {
  const res = await fetch(`${API_URL}/businesses/${businessId}/members`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch members');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.members || []);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (m: SalaryMember) => {
  const f = m.user.firstName?.[0] ?? '';
  const l = m.user.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || m.user.email[0].toUpperCase();
};

const getFullName = (m: SalaryMember) => {
  const name = `${m.user.firstName ?? ''} ${m.user.lastName ?? ''}`.trim();
  return name || m.user.email;
};

const ROLE_COLORS: Record<string, string> = {
  BUSINESS_OWNER: '#7c3aed',
  BUSINESS_ADMIN: '#2563eb',
  ACCOUNTANT:     '#0891b2',
  TEAM_MEMBER:    '#16a34a',
  CLIENT:         '#d97706',
  SUPPLIER:       '#db2777',
};
const getRoleColor = (role: string) => ROLE_COLORS[role] ?? '#64748b';

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#6366f1',
];
const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const STATUS_CONFIG: Record<ProposalStatus, { color: string; bg: string; border: string; icon: string; label: string }> = {
  PENDING:   { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '⏳', label: 'Awaiting Response' },
  ACCEPTED:  { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: '✅', label: 'Accepted'          },
  REJECTED:  { color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: '❌', label: 'Rejected'          },
  COUNTERED: { color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: '🔄', label: 'Counter-Offered'   },
  PAID:      { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '💸', label: 'Paid'              },
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency }).format(amount);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ member }: { member: SalaryMember }) => {
  const color = getAvatarColor(member.userId);
  if (member.user.avatarUrl) {
    return (
      <img src={member.user.avatarUrl} alt={getFullName(member)}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
      />
    );
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%', background: color, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 16, flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)',
    }}>
      {getInitials(member)}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const ProposalStatusBadge = ({ info }: { info: ProposalInfo }) => {
  const cfg = STATUS_CONFIG[info.status];
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: 12 }}>
          {cfg.icon} {cfg.label}
        </span>
        {info.respondedAt && (
          <span style={{ color: '#94a3b8', fontSize: 11 }}>
            {new Date(info.respondedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
        Proposed: {formatCurrency(info.proposedAmount, info.currency)}
        {info.counterAmount && (
          <span style={{ color: cfg.color, marginLeft: 8, fontWeight: 600 }}>
            → Counter: {formatCurrency(info.counterAmount, info.currency)}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  member: SalaryMember;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const ProposalModal = ({ member, businessId, businessName, onClose, onSuccess, onError }: ModalProps) => {
  const [form, setForm] = useState<ProposalState>({ memberId: member.userId, amount: '', currency: 'TND', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(form.amount);
    if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0) { onError('Please enter a valid amount'); return; }
    setLoading(true);
    try {
      await salaryApi.sendProposal(businessId, {
        userId: member.userId, amount: parsedAmount,
        currency: form.currency, message: form.message || '', businessName,
      });
      onSuccess(`Salary proposal sent to ${getFullName(member)}!`);
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.message ?? 'Failed to send proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.22s ease' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', borderRadius: '16px 16px 0 0', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar member={member} />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>{getFullName(member)}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>{member.user.jobTitle || member.user.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '28px 28px 24px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Proposed Monthly Salary *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                style={{ flex: 1, padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 15, outline: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                style={{ padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, background: 'white', cursor: 'pointer', outline: 'none', minWidth: 80 }}>
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Message (optional)</label>
            <textarea placeholder="Add context, notes, or a personal message..." value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
          </div>
          <div style={{ background: '#f0f7ff', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>📧</span>
            <p style={{ margin: 0, fontSize: 13, color: '#3b5fc0', lineHeight: 1.5 }}>
              An email will be sent to <strong>{member.user.email}</strong> with a link to respond.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px 0', borderRadius: 8, background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Sending...</> : <>✉️ Send Proposal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalaryToPayPage() {
  const authCtx = useContext(AuthContext);
  const user = authCtx?.user;

  const [businessId, setBusinessId]     = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('Your Company');
  const [members, setMembers]           = useState<SalaryMember[]>([]);
  const [proposalMap, setProposalMap]   = useState<Record<string, ProposalInfo>>({});
  const [loading, setLoading]           = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [selectedMember, setSelectedMember] = useState<SalaryMember | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [currentUser, setCurrentUser]   = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<BusinessMember | null>(null);

  // Load current user and member on mount
  useEffect(() => {
    async function loadUserData() {
      if (!businessId) return;
      
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        
        const members = await fetchBusinessMembers(businessId);
        const member = members.find(m => m.user_id === user.id);
        setCurrentMember(member || null);
        
        // Debug log
        console.log('salary_permissions:', member?.salary_permissions);
      } catch (err: any) {
        console.error('Failed to load user data:', err);
      }
    }
    loadUserData();
  }, [businessId]);

  // Show skeleton for minimum 2 seconds
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Permission checks
  const isOwner = currentUser?.role === 'BUSINESS_OWNER';
  const salary = currentMember?.salary_permissions;
  
  const canSendProposal = isOwner || salary?.send_proposal === true;

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadData = (bizId: string) =>
    Promise.all([
      salaryApi.getMembers(bizId),
      axiosInstance.get(`/salary/${bizId}/proposal-statuses`),
    ]).then(([membersData, statusRes]) => {
      setMembers(membersData);
      const raw: Record<string, any> = statusRes.data;
      const map: Record<string, ProposalInfo> = {};
      for (const [userId, p] of Object.entries(raw)) {
        map[userId] = {
          status: p.status,
          proposedAmount: Number(p.proposed_amount),
          counterAmount: p.counter_amount ? Number(p.counter_amount) : null,
          currency: p.currency,
          respondedAt: p.responded_at,
        };
      }
      setProposalMap(map);
      setError(null);
    });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMyBusinesses()
      .then((businesses: any[]) => {
        if (businesses.length === 0) { setError('No business found.'); setLoading(false); return; }
        const biz = businesses[0];
        setBusinessId(biz.id);
        setBusinessName(biz.name ?? 'Your Company');
        return loadData(biz.id);
      })
      .catch(() => setError('Failed to load team members.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleProposalSuccess = (msg: string) => {
    addToast('success', msg);
    if (businessId) loadData(businessId);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return getFullName(m).toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q) ||
      (m.user.jobTitle ?? '').toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  const isDisplayLoading = loading || showSkeleton;

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .member-card:hover { 
          background:#f8faff !important; 
          transform:translateY(-2px); 
          box-shadow:0 8px 24px rgba(37,99,235,0.12) !important; 
          border-color: #bfdbfe !important;
        }
        .member-card { transition:all 0.2s ease !important; }
        .propose-btn:hover { 
          background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%) !important; 
          color:white !important; 
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3) !important;
        }
        .propose-btn { transition:all 0.15s ease !important; }
      `}</style>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ padding: '12px 18px', borderRadius: 10, background: t.type === 'success' ? '#16a34a' : '#dc2626', color: 'white', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', animation: 'fadeIn 0.25s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{t.type === 'success' ? '✅' : '❌'}</span>{t.message}
          </div>
        ))}
      </div>

      {selectedMember && (
        <ProposalModal member={selectedMember} businessId={businessId} businessName={businessName}
          onClose={() => setSelectedMember(null)} onSuccess={handleProposalSuccess} onError={(msg) => addToast('error', msg)} />
      )}

      <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💰</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Salary Management</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Send salary proposals to your team · <strong>{businessName}</strong></p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {isDisplayLoading ? (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : !error && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Members',  value: members.length,                                                               icon: '👥', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
              { label: 'Active',         value: members.filter((m) => m.isActive).length,                                    icon: '✅', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
              { label: 'Proposals Sent', value: Object.keys(proposalMap).length,                                             icon: '📨', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
              { label: 'Accepted',       value: Object.values(proposalMap).filter((p) => p.status === 'ACCEPTED').length,   icon: '🎉', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
              { label: 'Pending',        value: Object.values(proposalMap).filter((p) => p.status === 'PENDING').length,    icon: '⏳', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
            ].map((s) => (
              <div key={s.label} style={{ 
                background: `linear-gradient(to bottom right, ${s.bg}, white)`, 
                borderRadius: 12, 
                padding: '20px 24px', 
                border: `1px solid ${s.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    background: s.bg,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>
                  {s.label === 'Total Members' ? 'team member' + (s.value !== 1 ? 's' : '') : 
                   s.label === 'Active' ? 'active' :
                   s.label === 'Proposals Sent' ? 'sent' :
                   s.label === 'Accepted' ? 'accepted' :
                   'awaiting'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {!isDisplayLoading && !error && members.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ position: 'relative', maxWidth: 500 }}>
              <span style={{ 
                position: 'absolute', 
                left: 14, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: 16, 
                color: '#94a3b8' 
              }}>
                🔍
              </span>
              <input 
                type="text" 
                placeholder="Search by name, email, role, or job title..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '11px 14px 11px 42px', 
                  borderRadius: 8, 
                  border: '1.5px solid #e2e8f0', 
                  fontSize: 14, 
                  outline: 'none', 
                  boxSizing: 'border-box', 
                  background: 'white',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')} 
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              {search && (
                <span style={{ 
                  position: 'absolute', 
                  right: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: 11, 
                  color: '#94a3b8',
                  fontWeight: 600
                }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {isDisplayLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            <MemberCardSkeleton />
            <MemberCardSkeleton />
            <MemberCardSkeleton />
            <MemberCardSkeleton />
          </div>
        )}

        {!isDisplayLoading && error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px 24px', color: '#dc2626', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div><div style={{ fontWeight: 600 }}>Unable to load members</div><div style={{ fontSize: 13, marginTop: 4 }}>{error}</div></div>
          </div>
        )}

        {!isDisplayLoading && !error && members.length === 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: '60px 40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>No team members yet</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Invite members to your business to manage their salaries.</p>
          </div>
        )}

        {!isDisplayLoading && !error && filtered.length === 0 && members.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: '#64748b', margin: 0 }}>No members match your search.</p>
          </div>
        )}

        {/* Members grid */}
        {!isDisplayLoading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {filtered.map((member) => {
              const proposal = proposalMap[member.userId];
              return (
                <div 
                  key={member.id} 
                  className="member-card" 
                  style={{ 
                    background: 'white', 
                    borderRadius: 16, 
                    border: '1px solid #e2e8f0', 
                    padding: '24px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 16,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Avatar member={member} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 700, 
                        fontSize: 16, 
                        color: '#0f172a', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        marginBottom: 4
                      }}>
                        {getFullName(member)}
                      </div>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#64748b', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {member.user.email}
                      </div>
                    </div>
                    <span style={{ 
                      background: getRoleColor(member.role) + '15', 
                      color: getRoleColor(member.role), 
                      borderRadius: 8, 
                      padding: '6px 12px', 
                      fontSize: 11, 
                      fontWeight: 700, 
                      whiteSpace: 'nowrap', 
                      border: `1.5px solid ${getRoleColor(member.role)}30`,
                      letterSpacing: '0.02em'
                    }}>
                      {member.role.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {member.user.jobTitle && (
                      <span style={{ 
                        background: '#f1f5f9', 
                        borderRadius: 6, 
                        padding: '6px 12px', 
                        fontSize: 12, 
                        color: '#475569',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        💼 {member.user.jobTitle}
                      </span>
                    )}
                    {member.joinedAt && (
                      <span style={{ 
                        background: '#f1f5f9', 
                        borderRadius: 6, 
                        padding: '6px 12px', 
                        fontSize: 12, 
                        color: '#475569',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        📅 Joined {new Date(member.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <span style={{ 
                      background: member.isActive ? '#dcfce7' : '#fee2e2', 
                      color: member.isActive ? '#16a34a' : '#dc2626', 
                      borderRadius: 6, 
                      padding: '6px 12px', 
                      fontSize: 12, 
                      fontWeight: 600,
                      border: member.isActive ? '1px solid #bbf7d0' : '1px solid #fecaca'
                    }}>
                      {member.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>

                  {/* Proposal status badge */}
                  {proposal && <ProposalStatusBadge info={proposal} />}

                  {canSendProposal && (
                    <button 
                      className="propose-btn" 
                      onClick={() => setSelectedMember(member)} 
                      style={{ 
                        width: '100%', 
                        padding: '12px 0', 
                        borderRadius: 10, 
                        background: '#f0f7ff', 
                        border: '1.5px solid #2563eb', 
                        color: '#2563eb', 
                        fontWeight: 700, 
                        fontSize: 14, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {proposal
                        ? proposal.status === 'PENDING'   ? '📨 Resend Proposal'
                        : proposal.status === 'COUNTERED' ? '🔄 Send New Proposal'
                                                          : '✉️ Send New Proposal'
                        : '✉️ Send Salary Proposal'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SendSalarycomponent/>
    </>
  );
}
