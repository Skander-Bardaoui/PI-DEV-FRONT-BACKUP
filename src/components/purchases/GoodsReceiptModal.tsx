// src/components/purchases/GoodsReceiptModal.tsx
import { useMemo, useCallback } from 'react';
import { useForm, useWatch }    from 'react-hook-form';
import { zodResolver }          from '@hookform/resolvers/zod';
import { X, PackageCheck }      from 'lucide-react';
import { createGoodsReceiptSchema, GoodsReceiptFormValues } from '@/schemas/purchases.schemas';
import { useCreateGoodsReceipt } from '@/hooks/useGoodsReceipts';
import { useToast }              from '@/components/ui/Toast';
import { CreateGoodsReceiptItemDto, SupplierPO, formatAmount, round3 } from '@/types';

interface Props {
  businessId: string;
  po:         SupplierPO;
  onClose:    () => void;
}

export default function GoodsReceiptModal({ businessId, po, onClose }: Props) {
  const create = useCreateGoodsReceipt(businessId, po.id);
  const toast  = useToast();
  const items  = po.items ?? [];

  const pendingItems = useMemo(() =>
    items.filter(i =>
      Number(i.quantity_ordered) > 0 &&
      Number(i.quantity_received) < Number(i.quantity_ordered)
    ), [items]);

  // Créer le schéma avec la date du bon de commande
  const goodsReceiptSchema = useMemo(() => 
    createGoodsReceiptSchema(po.created_at?.split('T')[0]), 
    [po.created_at]
  );

  const {
    register, handleSubmit, setValue, control, trigger,
    formState: { errors, isSubmitting },
  } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      receipt_date: new Date().toISOString().split('T')[0],
      notes:        '',
      items: pendingItems.map(item => ({
        supplier_po_item_id: item.id,
        quantity_received:   0,
      })),
    },
  });

  // FIX : useWatch au lieu de watch()
  // watch() retourne le même objet référence → useMemo ne se recalcule jamais
  // useWatch crée une vraie subscription React → re-render à chaque keystroke
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];

  const fillAll = useCallback(() => {
    pendingItems.forEach((item, i) => {
      const reliquat = round3(Number(item.quantity_ordered) - Number(item.quantity_received));
      setValue(`items.${i}.quantity_received`, reliquat, { shouldValidate: true });
    });
  }, [pendingItems, setValue]);

  const totalValeur = useMemo(() => {
    return round3(
      watchedItems.reduce((sum, watchedItem, i) => {
        const poItem = pendingItems[i];
        if (!poItem) return sum;
        const qty  = parseFloat(String(watchedItem?.quantity_received)) || 0;
        const prix = parseFloat(String(poItem.unit_price_ht)) || 0;
        return sum + qty * prix;
      }, 0),
    );
  }, [watchedItems, pendingItems]);

  const hasAnyQty = watchedItems.some(i => {
    const qty = parseFloat(String(i?.quantity_received));
    return !isNaN(qty) && qty > 0;
  });

  const onSubmit = async (values: GoodsReceiptFormValues) => {
    const filteredItems = values.items
      .filter(i => parseFloat(String(i.quantity_received)) > 0)
      .map(i => ({
        supplier_po_item_id: i.supplier_po_item_id as string,
        quantity_received:   parseFloat(String(i.quantity_received)),
      })) satisfies CreateGoodsReceiptItemDto[];

    if (filteredItems.length === 0) {
      toast.error('Validation', 'Saisissez au moins une quantité reçue supérieure à 0');
      return;
    }

    try {
      await create.mutateAsync({
        receipt_date: values.receipt_date || undefined,
        notes:        values.notes        || undefined,
        items:        filteredItems,
      });
      toast.success('Bon de réception créé', `BR enregistré pour ${po.po_number}`);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error('Erreur', Array.isArray(msg) ? msg[0] : (msg ?? 'Impossible de créer le BR'));
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <PackageCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nouveau Bon de Réception</h2>
              <p className="text-sm text-gray-500">{po.po_number} — {po.supplier?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleFormSubmit} noValidate className="p-6 space-y-5">

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
                  <h3 className="text-sm font-medium text-red-800 mb-1">Erreurs de validation</h3>
                  <p className="text-sm text-red-700">Veuillez corriger les erreurs ci-dessous avant de continuer.</p>
                </div>
              </div>
            </div>
          )}

          {errors.items?.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {errors.items.root.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de réception <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                {...register('receipt_date')}
                min={po.created_at?.split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${errors.receipt_date ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} 
              />
              {errors.receipt_date && <p className="text-red-500 text-xs mt-1">{errors.receipt_date.message}</p>}
              {po.created_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Date minimale : {new Date(po.created_at).toLocaleDateString('fr-FR')} (date du BC)
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Quantités reçues</h3>
                <p className="text-xs text-gray-400 mt-0.5">Laissez à 0 pour les articles non livrés lors de cette réception</p>
              </div>
              {pendingItems.length > 0 && (
                <button type="button" onClick={fillAll}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                  Tout recevoir
                </button>
              )}
            </div>

            {pendingItems.length === 0 ? (
              <div className="text-center py-8 bg-green-50 border border-green-200 rounded-xl">
                <PackageCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Toutes les lignes ont été entièrement réceptionnées</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Article</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium">Commandé</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium">Déjà reçu</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium text-orange-600">Reliquat</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium text-indigo-600">
                        Reçu ce jour <span className="text-red-500">*</span>
                      </th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Valeur HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingItems.map((item, i) => {
                      const reliquat    = round3(Number(item.quantity_ordered) - Number(item.quantity_received));
                      const watchedQty  = parseFloat(String(watchedItems[i]?.quantity_received)) || 0;
                      const valeurLigne = round3(watchedQty * parseFloat(String(item.unit_price_ht)));
                      const qtyError    = errors.items?.[i]?.quantity_received;
                      const depassement = watchedQty > reliquat;

                      return (
                        <tr key={item.id} className={depassement ? 'bg-red-50' : watchedQty > 0 ? 'bg-indigo-50/30' : ''}>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {item.description}
                            {item.product_id && <span className="ml-2 text-xs text-gray-400 font-mono">#{item.product_id.slice(0,8)}</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{Number(item.quantity_ordered).toFixed(3)}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{Number(item.quantity_received).toFixed(3)}</td>
                          <td className="px-4 py-3 text-center font-medium text-orange-600">{reliquat.toFixed(3)}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number" step="0.001" min="0" max={reliquat}
                              {...register(`items.${i}.quantity_received`, { valueAsNumber: true })}
                              className={`w-full px-3 py-1.5 border rounded-lg text-center focus:ring-1 focus:ring-indigo-500 text-sm font-medium ${
                                depassement    ? 'border-red-400 bg-red-50 text-red-700' :
                                watchedQty > 0 ? 'border-indigo-300 bg-white' :
                                qtyError       ? 'border-red-400 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                            {depassement && <p className="text-red-500 text-xs mt-0.5 text-center">Max : {reliquat.toFixed(3)}</p>}
                            {qtyError && !depassement && <p className="text-red-500 text-xs mt-0.5">{qtyError.message}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 font-medium">
                            {watchedQty > 0 ? formatAmount(valeurLigne) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {hasAnyQty && (
                    <tfoot>
                      <tr className="bg-indigo-50 border-t border-indigo-200">
                        <td colSpan={5} className="px-4 py-2.5 text-sm font-semibold text-indigo-800 text-right">
                          Valeur totale reçue (HT)
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-indigo-800">
                          {formatAmount(totalValeur)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observations / Remarques</label>
            <textarea rows={2} {...register('notes')}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${errors.notes ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="Marchandises conformes, emballage endommagé, manque de documents..." />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit"
              disabled={isSubmitting || pendingItems.length === 0 || !hasAnyQty}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium">
              {isSubmitting ? 'Enregistrement...' : 'Valider la réception'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}