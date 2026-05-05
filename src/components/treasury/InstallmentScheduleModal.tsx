// src/components/treasury/InstallmentScheduleModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Plus, Trash2, CalendarDays, CreditCard,
  CheckCircle2, Clock, AlertCircle,
  Banknote, Loader2, MailCheck,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements, CardElement,
  useStripe, useElements,
} from '@stripe/react-stripe-js';
import { usePaymentSchedules } from '@/hooks/usePaymentSchedules';
import { useAccounts }         from '@/hooks/useAccounts';
import { PurchaseInvoice, formatAmount, formatDate } from '@/types';
import { PaymentMethod }       from '@/types/PaymentMethod';
import axiosInstance           from '@/api/axiosInstance';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ── Types ─────────────────────────────────────────────────────────────────────

interface InstallmentLine {
  due_date:       string;
  amount:         number;
  payment_method: PaymentMethod;
  reference:      string;
  notes:          string;
}

interface Installment {
  id:                 string;
  installment_number: number;
  due_date:           string;
  amount:             number;
  status:             'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  payment_method:     PaymentMethod;
  paid_at:            string | null;
  reference:          string | null;
}

type ScheduleStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED';

interface Schedule {
  id:               string;
  total_amount:     number;
  status:           ScheduleStatus;
  rejection_reason: string | null;
  installments:     Installment[];
}

