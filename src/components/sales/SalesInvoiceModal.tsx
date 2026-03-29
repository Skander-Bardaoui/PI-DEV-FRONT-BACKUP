// src/components/sales/SalesInvoiceModal.tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCreateSalesInvoice, useUpdateSalesInvoice } from '@/hooks/useSalesInvoices';
import { useClients } from '@/hooks/useClients';
import { CreateSalesInvoiceItemDto, SalesInvoiceType } from '@/types/sales-invoice';
import { useState } from 'react';

const TIMBRE_FISCAL = 1.000;
const round3 = (v: number) => Math.round(v * 1000) / 1000;

interface SalesInvoiceFormValues {
  client_id: string;
  type: SalesInvoiceType;
  original_invoice_id?: string;
  date?: string;
  due_date?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate_value: number;
  }[];
}

interface Props {
  businessId: string;
  invoice?: any;
  onClose: () => void;
}

export default function SalesInvoiceModal({ businessId, invoice, onClose }: Props) {
  const create = useCreateSalesInvoice(businessId);
  const update = useUpdateSalesInvoice(businessId, invoice?.id || '');
  const { data: clientsData } = useClients(businessId, { limit: 100 });
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!invoice;

  const getInitialValues = () => {
    if (isEdit) {
      return {
        client_id: invoice.client_id || '',
        type: invoice.type || SalesInvoiceType.NORMAL,
        original_invoice_id: invoice.original_invoice_id || '',
        date: invoice.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date?.split('T')[0] || '',
        notes: invoice.notes || '',
        items: invoice.items?.map((item: any) => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          tax_rate_value: item.tax_rate_value || 19,
        })) || [{ description: '', quantity: 1, unit_price: 0, tax_rate_value: 19 }],
      };
    }

    return {
      client_id: '',
      type: SalesInvoiceType.NORMAL,
      original_invoice_id: '',
      date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate_value: 19 }],
    };
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SalesInvoiceFormValues>({
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items') || [];
  const watchedType = watch('type');

  const computed = (watchedItems || []).map(l => {
    const ht = round3((l?.quantity || 0) * (l?.unit_price || 0));
    const tax = round3(ht * ((l?.tax_rate_value || 0) / 100));
    return { ht, tax };
  });

  const subtotal_ht = round3(computed.reduce((s, c) => s + (c?.ht || 0), 0));
  const tax_amount = round3(computed.reduce((s, c) => s + (c?.tax || 0), 0));
  const net_amount = round3(subtotal_ht + tax_amount + TIMBRE_FISCAL);

  const onSubmit = async (values: SalesInvoiceFormValues) => {
    try {
      setError(null);
      const items = values.items.map((item, i) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        tax_rate_value: Number(item.tax_rate_value) || 0,
        sort_order: i,
      })) as CreateSalesInvoiceItemDto[];

      const payload = {
        client_id: values.client_id,
        type: values.type || SalesInvoiceType.NORMAL,
        original_invoice_id: values.type === SalesInvoiceType.AVOIR ? values.original_invoice_id : undefined,
        date: values.date || undefined,
        due_date: values.due_date || undefined,
        notes: values.notes || undefined,
        items,
      };

      if (isEdit) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating sales invoice:', err);
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la création de la facture');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier la facture' : 'Nouvelle Facture'}</h2>
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

          <div className="grid grid-cols-2 gap-4">
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
                Type de facture <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type', { required: 'Type requis' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value={SalesInvoiceType.NORMAL}>Facture normale</option>
                <option value={SalesInvoiceType.AVOIR}>Avoir (remboursement)</option>
                <option value={SalesInvoiceType.PROFORMA}>Facture proforma</option>
                <option value={SalesInvoiceType.ACOMPTE}>Facture d'acompte</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de facture
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {watchedType === SalesInvoiceType.AVOIR && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facture d'origine (pour avoir)
              </label>
              <input
                type="text"
                {...register('original_invoice_id')}
                placeholder="ID de la facture d'origine"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optionnel : ID de la facture originale pour laquelle cet avoir est créé
              </p>
            </div>
          )}

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Lignes</span>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate_value: 19 })}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Description *</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">Qté *</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-32">Prix HT *</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">TVA</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">Total HT</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => (
                    <tr key={field.id}>
                      <td className="px-4 py-2">
                        <input
                          {...register(`items.${i}.description`, { required: true })}
                          placeholder="Description"
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          {...register(`items.${i}.tax_rate_value`, { valueAsNumber: true })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        >
                          <option value="0">0%</option>
                          <option value="7">7%</option>
                          <option value="13">13%</option>
                          <option value="19">19%</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {computed[i]?.ht.toFixed(3)} DT
                      </td>
                      <td className="px-4 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">{subtotal_ht.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA</span>
              <span className="font-medium">{tax_amount.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timbre fiscal</span>
              <span className="font-medium">{TIMBRE_FISCAL.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Net à payer</span>
              <span className="text-indigo-600">{net_amount.toFixed(3)} DT</span>
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
              {isSubmitting ? (isEdit ? 'Modification...' : 'Création...') : (isEdit ? 'Modifier' : 'Créer la facture')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
