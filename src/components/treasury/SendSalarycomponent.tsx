import React, { useEffect, useState, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { salaryApi, AcceptedProposal } from '../../api/salary.api';
import { getAccounts } from '../../api/treasury.api';
import { getMyBusinesses } from '../../api/business.api';
import { AuthContext } from '../../context/AuthContext';
import { Account } from '../../types/treasury';
import axiosInstance from '../../api/axiosInstance';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

type PaymentMethod = 'VIREMENT' | 'CHEQUE' | 'ESPECES' | 'TRAITE' | 'CARTE';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'VIREMENT', label: 'Virement',  icon: '🏦' },
  { value: 'CHEQUE',   label: 'Chèque',    icon: '📝' },
  { value: 'ESPECES',  label: 'Espèces',   icon: '💵' },
  { value: 'TRAITE',   label: 'Traite',    icon: '📄' },
  { value: 'CARTE',    label: 'Carte',     icon: '💳' },
];

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency }).format(amount);

// ─── Test card hint ───────────────────────────────────────────────────────────
function TestCardHint() {
  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8,
      padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>🧪 Mode test Stripe</div>
      <div>Carte : <span style={{ fontFamily: 'monospace' }}>4242 4242 4242 4242</span></div>
      <div>Date : n'importe quelle date future &nbsp;|&nbsp; CVC : n'importe quoi</div>
    </div>
  );
}

