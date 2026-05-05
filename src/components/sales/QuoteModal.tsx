// src/components/sales/QuoteModal.tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, Package, Wrench } from 'lucide-react';
import { quoteSchema, QuoteFormValues } from '@/schemas/sales.schemas';
import { useCreateQuote, useUpdateQuote } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { CreateQuoteItemDto } from '@/types/quote';
import { useState } from 'react';
import ProductSelector from './ProductSelector';
import { Product, ProductType } from '@/types/product';

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

const inputSmallCls = (error?: string) =>
  `w-full px-2 py-1 border rounded text-sm transition-colors ${
    error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
  }`;

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
  const [itemTypeFilters, setItemTypeFilters] = useState<{ [key: number]: ProductType | undefined }>({});

  const isEdit = !!quote;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: isEdit ? {
      client_id: quote.clientId || '',
      valid_until: quote.validUntil?.split('T')[0] || '',
      notes: quote.notes || '',
      items: quote.items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        product_id: item.productId || '',
      })) || [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19, product_id: '' }],
    } : {
      client_id: '',
      valid_until: '',
      notes: '',
      items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 19, product_id: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items') || [];

  const computed = (watchedItems || []).map(l => {
    const qty = Number(l?.quantity) || 0;
    const price = Number(l?.unit_price) || 0;
    const rate = Number(l?.tax_rate) || 0;
    const total = round3(qty * price);
    const tax = round3(total * (rate / 100));
    return { total, tax };
  });

  const subtotal = round3(computed.reduce((s, c) => s + (c?.total || 0), 0));
  const taxAmount = round3(computed.reduce((s, c) => s + (c?.tax || 0), 0));
  const netAmount = round3(subtotal + taxAmount + TIMBRE_FISCAL);

  const handleProductTypeFilterChange = (index: number, productType: ProductType | undefined) => {
    setItemTypeFilters(prev => ({
      ...prev,
      [index]: productType
    }));
    // Clear selected product when changing filter
    setValue(`items.${index}.product_id`, '');
    setValue(`items.${index}.description`, '');
    setValue(`items.${index}.unit_price`, 0);
    setItemStocks(prev => {
      const newStocks = { ...prev };
      delete newStocks[index];
      return newStocks;
    });
  };

  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      setValue(`items.${index}.product_id`, product.id);
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unit_price`, product.sale_price_ht);
      setItemStocks(prev => ({
        ...prev,
        [index]: { stock: product.current_stock || 0, isStockable: product.is_stockable }
      }));
    } else {
      setValue(`items.${index}.product_id`, '');
      setValue(`items.${index}.description`, '');
      setValue(`items.${index}.unit_price`, 0);
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
      
      const items = values.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unit_price) || 0,
        taxRate: Number(item.tax_rate) || 0,
        ...(item.product_id ? { productId: item.product_id } : {}),
      })) as CreateQuoteItemDto[];

      const payload = {
        clientId: values.client_id,
        validUntil: values.valid_until || undefined,
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

            <Field label="Valide jusqu'au" error={errors.valid_until?.message} required>
              <input
                type="date"
                {...register('valid_until')}
                className={inputCls(errors.valid_until?.message)}
              />
            </Field>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">Lignes</span>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 19, product_id: '' })}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>

            {errors.items?.message && (
              <div className="text-red-600 text-sm mb-2 flex items-center gap-1.5">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.items.message}
              </div>
            )}

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type & Produit *</th>
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
                    const hasError = errors.items?.[i];
                    return (
                    <tr key={field.id} className={stockWarning || hasError ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2">
                        {/* Product Type Filter */}
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => handleProductTypeFilterChange(i, undefined)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                              !itemTypeFilters[i] 
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Tous
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProductTypeFilterChange(i, ProductType.PHYSICAL)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                              itemTypeFilters[i] === ProductType.PHYSICAL 
                                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Package className="h-3 w-3" />
                            Produit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProductTypeFilterChange(i, ProductType.SERVICE)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
                              itemTypeFilters[i] === ProductType.SERVICE 
                                ? 'bg-green-100 border-green-300 text-green-700' 
                                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Wrench className="h-3 w-3" />
                            Service
                          </button>
                        </div>
                        
                        {/* Product Selector */}
                        <ProductSelector
                          businessId={businessId}
                          value={watchedItems[i]?.product_id}
                          onChange={(product) => handleProductSelect(i, product)}
                          className={inputSmallCls(errors.items?.[i]?.product_id?.message)}
                          filterByType={itemTypeFilters[i]}
                          showType={false} // Hide type in dropdown since we have buttons
                        />
                        <input type="hidden" {...register(`items.${i}.product_id`)} />
                        <input type="hidden" {...register(`items.${i}.description`)} />
                        {errors.items?.[i]?.description?.message && (
                          <p className="text-red-600 text-xs mt-1">{errors.items[i]?.description?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                          className={inputSmallCls(errors.items?.[i]?.quantity?.message || stockWarning)}
                        />
                        {stockWarning && (
                          <div className="text-xs text-red-600 mt-1">{stockWarning}</div>
                        )}
                        {errors.items?.[i]?.quantity?.message && (
                          <p className="text-red-600 text-xs mt-1">{errors.items[i]?.quantity?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                          className={`${inputSmallCls(errors.items?.[i]?.unit_price?.message)} text-right`}
                        />
                        {errors.items?.[i]?.unit_price?.message && (
                          <p className="text-red-600 text-xs mt-1">{errors.items[i]?.unit_price?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          {...register(`items.${i}.tax_rate`, { valueAsNumber: true })}
                          className={`${inputSmallCls(errors.items?.[i]?.tax_rate?.message)} text-center`}
                        >
                          <option value="0">0%</option>
                          <option value="7">7%</option>
                          <option value="13">13%</option>
                          <option value="19">19%</option>
                        </select>
                        {errors.items?.[i]?.tax_rate?.message && (
                          <p className="text-red-600 text-xs mt-1">{errors.items[i]?.tax_rate?.message}</p>
                        )}
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
              {isSubmitting ? (isEdit ? 'Modification...' : 'Création...') : (isEdit ? 'Modifier' : 'Créer le devis')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}