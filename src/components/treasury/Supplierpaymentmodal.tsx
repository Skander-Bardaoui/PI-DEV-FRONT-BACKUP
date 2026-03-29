// src/components/treasury/SupplierPaymentModal.tsx
//
// Replaces the old PaymentModal in ExpensesToPayPage.
// Calls POST /businesses/:businessId/supplier-payments (treasury endpoint).
// Requires: invoice pre-filled, account selector, amount, method, date, reference.

import { useState } from 'react';
import { CreditCard, X, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { formatAmount, round3, PurchaseInvoice } from '@/types';
import { useAccounts } from '@/hooks/useAccounts';
import { createSupplierPayment, CreateSupplierPaymentDto } from '@/api/treasury.api';

// ─── Payment methods matching backend PaymentMethod enum ─────────────────
const PAYMENT_METHODS = [
  { value: 'VIREMENT',  label: 'Virement bancaire' },
  { value: 'CHEQUE',    label: 'Chèque' },
  { value: 'ESPECES',   label: 'Espèces' },
  { value: 'CARTE',     label: 'Carte bancaire' },
  { value: 'TRAITE',    label: 'Traite' },
  { value: 'AUTRE',     label: 'Autre' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;

const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;

// ─── Props ────────────────────────────────────────────────────────────────
interface Props {
  businessId: string;
  invoice:    PurchaseInvoice;
  onClose:    () => void;
  onSuccess:  () => void; // triggers react-query refetch in parent
}

// ─── Form state ───────────────────────────────────────────────────────────
interface FormValues {
  account_id:     string;
  amount:         string;
  payment_method: string;
  payment_date:   string;
  reference:      string;
  notes:          string;
}

interface FormErrors {
  account_id?:     string;
  amount?:         string;
  payment_method?: string;
  payment_date?:   string;
}

export default function SupplierPaymentModal({ businessId, invoice, onClose, onSuccess }: Props) {
  const alreadyPaid = Number(invoice.paid_amount);
  const remaining   = round3(Number(invoice.net_amount) - alreadyPaid);

  const { accounts, loading: accountsLoading } = useAccounts();
  const activeAccounts = accounts.filter((a) => a.is_active);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormValues>({
    account_id:     '',
    amount:         String(remaining),
    payment_method: 'VIREMENT',
    payment_date:   today,
    reference:      '',
    notes:          '',
  });

  const [errors, setErrors]     = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);

  const amount     = round3(Number(form.amount) || 0);
  const afterPay   = round3(remaining - amount);
  const isFullPay  = afterPay <= 0.005;

  // Selected account balance check
  const selectedAccount = activeAccounts.find((a) => a.id === form.account_id);
  const insufficientFunds =
    selectedAccount && amount > 0 && Number(selectedAccount.current_balance) < amount;

  // ── Field change ────────────────────────────────────────────────────────
  const set = (field: keyof FormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError(null);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.account_id)
      e.account_id = 'Sélectionnez un compte';
    if (!form.amount || amount <= 0)
      e.amount = 'Le montant doit être positif';
    if (amount > remaining + 0.005)
      e.amount = `Montant supérieur au reste à payer (${formatAmount(remaining)})`;
    if (!form.payment_method)
      e.payment_method = 'Sélectionnez un mode de paiement';
    if (!form.payment_date)
      e.payment_date = 'La date est obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);

    const dto: CreateSupplierPaymentDto = {
      supplier_id:         invoice.supplier_id,
      purchase_invoice_id: invoice.id,
      account_id:          form.account_id,
      amount,
      payment_date:        form.payment_date,
      payment_method:      form.payment_method,
      reference:           form.reference || undefined,
      notes:               form.notes     || undefined,
    };

    try {
      await createSupplierPayment(businessId, dto);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(); // triggers refetch of approved-partial list
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        'Erreur lors de l\'enregistrement du paiement';
      setApiError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Enregistrer un paiement</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Invoice summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Facture</span>
              <span className="font-mono font-medium">{invoice.invoice_number_supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fournisseur</span>
              <span className="font-medium">{invoice.supplier?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Net TTC</span>
              <span>{formatAmount(invoice.net_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Déjà payé</span>
              <span className="text-green-600 font-medium">{formatAmount(alreadyPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="font-semibold text-gray-700">Reste à payer</span>
              <span className="font-bold text-orange-600">{formatAmount(remaining)}</span>
            </div>
          </div>

          {/* Success state */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Paiement enregistré avec succès !
            </div>
          )}

          {/* API error */}
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {apiError}
            </div>
          )}

          {/* Account selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte à débiter <span className="text-red-500">*</span>
            </label>
            {accountsLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-400">
                Chargement des comptes...
              </div>
            ) : (
              <select
                value={form.account_id}
                onChange={(e) => set('account_id', e.target.value)}
                className={inputCls(!!errors.account_id)}
              >
                <option value="">Sélectionner un compte</option>
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Solde : {formatAmount(acc.current_balance)}
                  </option>
                ))}
              </select>
            )}
            <Err msg={errors.account_id} />
            {insufficientFunds && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Solde insuffisant ({formatAmount(selectedAccount!.current_balance)} disponible)
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant à régler (TND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={`${inputCls(!!errors.amount)} text-right font-mono text-lg`}
            />
            <Err msg={errors.amount} />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => set('amount', String(round3(remaining / 2)))}
                className="flex-1 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                50 %
              </button>
              <button
                type="button"
                onClick={() => set('amount', String(remaining))}
                className="flex-1 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Solde total
              </button>
            </div>
          </div>

          {/* After-payment preview */}
          {amount > 0 && amount <= remaining + 0.005 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-indigo-700">Reste après ce paiement</span>
                <span className="font-bold text-indigo-800">{formatAmount(Math.max(0, afterPay))}</span>
              </div>
              {isFullPay && (
                <p className="text-green-700 text-xs mt-1 font-medium">
                  ✓ Facture entièrement soldée
                </p>
              )}
            </div>
          )}

          {/* Payment method + date (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode de paiement <span className="text-red-500">*</span>
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value)}
                className={inputCls(!!errors.payment_method)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <Err msg={errors.payment_method} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de paiement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => set('payment_date', e.target.value)}
                className={inputCls(!!errors.payment_date)}
              />
              <Err msg={errors.payment_date} />
            </div>
          </div>

          {/* Reference (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence <span className="text-gray-400 text-xs">(optionnel — N° chèque, virement…)</span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={form.reference}
              onChange={(e) => set('reference', e.target.value)}
              placeholder="Ex: CHQ-00123"
              className={inputCls()}
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 text-xs">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputCls()} resize-none`}
              placeholder="Remarques internes…"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !!insufficientFunds || success}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {submitting ? 'Enregistrement...' : 'Valider le paiement'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
