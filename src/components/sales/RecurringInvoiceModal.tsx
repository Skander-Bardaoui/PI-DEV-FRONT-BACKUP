// src/components/sales/RecurringInvoiceModal.tsx
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreateRecurringInvoice, useUpdateRecurringInvoice } from '@/hooks/useRecurringInvoices';
import { useClients } from '@/hooks/useClients';
import { RecurringFrequency, RECURRING_FREQUENCY_LABELS } from '@/types/recurring-invoice';
import { useState } from 'react';

const TIMBRE_FISCAL = 1.000;
const round3 = (v: number) => Math.round(v * 1000) / 1000;

interface RecurringInvoiceFormValues {
  client_id: string;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  amount: number;
  tax_rate: number;
  notes?: string;
}

interface Props {
  businessId: string;
  recurringInvoice?: any;
  onClose: () => void;
}

export default function RecurringInvoiceModal({ businessId, recurringInvoice, onClose }: Props) {
  const create = useCreateRecurringInvoice(businessId);
  const update = useUpdateRecurringInvoice(businessId, recurringInvoice?.id || '');
  const { data: clientsData } = useClients(businessId, { limit: 100 });
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!recurringInvoice;

  const getInitialValues = (): RecurringInvoiceFormValues => {
    if (isEdit) {
      return {
        client_id: recurringInvoice.client_id || '',
        description: recurringInvoice.description || '',
        frequency: recurringInvoice.frequency || RecurringFrequency.MONTHLY,
        start_date: recurringInvoice.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: recurringInvoice.end_date?.split('T')[0] || '',
        amount: Number(recurringInvoice.amount) || 0,
        tax_rate: Number(recurringInvoice.tax_rate) || 19,
        notes: recurringInvoice.notes || '',
      };
    }

    return {
      client_id: '',
      description: '',
      frequency: RecurringFrequency.MONTHLY,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      amount: 0,
      tax_rate: 19,
      notes: '',
    };
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecurringInvoiceFormValues>({
    defaultValues: getInitialValues(),
  });

  const watchedAmount = watch('amount') || 0;
  const watchedTaxRate = watch('tax_rate') || 0;

  const subtotal_ht = round3(Number(watchedAmount));
  const tax_amount = round3(subtotal_ht * (Number(watchedTaxRate) / 100));
  const total_ttc = round3(subtotal_ht + tax_amount + TIMBRE_FISCAL);

  const onSubmit = async (values: RecurringInvoiceFormValues) => {
    try {
      setError(null);
      const payload = {
        client_id: values.client_id,
        description: values.description,
        frequency: values.frequency,
        start_date: values.start_date,
        end_date: values.end_date || undefined,
        amount: Number(values.amount),
        tax_rate: Number(values.tax_rate),
        notes: values.notes || undefined,
      };

      if (isEdit) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving recurring invoice:', err);
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Modifier la facture récurrente' : 'Nouvelle Facture Récurrente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              {...register('client_id', { required: 'Client requis' })}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                errors.client_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un client</option>
              {clientsData?.clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-red-500 text-xs mt-1">{errors.client_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('description', { required: 'Description requise' })}
              placeholder="Ex: Abonnement mensuel"
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fréquence <span className="text-red-500">*</span>
              </label>
              <select
                {...register('frequency', { required: 'Fréquence requise' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(RECURRING_FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant HT <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                {...register('amount', { required: 'Montant requis', valueAsNumber: true })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                  errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('start_date', { required: 'Date de début requise' })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                  errors.start_date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin (optionnelle)
              </label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laisser vide pour une récurrence illimitée
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taux de TVA (%)
            </label>
            <select
              {...register('tax_rate', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="0">0%</option>
              <option value="7">7%</option>
              <option value="13">13%</option>
              <option value="19">19%</option>
            </select>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Montant HT</span>
              <span className="font-medium">{subtotal_ht.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA ({watchedTaxRate}%)</span>
              <span className="font-medium">{tax_amount.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timbre fiscal</span>
              <span className="font-medium">{TIMBRE_FISCAL.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total TTC</span>
              <span className="text-indigo-600">{total_ttc.toFixed(3)} DT</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (isEdit ? 'Modification...' : 'Création...') : (isEdit ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
