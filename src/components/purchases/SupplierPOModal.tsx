// src/components/purchases/SupplierPOModal.tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { supplierPOSchema, SupplierPOFormValues } from '@/schemas/purchases.schemas';
import { useSuppliers }        from '@/hooks/useSuppliers';
import { useCreateSupplierPO } from '@/hooks/useSupplierPOs';
import { CreateSupplierPOItemDto, formatAmount, round3, TIMBRE_FISCAL, TVA_RATES } from '@/types';

const inputCls = (error?: string) =>
  `w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-200'
  }`;

interface Props { businessId: string; onClose: () => void; }

export default function SupplierPOModal({ businessId, onClose }: Props) {
  const { data: suppliersData } = useSuppliers(businessId, { is_active: true, limit: 100 });
  const create = useCreateSupplierPO(businessId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierPOFormValues>({
    resolver: zodResolver(supplierPOSchema),
    defaultValues: {
      supplier_id:       '',
      expected_delivery: '',
      notes:             '',
      items: [{ description: '', quantity_ordered: 1, unit_price_ht: 0, tax_rate_value: 19 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const computed = watchedItems.map(l => {
    const ht  = round3((l.quantity_ordered || 0) * (l.unit_price_ht || 0));
    const tax = round3(ht * ((l.tax_rate_value || 0) / 100));
    return { ht, tax };
  });
  const subtotal_ht = round3(computed.reduce((s, c) => s + c.ht,  0));
  const tax_amount  = round3(computed.reduce((s, c) => s + c.tax, 0));
  const net_amount  = round3(subtotal_ht + tax_amount + TIMBRE_FISCAL);

  const onSubmit = async (values: SupplierPOFormValues) => {
    // FIX: Zod infère description / quantity_ordered / unit_price_ht / tax_rate_value
    // comme optionnels (string | undefined, number | undefined) car le schéma utilise
    // .trim().min(1) et z.coerce.number() qui acceptent des états intermédiaires.
    // CreateSupplierPOItemDto exige tous ces champs comme requis.
    // On mappe donc chaque item explicitement avec les types corrects et on
    // utilise `satisfies` pour vérifier statiquement la compatibilité.
    const items = values.items.map((item, i) => ({
      description:      item.description      as string,
      quantity_ordered: Number(item.quantity_ordered) || 0,
      unit_price_ht:    Number(item.unit_price_ht)    || 0,
      tax_rate_value:   Number(item.tax_rate_value)   || 0,
      sort_order:       i,
      ...(item.product_id ? { product_id: item.product_id } : {}),
    })) satisfies CreateSupplierPOItemDto[];

    await create.mutateAsync({
      supplier_id:       values.supplier_id,
      expected_delivery: values.expected_delivery || undefined,
      notes:             values.notes             || undefined,
      items,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Nouveau Bon de Commande</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fournisseur <span className="text-red-500">*</span>
              </label>
              <select
                {...register('supplier_id')}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                  errors.supplier_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliersData?.data.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="text-red-500 text-xs mt-1">{errors.supplier_id.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Livraison souhaitée
              </label>
              <input
                type="date"
                {...register('expected_delivery')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">Lignes</span>
                {errors.items?.root && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.items.root.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => append({ description: '', quantity_ordered: 1, unit_price_ht: 0, tax_rate_value: 19 })}
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
                          {...register(`items.${i}.description`)}
                          className={inputCls(errors.items?.[i]?.description?.message)}
                          placeholder="Description"
                        />
                        {errors.items?.[i]?.description && (
                          <p className="text-red-500 text-xs mt-0.5">
                            {errors.items[i]?.description?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" step="0.001" min="0.001"
                          {...register(`items.${i}.quantity_ordered`, { valueAsNumber: true })}
                          className={inputCls(errors.items?.[i]?.quantity_ordered?.message) + ' text-center'}
                        />
                        {errors.items?.[i]?.quantity_ordered && (
                          <p className="text-red-500 text-xs mt-0.5">
                            {errors.items[i]?.quantity_ordered?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" step="0.001" min="0"
                          {...register(`items.${i}.unit_price_ht`, { valueAsNumber: true })}
                          className={inputCls(errors.items?.[i]?.unit_price_ht?.message) + ' text-right'}
                        />
                        {errors.items?.[i]?.unit_price_ht && (
                          <p className="text-red-500 text-xs mt-0.5">
                            {errors.items[i]?.unit_price_ht?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          {...register(`items.${i}.tax_rate_value`, { valueAsNumber: true })}
                          className={inputCls(errors.items?.[i]?.tax_rate_value?.message)}
                        >
                          {TVA_RATES.map(r => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                        {computed[i]?.ht.toFixed(3)}
                      </td>
                      <td className="px-4 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="p-1 text-gray-400 hover:text-red-500"
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
          <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span>
                <span>{subtotal_ht.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA</span>
                <span>{tax_amount.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Timbre fiscal</span>
                <span>{TIMBRE_FISCAL.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Net TTC</span>
                <span>{formatAmount(net_amount)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Instructions particulières..."
            />
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : 'Créer le BC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}