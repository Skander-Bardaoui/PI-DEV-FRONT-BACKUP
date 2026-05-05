// src/components/sales/RecurringInvoiceModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar } from 'lucide-react';
import { recurringInvoiceSchema, RecurringInvoiceFormValues } from '@/schemas/sales.schemas';
import { useCreateRecurringInvoice, useUpdateRecurringInvoice } from '@/hooks/useRecurringInvoices';
import { useClients } from '@/hooks/useClients';
import { RecurringFrequency, RECURRING_FREQUENCY_LABELS, DiscountType, DISCOUNT_TYPE_LABELS } from '@/types/recurring-invoice';
import { useState, useMemo } from 'react';

const TIMBRE_FISCAL = 1.000;
const round3 = (v: number) => Math.round(v * 1000) / 1000;

// ── Composant Field avec erreur ───────────────────────────────────────────────
const Field = ({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-start gap-1.5 mt-1.5">
        <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-red-600 text-xs font-medium">{error}</p>
      </div>
    )}
  </div>
);

const inputCls = (error?: string) =>
  `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
    error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' : 'border-gray-300'
  }`;

// Fonction pour calculer les prochaines dates
function getNextDates(startDate: Date, frequency: string, count = 5): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    dates.push(new Date(current));
    switch (frequency) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }
  return dates;
}

// Fonction pour vérifier si une date est dans moins de 7 jours
function isWithinSevenDays(date: Date): boolean {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
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
      // Calculate amounts from existing data
      const amount = Number(recurringInvoice.amount) || 0;
      const taxRate = Number(recurringInvoice.tax_rate) || 19;
      const subtotal_ht = round3(amount);
      const tax_amount = round3(subtotal_ht * (taxRate / 100));
      
      return {
        client_id: recurringInvoice.client_id || '',
        frequency: recurringInvoice.frequency || 'monthly',
        start_date: recurringInvoice.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        end_date: recurringInvoice.end_date?.split('T')[0] || '',
        next_invoice_date: recurringInvoice.next_invoice_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        subtotal_ht,
        tax_amount,
        timbre_fiscal: 1.000,
        description: recurringInvoice.description || '',
        notes: recurringInvoice.notes || '',
        auto_send: recurringInvoice.auto_send || false,
      };
    }

    return {
      client_id: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      next_invoice_date: new Date().toISOString().split('T')[0],
      subtotal_ht: 0,
      tax_amount: 0,
      timbre_fiscal: 1.000,
      description: '',
      notes: '',
      auto_send: false,
    };
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecurringInvoiceFormValues>({
    resolver: zodResolver(recurringInvoiceSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: getInitialValues(),
  });

  const watchedSubtotalHt = watch('subtotal_ht') || 0;
  const watchedTaxAmount = watch('tax_amount') || 0;
  const watchedStartDate = watch('start_date');
  const watchedFrequency = watch('frequency');

  // Calculer les prochaines dates
  const nextDates = useMemo(() => {
    if (!watchedStartDate) return [];
    try {
      const startDate = new Date(watchedStartDate);
      if (isNaN(startDate.getTime())) return [];
      return getNextDates(startDate, watchedFrequency, 5);
    } catch {
      return [];
    }
  }, [watchedStartDate, watchedFrequency]);

  // Calcul des totaux
  const subtotal_ht = round3(Number(watchedSubtotalHt));
  const tax_amount = round3(Number(watchedTaxAmount));
  const total_ttc = round3(subtotal_ht + tax_amount + TIMBRE_FISCAL);

  const onSubmit = async (values: RecurringInvoiceFormValues) => {
    try {
      setError(null);
      const payload: any = {
        client_id: values.client_id,
        frequency: values.frequency,
        start_date: values.start_date,
        end_date: values.end_date || undefined,
        next_invoice_date: values.next_invoice_date,
        subtotal_ht: Number(values.subtotal_ht),
        tax_amount: Number(values.tax_amount),
        timbre_fiscal: Number(values.timbre_fiscal),
        description: values.description,
        notes: values.notes || undefined,
        auto_send: values.auto_send,
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
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
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

          <Field label="Client" error={errors.client_id?.message} required>
            <select
              {...register('client_id')}
              className={inputCls(errors.client_id?.message)}
            >
              <option value="">Sélectionner un client</option>
              {clientsData?.clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description" error={errors.description?.message} required>
            <input
              type="text"
              {...register('description')}
              placeholder="Ex: Abonnement mensuel"
              className={inputCls(errors.description?.message)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fréquence" error={errors.frequency?.message} required>
              <select
                {...register('frequency')}
                className={inputCls(errors.frequency?.message)}
              >
                <option value="monthly">Mensuel</option>
                <option value="quarterly">Trimestriel</option>
                <option value="yearly">Annuel</option>
              </select>
            </Field>

            <Field label="Envoi automatique" error={errors.auto_send?.message}>
              <div className="flex items-center h-full">
                <input
                  type="checkbox"
                  {...register('auto_send')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Envoyer automatiquement au client
                </label>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de début" error={errors.start_date?.message} required>
              <input
                type="date"
                {...register('start_date')}
                className={inputCls(errors.start_date?.message)}
              />
              
              {/* Prévisualisation des 5 prochaines dates */}
              {nextDates.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>Prochaines générations :</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nextDates.map((date, idx) => {
                      const isUrgent = isWithinSevenDays(date);
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isUrgent
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </Field>

            <Field label="Date de fin" error={errors.end_date?.message}>
              <input
                type="date"
                {...register('end_date')}
                className={inputCls(errors.end_date?.message)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Laisser vide pour une récurrence illimitée
              </p>
            </Field>
          </div>

          <Field label="Prochaine facture" error={errors.next_invoice_date?.message} required>
            <input
              type="date"
              {...register('next_invoice_date')}
              className={inputCls(errors.next_invoice_date?.message)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sous-total HT (TND)" error={errors.subtotal_ht?.message} required>
              <input
                type="number"
                step="0.001"
                {...register('subtotal_ht', { valueAsNumber: true })}
                className={inputCls(errors.subtotal_ht?.message)}
              />
            </Field>

            <Field label="Montant TVA (TND)" error={errors.tax_amount?.message} required>
              <input
                type="number"
                step="0.001"
                {...register('tax_amount', { valueAsNumber: true })}
                className={inputCls(errors.tax_amount?.message)}
              />
            </Field>
          </div>

          <Field label="Timbre fiscal (TND)" error={errors.timbre_fiscal?.message}>
            <input
              type="number"
              step="0.001"
              {...register('timbre_fiscal', { valueAsNumber: true })}
              className={inputCls(errors.timbre_fiscal?.message)}
            />
          </Field>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net HT</span>
              <span className="font-medium">{isNaN(subtotal_ht) ? '0.000' : subtotal_ht.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA</span>
              <span className="font-medium">{isNaN(tax_amount) ? '0.000' : tax_amount.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timbre fiscal</span>
              <span className="font-medium">{TIMBRE_FISCAL.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total TTC</span>
              <span className="text-indigo-600">{isNaN(total_ttc) ? '0.000' : total_ttc.toFixed(3)} DT</span>
            </div>
          </div>

          <Field label="Notes" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={3}
              className={inputCls(errors.notes?.message)}
              placeholder="Notes additionnelles..."
            />
          </Field>

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