// ─── Stripe card form ─────────────────────────────────────────────────────────
function StripeCardForm({
  businessId,
  amount,
  accountId,
  proposalId,
  onSuccess,
  onError,
}: {
  businessId: string;
  amount: number;
  accountId: string;
  proposalId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    onError('');

    try {
      // Step 1 — create PaymentIntent (reuse the supplier-payments endpoint)
      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/supplier-payments/stripe/create-intent`,
        { amount },
      );

      // Step 2 — confirm with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement)! } },
      );

      if (error) { onError(error.message ?? 'Erreur Stripe'); return; }

      if (paymentIntent?.status === 'succeeded') {
        // Step 3 — record salary payment with method CARTE + stripe ref
        await salaryApi.paySalary(businessId, proposalId, {
          accountId,
          paymentMethod: 'CARTE',
          stripePaymentIntentId: paymentIntent.id,
        });
        onSuccess();
      }
    } catch (err: any) {
      onError(err?.response?.data?.message ?? 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TestCardHint />
      <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8,
        padding: '14px 16px', background: '#f8fafc' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px', color: '#1f2937',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>
      <button
        onClick={handlePay}
        disabled={loading || !stripe}
        style={{ width: '100%', padding: '12px 0', borderRadius: 8,
          background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
          border: 'none', color: 'white', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading
          ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: 'white', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Traitement...
            </>
          : <>💳 Payer {fmt(amount, 'TND')}</>}
      </button>
    </div>
  );
}

// ─── Confirm Pay Modal ────────────────────────────────────────────────────────
interface ConfirmModalProps {
  proposal: AcceptedProposal;
  accounts: Account[];
  onConfirm: (accountId: string, paymentMethod: PaymentMethod) => void;
  onClose: () => void;
  loading: boolean;
  businessId: string;
  onStripeSuccess: () => void;
}

const ConfirmPayModal = ({
  proposal, accounts, onConfirm, onClose, loading, businessId, onStripeSuccess,
}: ConfirmModalProps) => {
  const [accountId, setAccountId]       = useState(
    accounts.find((a) => a.is_default)?.id ?? accounts[0]?.id ?? ''
  );
  const [method, setMethod]             = useState<PaymentMethod>('VIREMENT');
  const [stripeError, setStripeError]   = useState('');

  const selected  = accounts.find((a) => a.id === accountId);
  const hasEnough = selected
    ? Number(selected.current_balance) >= proposal.proposedAmount
    : false;

  const isStripe      = method === 'CARTE';
  const canPay        = !!accountId && (isStripe || hasEnough);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #065f46, #059669)',
          borderRadius: '16px 16px 0 0', padding: '22px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 1 }}>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>
              💸 Confirmer le paiement
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3 }}>
              Pour {proposal.recipientName}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Amount */}
          <div style={{ background: '#ecfdf5', border: '2px solid #059669', borderRadius: 12,
            padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 4 }}>
              Salaire à payer
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#065f46' }}>
              {fmt(proposal.proposedAmount, proposal.currency)}
            </div>
          </div>

          {/* Account selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
              color: '#374151', marginBottom: 8 }}>
              Débiter du compte *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1.5px solid #e2e8f0', fontSize: 14, background: 'white',
                outline: 'none' }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {fmt(Number(a.current_balance), a.currency)}
                  {a.is_default ? ' (défaut)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment method selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
              color: '#374151', marginBottom: 10 }}>
              Mode de paiement *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => { setMethod(m.value); setStripeError(''); }}
                  style={{ padding: '10px 6px', borderRadius: 8, border: '1.5px solid',
                    borderColor: method === m.value ? '#059669' : '#e2e8f0',
                    background: method === m.value ? '#ecfdf5' : 'white',
                    color: method === m.value ? '#065f46' : '#374151',
                    fontWeight: method === m.value ? 700 : 400,
                    fontSize: 13, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    transition: 'all 0.15s ease' }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Insufficient balance warning (non-Stripe only) */}
          {selected && !hasEnough && !isStripe && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626',
              display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>⚠️</span>
              <span>Solde insuffisant. Disponible : {fmt(Number(selected.current_balance), selected.currency)}</span>
            </div>
          )}

          {/* Stripe account warning */}
          {isStripe && !accountId && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e',
              display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>⚠️</span>
              <span>Sélectionnez un compte avant de payer par carte.</span>
            </div>
          )}

          {/* Stripe error */}
          {stripeError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {stripeError}
            </div>
          )}

          {/* Info box */}
          <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '12px 16px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
            border: '1px solid #bae6fd' }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: 12, color: '#0c4a6e', lineHeight: 1.5 }}>
              {isStripe
                ? <>Le montant sera débité via Stripe. Le compte sélectionné sera mis à jour et la transaction enregistrée.</>
                : <>Le montant sera déduit du compte sélectionné et enregistré comme dépense salariale. Un email de confirmation sera envoyé à <strong>{proposal.recipientEmail}</strong>.</>
              }
            </p>
          </div>

          {/* Classic payment button (all methods except CARTE) */}
          {!isStripe && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={() => onConfirm(accountId, method)}
                disabled={loading || !canPay}
                style={{ flex: 2, padding: '12px 0', borderRadius: 8,
                  background: loading || !canPay
                    ? '#6ee7b7'
                    : 'linear-gradient(135deg, #065f46, #059669)',
                  border: 'none', color: 'white', fontWeight: 700, fontSize: 14,
                  cursor: loading || !canPay ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading
                  ? <><span style={{ width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Traitement...
                    </>
                  : `✅ Confirmer — ${fmt(proposal.proposedAmount, proposal.currency)}`}
              </button>
            </div>
          )}

          {/* Stripe form */}
          {isStripe && accountId && (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                businessId={businessId}
                amount={proposal.proposedAmount}
                accountId={accountId}
                proposalId={proposal.id}
                onSuccess={onStripeSuccess}
                onError={(msg) => setStripeError(msg)}
              />
            </Elements>
          )}

          {/* Cancel button for Stripe view */}
          {isStripe && (
            <button onClick={onClose}
              style={{ width: '100%', padding: '11px 0', borderRadius: 8,
                border: '1.5px solid #e2e8f0', background: 'white',
                color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SendSalarycomponent() {
  const authCtx = useContext(AuthContext);
  const user    = authCtx?.user;

  const [businessId, setBusinessId]             = useState('');
  const [proposals, setProposals]               = useState<AcceptedProposal[]>([]);
  const [accounts, setAccounts]                 = useState<Account[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [payingId, setPayingId]                 = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<AcceptedProposal | null>(null);
  const [toasts, setToasts]                     = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const loadData = async (bizId: string) => {
    const [proposalData, accountData] = await Promise.all([
      salaryApi.getAcceptedProposals(bizId),
      getAccounts(),
    ]);
    setProposals(proposalData);
    setAccounts(accountData.filter((a: Account) => a.is_active));
  };

  useEffect(() => {
    if (!user) return;
    getMyBusinesses()
      .then((businesses: any[]) => {
        if (!businesses.length) return;
        const bizId = businesses[0].id;
        setBusinessId(bizId);
        return loadData(bizId);
      })
      .catch(() => addToast('error', 'Échec du chargement'))
      .finally(() => setLoading(false));
  }, [user]);

  const handlePay = async (accountId: string, paymentMethod: PaymentMethod) => {
    if (!selectedProposal || !businessId) return;
    setPayingId(selectedProposal.id);
    try {
      await salaryApi.paySalary(businessId, selectedProposal.id, {
        accountId,
        paymentMethod,
      });
      addToast('success', `✅ Salaire payé à ${selectedProposal.recipientName} !`);
      setSelectedProposal(null);
      await loadData(businessId);
    } catch (err: any) {
      addToast('error', err?.response?.data?.message ?? 'Échec du paiement');
    } finally {
      setPayingId(null);
    }
  };

  const handleStripeSuccess = async () => {
    if (!selectedProposal) return;
    addToast('success', `✅ Salaire payé à ${selectedProposal.recipientName} via Stripe !`);
    setSelectedProposal(null);
    await loadData(businessId);
  };

  const accepted = proposals.filter((p) => p.status === 'ACCEPTED');
  const paid     = proposals.filter((p) => p.status === 'PAID');

  if (loading) return null;
  if (!accepted.length && !paid.length) return null;

  return (
    <>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0;transform:translateX(20px) } to { opacity:1;transform:translateX(0) } }
        .pay-card:hover   { background:#f0fdf4 !important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(5,150,105,0.1) !important; }
        .pay-card         { transition:all 0.18s ease !important; }
        .pay-btn:hover:not(:disabled) { background:linear-gradient(135deg,#065f46,#059669) !important; color:white !important; }
        .pay-btn          { transition:all 0.15s ease !important; }
      `}</style>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ padding: '12px 18px', borderRadius: 10,
            background: t.type === 'success' ? '#059669' : '#dc2626',
            color: 'white', fontWeight: 600, fontSize: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.25s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
            {t.message}
          </div>
        ))}
      </div>

      {selectedProposal && (
        <ConfirmPayModal
          proposal={selectedProposal}
          accounts={accounts}
          onConfirm={handlePay}
          onClose={() => setSelectedProposal(null)}
          loading={payingId === selectedProposal.id}
          businessId={businessId}
          onStripeSuccess={handleStripeSuccess}
        />
      )}

      <div style={{ padding: '0 32px 32px', fontFamily: 'inherit' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #065f46, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            💸
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Prêt à payer
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              {accepted.length} proposition{accepted.length !== 1 ? 's' : ''} acceptée{accepted.length !== 1 ? 's' : ''} en attente de paiement
              {paid.length > 0 && ` · ${paid.length} déjà payée${paid.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Accepted cards */}
        {accepted.length > 0 && (
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14, marginBottom: paid.length ? 24 : 0 }}>
            {accepted.map((p) => (
              <div key={p.id} className="pay-card"
                style={{ background: 'white', borderRadius: 14,
                  border: '1.5px solid #a7f3d0', padding: '18px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  display: 'flex', flexDirection: 'column', gap: 10 }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                      {p.recipientName}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      {p.recipientEmail}
                    </div>
                  </div>
                  <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 20,
                    padding: '3px 12px', fontSize: 12, fontWeight: 700,
                    border: '1px solid #bbf7d0' }}>
                    ✅ Accepté
                  </span>
                </div>

                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Salaire convenu</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#065f46' }}>
                    {fmt(p.proposedAmount, p.currency)}
                  </span>
                </div>

                {p.respondedAt && (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Accepté le{' '}
                    {new Date(p.respondedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                )}

                <button
                  className="pay-btn"
                  onClick={() => setSelectedProposal(p)}
                  disabled={payingId === p.id}
                  style={{ width: '100%', padding: '11px 0', borderRadius: 9,
                    background: '#f0fdf4', border: '1.5px solid #059669',
                    color: '#065f46', fontWeight: 700, fontSize: 14,
                    cursor: payingId === p.id ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {payingId === p.id
                    ? <><span style={{ width: 16, height: 16,
                        border: '2px solid rgba(5,150,105,0.3)',
                        borderTopColor: '#059669', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                        Traitement...
                      </>
                    : '💸 Envoyer le paiement'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Paid history */}
        {paid.length > 0 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b',
              marginBottom: 12, marginTop: 8 }}>
              Historique des paiements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paid.map((p) => (
                <div key={p.id}
                  style={{ background: 'white', borderRadius: 12,
                    border: '1px solid #e2e8f0', padding: '14px 18px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        {p.recipientName}
                      </div>
                      {p.paidAt && (
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          Payé le{' '}
                          {new Date(p.paidAt).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#065f46' }}>
                    {fmt(p.proposedAmount, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
