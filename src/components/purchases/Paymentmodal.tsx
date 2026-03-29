import { useForm as useFormPayment } from 'react-hook-form';
import { zodResolver as zodResolverPayment } from '@hookform/resolvers/zod';
import { CreditCard, X as XIcon } from 'lucide-react';
import { paymentSchema }     from '@/schemas/purchases.schemas';
import { formatAmount as fa, PurchaseInvoice, round3 as r3 } from '@/types';

interface PaymentProps {
  invoice:   PurchaseInvoice;
  onClose:   () => void;
  onConfirm: (paid_amount: number) => void;
}

export function PaymentModal({ invoice, onClose, onConfirm }: PaymentProps) {
  const alreadyPaid = Number(invoice.paid_amount);
  const remaining   = r3(Number(invoice.net_amount) - alreadyPaid);

  const schema = paymentSchema(remaining);

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useFormPayment<{ amount: number }>({
    resolver: zodResolverPayment(schema),
    defaultValues: { amount: remaining },
  });

  const amount     = watch('amount') || 0;
  const afterPay   = r3(remaining - Number(amount));
  const isFullPay  = afterPay <= 0;

  const onSubmit = ({ amount }: { amount: number }) => {
    onConfirm(r3(alreadyPaid + Number(amount)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Enregistrer un paiement</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="h-6 w-6" /></button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Facture</span><span className="font-mono font-medium">{invoice.invoice_number_supplier}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Net TTC</span><span>{fa(invoice.net_amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Déjà payé</span><span className="text-green-600 font-medium">{fa(alreadyPaid)}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="font-medium text-gray-700">Reste à payer</span>
            <span className="font-bold text-orange-600">{fa(remaining)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant à régler (TND) <span className="text-red-500">*</span>
            </label>
            <input type="number" step="0.001" min="0.001"
              {...register('amount')}
              className={`w-full px-4 py-2 border rounded-lg text-right font-mono text-lg focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setValue('amount', r3(remaining / 2))}
                className="flex-1 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">50%</button>
              <button type="button" onClick={() => setValue('amount', remaining)}
                className="flex-1 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Solde total</button>
            </div>
          </div>

          {Number(amount) > 0 && Number(amount) <= remaining && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-indigo-700">Reste après ce paiement</span>
                <span className="font-bold text-indigo-800">{fa(r3(remaining - Number(amount)))}</span>
              </div>
              {isFullPay && (
                <p className="text-green-700 text-xs mt-1 font-medium">✓ Facture entièrement payée</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium">
              {isSubmitting ? 'Validation...' : 'Valider le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
