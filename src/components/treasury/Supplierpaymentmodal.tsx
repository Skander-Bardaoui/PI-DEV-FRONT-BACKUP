import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, X, Loader2, CheckCircle2 } from 'lucide-react';
import { PurchaseInvoice } from '@/types';
import axiosInstance from '@/api/axiosInstance';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ─── Test card helper ─────────────────────────────────────────────────────
function TestCardHint() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 space-y-0.5">
      <p className="font-semibold">🧪 Mode test Stripe</p>
      <p>Carte : <span className="font-mono">4242 4242 4242 4242</span></p>
      <p>Date : n'importe quelle date future &nbsp;|&nbsp; CVC : n'importe quoi</p>
    </div>
  );
}

// ─── Stripe card form ─────────────────────────────────────────────────────
function StripeCardForm({
  businessId,
  invoice,
  amount,
  accountId,
  onSuccess,
  onError,
}: {
  businessId: string;
  invoice: PurchaseInvoice;
  amount: number;
  accountId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    onError('');

    try {
      // Step 1 — create PaymentIntent on backend
      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/supplier-payments/stripe/create-intent`,
        { amount },
      );

      // Step 2 — confirm card payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        },
      );

      if (error) {
        onError(error.message ?? 'Erreur Stripe');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Step 3 — save payment in your DB
        await axiosInstance.post(
          `/businesses/${businessId}/supplier-payments`,
          {
            supplier_id: invoice.supplier_id,
            purchase_invoice_id: invoice.id,
            account_id: accountId,
            amount,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'CARTE',
            reference: paymentIntent.id,
            notes: `Paiement Stripe (test) — ${paymentIntent.id}`,
          },
        );
        onSuccess();
      }
    } catch (err: any) {
      onError(err?.response?.data?.message ?? 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <TestCardHint />

      <div className="border rounded-lg p-4 bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px',
                color: '#1f2937',
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
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Payer {amount.toFixed(3)} TND
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────
export default function SupplierPaymentModal({
  businessId,
  invoice,
  onClose,
  onSuccess,
}: {
  businessId: string;
  invoice: PurchaseInvoice;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const remaining = Number(invoice.net_amount) - Number(invoice.paid_amount);

  const [amount, setAmount]                 = useState(remaining);
  const [accountId, setAccountId]           = useState('');
  const [accounts, setAccounts]             = useState<any[]>([]);
  const [useStripeMethod, setUseStripeMethod] = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);
  const [classicLoading, setClassicLoading] = useState(false);

  // Load accounts
  useEffect(() => {
  axiosInstance
    .get(`/accounts`)
    .then((r) => setAccounts(r.data ?? []))
    .catch(() => {});
}, [businessId]);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  // Classic payment (virement, chèque...)
  const handleClassicPay = async () => {
    if (!accountId) return setError('Veuillez sélectionner un compte.');
    if (amount <= 0 || amount > remaining)
      return setError('Montant invalide.');

    setClassicLoading(true);
    setError('');
    try {
      await axiosInstance.post(
        `/businesses/${businessId}/supplier-payments`,
        {
          supplier_id: invoice.supplier_id,
          purchase_invoice_id: invoice.id,
          account_id: accountId,
          amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'VIREMENT',
          notes: 'Paiement classique',
        },
      );
      handleSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur serveur');
    } finally {
      setClassicLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Enregistrer un paiement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
              <p className="text-lg font-semibold text-gray-800">
                Paiement enregistré !
              </p>
              <p className="text-sm text-gray-500">
                La facture a été mise à jour.
              </p>
            </div>
          ) : (
            <>
              {/* Invoice info */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Facture</span>
                  <span className="font-mono font-medium text-gray-800">
                    {invoice.invoice_number_supplier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fournisseur</span>
                  <span className="text-gray-800">{invoice.supplier?.name}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1">
                  <span className="text-gray-500">Reste à payer</span>
                  <span className="font-bold text-indigo-700">
                    {remaining.toFixed(3)} TND
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Montant (TND)
                </label>
                <input
                  type="number"
                  value={amount}
                  min={0.001}
                  max={remaining}
                  step={0.001}
                  onChange={(e) => {
                    setAmount(Number(e.target.value));
                    setError('');
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Account */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Compte bancaire
                </label>
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    setError('');
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Sélectionner un compte —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {Number(a.current_balance).toFixed(3)} TND
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment method toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setUseStripeMethod(false); setError(''); }}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    !useStripeMethod
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  🏦 Virement / Chèque
                </button>
                <button
                  onClick={() => { setUseStripeMethod(true); setError(''); }}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    useStripeMethod
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  💳 Carte (Stripe)
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Classic payment button */}
              {!useStripeMethod && (
                <button
                  onClick={handleClassicPay}
                  disabled={classicLoading || !accountId}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {classicLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Traitement...</>
                  ) : (
                    <>Enregistrer — {amount.toFixed(3)} TND</>
                  )}
                </button>
              )}

              {/* Stripe — needs account first */}
              {useStripeMethod && !accountId && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  ⚠️ Sélectionnez un compte avant de payer par carte.
                </p>
              )}

              {/* Stripe form */}
              {useStripeMethod && accountId && (
                <Elements stripe={stripePromise}>
                  <StripeCardForm
                    businessId={businessId}
                    invoice={invoice}
                    amount={amount}
                    accountId={accountId}
                    onSuccess={handleSuccess}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
