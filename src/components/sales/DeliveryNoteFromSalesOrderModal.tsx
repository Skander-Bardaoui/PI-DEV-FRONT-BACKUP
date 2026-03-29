// src/components/sales/DeliveryNoteFromSalesOrderModal.tsx
import { useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { X, PackageCheck } from 'lucide-react';
import { useCreateDeliveryNoteFromSalesOrder } from '@/hooks/useDeliveryNotes';
import { useToast } from '@/components/ui/Toast';
import { CreateDeliveryNoteItemDto } from '@/types/delivery-note';
import { SalesOrder } from '@/types/sales-order';


interface DeliveryNoteFormValues {
  deliveryDate: string;
  notes: string;
  items: {
    salesOrderItemId: string;
    deliveredQuantity: number;
  }[];
}

interface Props {
  businessId: string;
  salesOrder: SalesOrder;
  onClose: () => void;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const formatAmount = (amount: number) => `${amount.toFixed(2)} TND`;

export default function DeliveryNoteFromSalesOrderModal({ businessId, salesOrder, onClose }: Props) {
  const create = useCreateDeliveryNoteFromSalesOrder(businessId, salesOrder.id);
  const toast = useToast();
  const items = salesOrder.items ?? [];

  // Filter items that still need to be delivered
  const pendingItems = useMemo(() =>
    items.filter(i => {
      const ordered = Number(i.quantity) || 0;
      // Assuming we track delivered quantity on sales order items (you may need to adjust this)
      const delivered = 0; // TODO: Add delivered tracking to sales order items if needed
      return ordered > delivered;
    }), [items]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryNoteFormValues>({
    defaultValues: {
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: pendingItems.map(item => ({
        salesOrderItemId: item.id,
        deliveredQuantity: Number(item.quantity), // Pre-fill with ordered quantity
      })),
    },
  });

  const watchedItems = useWatch({ control, name: 'items' }) ?? [];

  const fillAll = useCallback(() => {
    pendingItems.forEach((item, i) => {
      const quantity = round3(Number(item.quantity));
      setValue(`items.${i}.deliveredQuantity`, quantity, { shouldValidate: true });
    });
  }, [pendingItems, setValue]);

  const totalValeur = useMemo(() => {
    return round3(
      watchedItems.reduce((sum, watchedItem, i) => {
        const soItem = pendingItems[i];
        if (!soItem) return sum;
        const qty = parseFloat(String(watchedItem?.deliveredQuantity)) || 0;
        const prix = parseFloat(String(soItem.unitPrice)) || 0;
        return sum + qty * prix;
      }, 0),
    );
  }, [watchedItems, pendingItems]);

  const hasAnyQty = watchedItems.some(i => {
    const qty = parseFloat(String(i?.deliveredQuantity));
    return !isNaN(qty) && qty > 0;
  });

  const onSubmit = async (values: DeliveryNoteFormValues) => {
    const filteredItems = values.items
      .filter(i => parseFloat(String(i.deliveredQuantity)) > 0)
      .map((i, index) => {
        const soItem = pendingItems[index];
        return {
          salesOrderItemId: i.salesOrderItemId,
          productId: soItem.productId || undefined,
          description: soItem.description,
          quantity: parseFloat(String(soItem.quantity)),
          deliveredQuantity: parseFloat(String(i.deliveredQuantity)),
        };
      }) satisfies CreateDeliveryNoteItemDto[];

    if (filteredItems.length === 0) {
      toast.error('Validation', 'Saisissez au moins une quantité livrée supérieure à 0');
      return;
    }

    try {
      await create.mutateAsync({
        clientId: salesOrder.clientId,
        deliveryDate: values.deliveryDate || undefined,
        notes: values.notes || undefined,
        items: filteredItems,
      });
      toast.success('Bon de livraison créé', `BL enregistré pour ${salesOrder.orderNumber}`);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error('Erreur', Array.isArray(msg) ? msg[0] : (msg ?? 'Impossible de créer le BL'));
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
              <h2 className="text-xl font-bold text-gray-900">Nouveau Bon de Livraison</h2>
              <p className="text-sm text-gray-500">{salesOrder.orderNumber} — {salesOrder.client?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-5">

          {errors.items?.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {errors.items.root.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de livraison <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('deliveryDate')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${errors.deliveryDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
              {errors.deliveryDate && <p className="text-red-500 text-xs mt-1">{errors.deliveryDate.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Quantités livrées</h3>
                <p className="text-xs text-gray-400 mt-0.5">Laissez à 0 pour les articles non livrés lors de cette livraison</p>
              </div>
              {pendingItems.length > 0 && (
                <button type="button" onClick={fillAll}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                  Tout livrer
                </button>
              )}
            </div>

            {pendingItems.length === 0 ? (
              <div className="text-center py-8 bg-green-50 border border-green-200 rounded-xl">
                <PackageCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Toutes les lignes ont été entièrement livrées</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Article</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium">Commandé</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium">Prix unitaire</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium text-indigo-600">
                        Livré ce jour <span className="text-red-500">*</span>
                      </th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Valeur HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingItems.map((item, i) => {
                      const maxQty = round3(Number(item.quantity));
                      const watchedQty = parseFloat(String(watchedItems[i]?.deliveredQuantity)) || 0;
                      const valeurLigne = round3(watchedQty * parseFloat(String(item.unitPrice)));
                      const qtyError = errors.items?.[i]?.deliveredQuantity;
                      const depassement = watchedQty > maxQty;

                      return (
                        <tr key={item.id} className={depassement ? 'bg-red-50' : watchedQty > 0 ? 'bg-indigo-50/30' : ''}>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {item.description}
                            {item.productId && <span className="ml-2 text-xs text-gray-400 font-mono">#{item.productId.slice(0, 8)}</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{Number(item.quantity).toFixed(3)}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{formatAmount(Number(item.unitPrice))}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number" step="0.001" min="0" max={maxQty}
                              {...register(`items.${i}.deliveredQuantity`, { valueAsNumber: true })}
                              className={`w-full px-3 py-1.5 border rounded-lg text-center focus:ring-1 focus:ring-indigo-500 text-sm font-medium ${
                                depassement ? 'border-red-400 bg-red-50 text-red-700' :
                                  watchedQty > 0 ? 'border-indigo-300 bg-white' :
                                    qtyError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                            {depassement && <p className="text-red-500 text-xs mt-0.5 text-center">Max : {maxQty.toFixed(3)}</p>}
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
                        <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-indigo-800 text-right">
                          Valeur totale livrée (HT)
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
              placeholder="Livraison conforme, emballage endommagé, manque de documents..." />
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
              {isSubmitting ? 'Enregistrement...' : 'Valider la livraison'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
