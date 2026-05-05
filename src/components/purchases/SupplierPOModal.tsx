// src/components/purchases/SupplierPOModal.tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { supplierPOSchema, SupplierPOFormValues } from '@/schemas/purchases.schemas';
import { useSuppliers }        from '@/hooks/useSuppliers';
import { useCreateSupplierPO } from '@/hooks/useSupplierPOs';
import { CreateSupplierPOItemDto, formatAmount, round3, TIMBRE_FISCAL, TVA_RATES } from '@/types';
import ProductSelectorPurchase from './ProductSelectorPurchase';
import { Product } from '@/types/product';
import SupplierRecommendationPanel from './SupplierRecommendationPanel';
import { useAuth } from '@/hooks/useAuth';

const inputCls = (error?: string) =>
  `w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-200'
  }`;

interface Props { 
  businessId: string; 
  onClose: () => void;
  mlPrediction?: {
    productId: string;
    productName: string;
    quantity: number;
    estimatedValue: number;
    urgency: string;
    recommendation: string;
  } | null;
}

export default function SupplierPOModal({ businessId, onClose, mlPrediction }: Props) {
  const { data: suppliersData } = useSuppliers(businessId, { is_active: true, limit: 100 });
  const create = useCreateSupplierPO(businessId);

  // Debug: logger les données ML reçues
  console.log('🔍 SupplierPOModal - mlPrediction reçu:', mlPrediction);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SupplierPOFormValues>({
    resolver: zodResolver(supplierPOSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: mlPrediction ? {
      supplier_id:       '',
      expected_delivery: '',
      notes:             `Recommandation ML: ${mlPrediction.recommendation}`,
      items: [{
        product_id: mlPrediction.productId,
        description: mlPrediction.productName,
        quantity_ordered: mlPrediction.quantity,
        unit_price_ht: 0,
        tax_rate_value: 19
      }],
    } : {
      supplier_id:       '',
      expected_delivery: '',
      notes:             '',
      items: [{ description: '', quantity_ordered: 1, unit_price_ht: 0, tax_rate_value: 19 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  // Extraire les noms de produits pour la recommandation IA
  const productNames = watchedItems
    .map(item => item.description)
    .filter(desc => desc && desc.trim().length > 0)
    .join(', ');

  const computed = watchedItems.map(l => {
    const ht  = round3((l.quantity_ordered || 0) * (l.unit_price_ht || 0));
    const tax = round3(ht * ((l.tax_rate_value || 0) / 100));
    return { ht, tax };
  });
  const subtotal_ht = round3(computed.reduce((s, c) => s + c.ht,  0));
  const tax_amount  = round3(computed.reduce((s, c) => s + c.tax, 0));
  const net_amount  = round3(subtotal_ht + tax_amount + TIMBRE_FISCAL);

  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      setValue(`items.${index}.product_id`, product.id);
      setValue(`items.${index}.description`, product.name);
      // Ne pas pré-remplir le prix - l'utilisateur doit saisir le prix d'achat
      // car product.purchase_price_ht est le prix de vente, pas le prix d'achat
    } else {
      setValue(`items.${index}.product_id`, undefined);
      setValue(`items.${index}.description`, '');
      setValue(`items.${index}.unit_price_ht`, 0);
    }
  };

  const onSubmit = async (values: SupplierPOFormValues) => {
    try {
      const items = values.items.map((item, i) => ({
        description:      item.description      as string,
        quantity_ordered: Number(item.quantity_ordered) || 0,
        unit_price_ht:    Number(item.unit_price_ht)    || 0,
        tax_rate_value:   Number(item.tax_rate_value)   || 0,
        sort_order:       i,
        product_id:       item.product_id, // ✅ Always include product_id (now required)
      })) satisfies CreateSupplierPOItemDto[];

      const payload = {
        supplier_id:       values.supplier_id,
        expected_delivery: values.expected_delivery || undefined,
        notes:             values.notes             || undefined,
        items,
        // Ajouter l'info ML si présente
        ...(mlPrediction ? { ml_product_id: mlPrediction.productId } : {}),
      };

      console.log('📤 Sending PO payload:', payload);
      console.log('📦 Items count:', items.length);

      const createdPO = await create.mutateAsync(payload);
      
      // Si c'est une création depuis ML, marquer comme traité
      if (mlPrediction && createdPO) {
        console.log('✅ BC créé depuis ML, marquage comme traité');
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création du BC:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await trigger();
    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else {
      handleSubmit(onSubmit)();
    }
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

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5" noValidate>

          {/* Badge ML si données présentes */}
          {mlPrediction && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-900 mb-1">
                    🤖 Bon de commande suggéré par l'IA
                  </h3>
                  <p className="text-sm text-purple-700">
                    Produit: <span className="font-medium">{mlPrediction.productName}</span> • 
                    Quantité: <span className="font-medium">{mlPrediction.quantity} unités</span> • 
                    Urgence: <span className="font-medium">{mlPrediction.urgency}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur global */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Erreurs de validation
                  </h3>
                  <p className="text-sm text-red-700">
                    Veuillez corriger les erreurs ci-dessous avant de continuer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Panneau de recommandation IA */}
          <SupplierRecommendationPanel
            businessId={businessId}
            selectedSupplierId={watch('supplier_id')}
            onSelectSupplier={(supplierId) => setValue('supplier_id', supplierId)}
            productName={productNames || undefined}
          />

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
                <div className="flex items-start gap-1.5 mt-1.5">
                  <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-600 text-xs font-medium">{errors.supplier_id.message}</p>
                </div>
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produit *</th>
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
                        <ProductSelectorPurchase
                          businessId={businessId}
                          value={watchedItems[i]?.product_id}
                          onChange={(product) => handleProductSelect(i, product)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                        <input type="hidden" {...register(`items.${i}.product_id`)} />
                        <input type="hidden" {...register(`items.${i}.description`, { required: true })} />
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