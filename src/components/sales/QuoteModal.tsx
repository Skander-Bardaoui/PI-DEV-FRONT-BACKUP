// src/components/sales/QuoteModal.tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCreateQuote, useUpdateQuote } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { CreateQuoteItemDto } from '@/types/quote';
import { useState } from 'react';
import ProductSelector from './ProductSelector';
import { Product } from '@/types/product';

const TIMBRE_FISCAL = 1.000;
const round3 = (v: number) => Math.round(v * 1000) / 1000;

interface QuoteFormValues {
  clientId: string;
  quoteDate?: string;
  validUntil?: string;
  notes?: string;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
}

interface Props {
  businessId: string;
  quote?: any;
  onClose: () => void;
}

export default function QuoteModal({ businessId, quote, onClose }: Props) {
  const create = useCreateQuote(businessId);
  const update = useUpdateQuote(businessId, quote?.id || '');
  const { data: clientsData } = useClients(businessId, { limit: 100 });
  const [error, setError] = useState<string | null>(null);
  const [itemStocks, setItemStocks] = useState<{ [key: number]: { stock: number; isStockable: boolean } }>({});

  const isEdit = !!quote;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    defaultValues: isEdit ? {
      clientId: quote.clientId || '',
      quoteDate: quote.quoteDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      validUntil: quote.validUntil?.split('T')[0] || '',
      notes: quote.notes || '',
      items: quote.items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        productId: item.productId,
      })) || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 19 }],
    } : {
      clientId: '',
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: '',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 19 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items') || [];

  const computed = (watchedItems || []).map(l => {
    const qty = Number(l?.quantity) || 0;
    const price = Number(l?.unitPrice) || 0;
    const rate = Number(l?.taxRate) || 0;
    const total = round3(qty * price);
    const tax = round3(total * (rate / 100));
    return { total, tax };
  });

  const subtotal = round3(computed.reduce((s, c) => s + (c?.total || 0), 0));
  const taxAmount = round3(computed.reduce((s, c) => s + (c?.tax || 0), 0));
  const netAmount = round3(subtotal + taxAmount + TIMBRE_FISCAL);

  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.sale_price_ht);
      setItemStocks(prev => ({
        ...prev,
        [index]: { stock: product.current_stock || 0, isStockable: product.is_stockable }
      }));
    } else {
      setValue(`items.${index}.productId`, undefined);
      setValue(`items.${index}.description`, '');
      setValue(`items.${index}.unitPrice`, 0);
      setItemStocks(prev => {
        const newStocks = { ...prev };
        delete newStocks[index];
        return newStocks;
      });
    }
  };

  const getStockWarning = (index: number) => {
    const itemStock = itemStocks[index];
    if (!itemStock || !itemStock.isStockable) return null;
    
    const quantity = Number(watchedItems[index]?.quantity) || 0;
    if (quantity > itemStock.stock) {
      return `Stock insuffisant ! Disponible: ${itemStock.stock}`;
    }
    return null;
  };

  const onSubmit = async (values: QuoteFormValues) => {
    try {
      setError(null);
      
      // Validate stock for all items
      for (let i = 0; i < values.items.length; i++) {
        const warning = getStockWarning(i);
        if (warning) {
          setError(`Ligne ${i + 1}: ${warning}`);
          return;
        }
      }
      
      const items = values.items.map((item, i) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 0,
        ...(item.productId ? { productId: item.productId } : {}),
      })) as CreateQuoteItemDto[];

      const payload = {
        clientId: values.clientId,
        quoteDate: values.quoteDate || undefined,
        validUntil: values.validUntil || undefined,
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
      console.error('Error creating quote:', err);
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la création du devis');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Modifier le devis' : 'Nouveau Devis'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                {...register('clientId', { required: 'Client requis' })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                  errors.clientId ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un client</option>
                {clientsData?.clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date du devis
              </label>
              <input
                type="date"
                {...register('quoteDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valide jusqu'au
            </label>
            <input
              type="date"
              {...register('validUntil')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Lignes</span>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 19 })}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produit *</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">Qté *</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-32">Prix HT *</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">TVA</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-28">Total HT</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => {
                    const stockWarning = getStockWarning(i);
                    return (
                    <tr key={field.id} className={stockWarning ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2">
                        <ProductSelector
                          value={watchedItems[i]?.productId}
                          onChange={(product) => handleProductSelect(i, product)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                        <input type="hidden" {...register(`items.${i}.productId`)} />
                        <input type="hidden" {...register(`items.${i}.description`, { required: true })} />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                          className={`w-full px-2 py-1 border rounded text-sm text-center ${stockWarning ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                        />
                        {stockWarning && (
                          <div className="text-xs text-red-600 mt-1">{stockWarning}</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          {...register(`items.${i}.unitPrice`, { valueAsNumber: true })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          {...register(`items.${i}.taxRate`, { valueAsNumber: true })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        >
                          <option value="0">0%</option>
                          <option value="7">7%</option>
                          <option value="13">13%</option>
                          <option value="19">19%</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {computed[i]?.total.toFixed(3)} DT
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
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">{isNaN(subtotal) ? '0.000' : subtotal.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA</span>
              <span className="font-medium">{isNaN(taxAmount) ? '0.000' : taxAmount.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timbre fiscal</span>
              <span className="font-medium">{TIMBRE_FISCAL.toFixed(3)} DT</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Net à payer</span>
              <span className="text-indigo-600">{isNaN(netAmount) ? '0.000' : netAmount.toFixed(3)} DT</span>
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
              {isSubmitting ? (isEdit ? 'Modification...' : 'Création...') : (isEdit ? 'Modifier' : 'Créer le devis')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