interface Props {
  businessId: string;
  invoice:    PurchaseInvoice;
  onClose:    () => void;
  onSuccess?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  PENDING:   { label: 'En attente', classes: 'bg-amber-100 text-amber-700',  icon: <Clock        className="h-3 w-3" /> },
  PAID:      { label: 'Payée',      classes: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" /> },
  OVERDUE:   { label: 'En retard',  classes: 'bg-red-100   text-red-600',    icon: <AlertCircle  className="h-3 w-3" /> },
  CANCELLED: { label: 'Annulée',    classes: 'bg-gray-100  text-gray-500',   icon: <X            className="h-3 w-3" /> },
};

const PAYMENT_METHODS = [
  { value: PaymentMethod.VIREMENT, label: 'Virement' },
  { value: PaymentMethod.CHEQUE,   label: 'Chèque'   },
  { value: PaymentMethod.ESPECES,  label: 'Espèces'  },
  { value: PaymentMethod.CARTE,    label: 'Carte'    },
];

const emptyLine = (): InstallmentLine => ({
  due_date: '', amount: 0,
  payment_method: PaymentMethod.VIREMENT,
  reference: '', notes: '',
});

// ── Stripe card sub-form ──────────────────────────────────────────────────────

function StripeInstallmentForm({
  businessId, installment, form, onPay, onError, loading,
}: {
  businessId:  string;
  installment: Installment;
  form:        any;
  onPay:       (data: any) => void;
  onError:     (msg: string) => void;
  loading:     boolean;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [stripeLoading, setStripeLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setStripeLoading(true);
    onError('');
    try {
      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/supplier-payments/stripe/create-intent`,
        { amount: installment.amount },
      );
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement)! } },
      );
      if (error) { onError(error.message ?? 'Erreur Stripe'); return; }
      if (paymentIntent?.status === 'succeeded') {
        onPay({ ...form, reference: paymentIntent.id });
      }
    } catch (err: any) {
      onError(err?.response?.data?.message ?? 'Erreur serveur');
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 space-y-0.5">
        <p className="font-semibold">🧪 Mode test Stripe</p>
        <p>Carte : <span className="font-mono">4242 4242 4242 4242</span></p>
        <p>Date : n'importe quelle date future &nbsp;|&nbsp; CVC : n'importe quoi</p>
      </div>
      <div className="border rounded-lg p-4 bg-gray-50">
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
        disabled={stripeLoading || loading || !stripe}
        className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600
                   disabled:opacity-50 text-white rounded-lg text-sm font-medium
                   transition-colors flex items-center justify-center gap-2"
      >
        {stripeLoading || loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Traitement...</>
          : <><CheckCircle2 className="h-4 w-4" /> Payer {formatAmount(installment.amount)}</>
        }
      </button>
    </div>
  );
}

// ── Pay sub-modal (portal) ────────────────────────────────────────────────────

function PayInstallmentModal({
  businessId, installment, accounts, onPay, onClose, loading,
}: {
  businessId:  string;
  installment: Installment;
  accounts:    any[];
  onPay:       (data: any) => void;
  onClose:     () => void;
  loading:     boolean;
}) {
  const [form, setForm] = useState({
    account_id:     accounts[0]?.id ?? '',
    payment_method: installment.payment_method,
    paid_at:        new Date().toISOString().slice(0, 10),
    reference:      '',
    notes:          '',
  });
  const [stripeError, setStripeError] = useState('');
  const isCard = form.payment_method === PaymentMethod.CARTE;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center
                    bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        <div className="bg-gradient-to-r from-green-500 to-emerald-600
                        px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">
              Payer l'échéance #{installment.installment_number}
            </h3>
            <p className="text-green-100 text-sm mt-0.5">
              Montant : {formatAmount(installment.amount)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Account */}
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Compte à débiter *
            </label>
            <select
              value={form.account_id}
              onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
              className="mt-1.5 w-full border rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {formatAmount(a.current_balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Méthode de paiement
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, payment_method: m.value as PaymentMethod }))}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                    form.payment_method === m.value
                      ? 'bg-green-50 border-green-400 text-green-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Reference for non-card methods */}
          {!isCard && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Date de paiement
                </label>
                <input
                  type="date"
                  value={form.paid_at}
                  onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))}
                  className="mt-1.5 w-full border rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Référence
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="N° chèque, virement…"
                  className="mt-1.5 w-full border rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </>
          )}

          {stripeError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {stripeError}
            </p>
          )}

          {isCard ? (
            <Elements stripe={stripePromise}>
              <StripeInstallmentForm
                businessId={businessId}
                installment={installment}
                form={form}
                onPay={onPay}
                onError={setStripeError}
                loading={loading}
              />
            </Elements>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border rounded-lg text-sm
                           text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => onPay(form)}
                disabled={!form.account_id || loading}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600
                           disabled:opacity-50 text-white rounded-lg text-sm font-medium
                           transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />
                }
                Confirmer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function InstallmentScheduleModal({
  businessId, invoice, onClose, onSuccess,
}: Props) {
  const { loading, error, createSchedule, getByInvoice, payInstallment } =
    usePaymentSchedules(businessId);
  const { accounts } = useAccounts();

  const remaining = Number(invoice.net_amount) - Number(invoice.paid_amount);

  const [tab,            setTab]            = useState<'create' | 'view'>('create');
  const [schedule,       setSchedule]       = useState<Schedule | null>(null);
  const [lines,          setLines]          = useState<InstallmentLine[]>([emptyLine(), emptyLine()]);
  const [scheduleNotes,  setScheduleNotes]  = useState('');
  const [payTarget,      setPayTarget]      = useState<Installment | null>(null);
  const [submitError,    setSubmitError]    = useState<string | null>(null);

  useEffect(() => {
    getByInvoice(invoice.id).then((data) => {
      if (data) { setSchedule(data as Schedule); setTab('view'); }
    });
  }, [invoice.id]);

  const addLine    = () => setLines((l) => [...l, emptyLine()]);
  const removeLine = (idx: number) => setLines((l) => l.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof InstallmentLine, value: any) =>
    setLines((l) => l.map((line, i) => i === idx ? { ...line, [field]: value } : line));

  const linesTotal = lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const linesValid = lines.every((l) => l.due_date && Number(l.amount) > 0);
  const overBudget = linesTotal > remaining + 0.005;

  const handleCreate = async () => {
    setSubmitError(null);
    if (!linesValid)
      return setSubmitError('Veuillez remplir toutes les dates et montants.');
    if (overBudget)
      return setSubmitError(
        `Le total (${formatAmount(linesTotal)}) dépasse le solde restant (${formatAmount(remaining)}).`,
      );
    try {
      const data = await createSchedule({
        purchase_invoice_id: invoice.id,
        notes: scheduleNotes || null,
        installments: lines.map((l) => ({
          ...l,
          amount:    Number(l.amount),
          reference: l.reference || null,
          notes:     l.notes     || null,
        })),
      });
      setSchedule(data as Schedule);
      setTab('view');
    } catch (e: any) {
      setSubmitError(e.response?.data?.message ?? 'Erreur lors de la création.');
    }
  };

  const handlePay = async (formData: any) => {
    if (!payTarget || !schedule) return;
    try {
      await payInstallment(schedule.id, payTarget.id, formData);
      const updated = await getByInvoice(invoice.id);
      if (updated) setSchedule(updated as Schedule);
      setPayTarget(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error paying installment:', error);
    }
  };

  const paidCount  = schedule?.installments.filter((i) => i.status === 'PAID').length ?? 0;
  const totalCount = schedule?.installments.length ?? 0;
  const paidAmount = schedule?.installments
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + Number(i.amount), 0) ?? 0;

  // ── Approval status banner ─────────────────────────────────────────
  const ApprovalBanner = () => {
    if (!schedule) return null;
    if (schedule.status === 'PENDING_APPROVAL') return (
      <div className="flex items-start gap-3 p-4 bg-amber-50
                      border border-amber-200 rounded-xl">
        <MailCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-700">
            En attente de validation fournisseur
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Un email a été envoyé au fournisseur. Les paiements seront
            débloqués dès son accord.
          </p>
        </div>
      </div>
    );
    if (schedule.status === 'REJECTED') return (
      <div className="flex items-start gap-3 p-4 bg-red-50
                      border border-red-200 rounded-xl">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">
            Plan refusé par le fournisseur
          </p>
          {schedule.rejection_reason && (
            <p className="text-xs text-red-500 mt-0.5">
              {schedule.rejection_reason}
            </p>
          )}
        </div>
      </div>
    );
    if (schedule.status === 'ACTIVE') return (
      <div className="flex items-center gap-3 p-4 bg-green-50
                      border border-green-200 rounded-xl">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        <p className="text-sm font-semibold text-green-700">
          Plan accepté — paiements débloqués
        </p>
      </div>
    );
    return null;
  };

  // ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-[50] flex items-center justify-center
                      bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl
                        max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600
                          px-6 py-5 flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-white font-bold text-xl">Paiement échelonné</h2>
              <p className="text-indigo-200 text-sm mt-1">
                {invoice.invoice_number_supplier} — {invoice.supplier?.name}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-indigo-100">
                  Total : <span className="text-white font-semibold">
                    {formatAmount(invoice.net_amount)}
                  </span>
                </span>
                <span className="text-indigo-100">
                  Restant : <span className="text-white font-semibold">
                    {formatAmount(remaining)}
                  </span>
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white mt-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs — only shown when a schedule exists */}
          {schedule && (
            <div className="flex border-b shrink-0">
              {(['view', 'create'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'view' ? 'Échéancier' : 'Nouveau plan'}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6">

            {/* ── VIEW TAB ── */}
            {tab === 'view' && schedule && (
              <div className="space-y-4">

                {/* Approval banner */}
                <ApprovalBanner />

                {/* Progress bar */}
                <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Progression</span>
                      <span className="font-semibold text-indigo-700">
                        {paidCount}/{totalCount} échéances
                      </span>
                    </div>
                    <div className="bg-indigo-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Payé</p>
                    <p className="font-bold text-indigo-700">{formatAmount(paidAmount)}</p>
                  </div>
                </div>

                {/* Installment rows */}
                <div className="space-y-2">
                  {schedule.installments.map((inst) => {
                    const cfg    = STATUS_CFG[inst.status];
                    const canPay = inst.status === 'PENDING' || inst.status === 'OVERDUE';
                    return (
                      <div
                        key={inst.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                          inst.status === 'PAID'    ? 'bg-green-50/50 border-green-100' :
                          inst.status === 'OVERDUE' ? 'bg-red-50/50   border-red-100'  :
                          'bg-white border-gray-100 hover:border-indigo-100'
                        }`}
                      >
                        {/* Number / check icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center
                                         justify-center text-sm font-bold shrink-0 ${
                          inst.status === 'PAID'    ? 'bg-green-500 text-white' :
                          inst.status === 'OVERDUE' ? 'bg-red-500   text-white' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {inst.status === 'PAID'
                            ? <CheckCircle2 className="h-4 w-4" />
                            : inst.installment_number}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                              {formatAmount(inst.amount)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5
                                             rounded-full text-xs font-medium ${cfg.classes}`}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              Échéance : {formatDate(inst.due_date)}
                            </span>
                            {inst.paid_at && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Payé le {formatDate(inst.paid_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pay button — only when ACTIVE */}
                        {canPay && schedule.status === 'ACTIVE' && (
                          <button
                            onClick={() => setPayTarget(inst)}
                            className="flex items-center gap-1.5 px-3 py-1.5
                                       bg-indigo-600 hover:bg-indigo-700 text-white
                                       text-xs font-medium rounded-lg transition-colors shrink-0"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Payer
                          </button>
                        )}

                        {/* Locked hint when pending approval */}
                        {canPay && schedule.status === 'PENDING_APPROVAL' && (
                          <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                            En attente
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CREATE TAB ── */}
            {tab === 'create' && (
              <div className="space-y-4">

                {/* Budget indicator */}
                <div className={`rounded-xl p-3 flex items-center justify-between text-sm ${
                  overBudget
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-100'
                }`}>
                  <span className="text-gray-600">
                    Total planifié :
                    <span className={`ml-1 font-bold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatAmount(linesTotal)}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Disponible :
                    <span className="font-semibold text-gray-700 ml-1">
                      {formatAmount(remaining)}
                    </span>
                  </span>
                </div>

                {/* Installment lines */}
                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <div key={idx} className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                          Échéance #{idx + 1}
                        </span>
                        {lines.length > 2 && (
                          <button
                            onClick={() => removeLine(idx)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Date d'échéance *
                          </label>
                          <input
                            type="date"
                            value={line.due_date}
                            onChange={(e) => updateLine(idx, 'due_date', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Montant *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={line.amount || ''}
                            onChange={(e) => updateLine(idx, 'amount', e.target.value)}
                            placeholder="0.000"
                            className="w-full border rounded-lg px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Méthode</label>
                        <div className="flex gap-2">
                          {PAYMENT_METHODS.map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => updateLine(idx, 'payment_method', m.value)}
                              className={`flex-1 px-2 py-1.5 rounded-lg text-xs border transition-all ${
                                line.payment_method === m.value
                                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-medium'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={line.reference}
                        onChange={(e) => updateLine(idx, 'reference', e.target.value)}
                        placeholder="Référence (optionnel)"
                        className="w-full border rounded-lg px-3 py-2 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={addLine}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-200
                             rounded-xl text-indigo-500 hover:border-indigo-400
                             hover:bg-indigo-50 transition-colors text-sm font-medium
                             flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Ajouter une échéance
                </button>

                <div>
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    rows={2}
                    placeholder="Accord de paiement, conditions…"
                    className="mt-1.5 w-full border rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>

                {(submitError || error) && (
                  <div className="flex items-center gap-2 p-3 bg-red-50
                                  border border-red-200 rounded-lg text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {submitError || error}
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={loading || !linesValid || overBudget}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                             disabled:opacity-50 text-white rounded-xl font-medium
                             transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Création…</>
                    : <><Banknote className="h-4 w-4" /> Créer l'échéancier</>
                  }
                </button>

                {/* Info note about email approval */}
                <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                  <MailCheck className="h-3.5 w-3.5" />
                  Un email de validation sera envoyé au fournisseur après création.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay sub-modal via portal */}
      {payTarget && (
        <PayInstallmentModal
          businessId={businessId}
          installment={payTarget}
          accounts={accounts ?? []}
          onPay={handlePay}
          onClose={() => setPayTarget(null)}
          loading={loading}
        />
      )}
    </>
  );
}