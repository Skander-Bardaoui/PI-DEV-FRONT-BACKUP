// src/components/sales/DeliveryNoteModal.tsx
import { useFieldArray, useForm } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCreateDeliveryNote, useUpdateDeliveryNote } from '@/hooks/useDeliveryNotes';
import { useClients } from '@/hooks/useClients';
import { useSalesOrders } from '@/hooks/useSalesOrders';
import { CreateDeliveryNoteItemDto } from '@/types/delivery-note';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ProductSelector from './ProductSelector';
import { Product } from '@/types/product';

interface DeliveryNoteFormValues {
  clientId: string;
  salesOrderId?: string;
  deliveryDate?: string;
  notes?: string;
  items: {
    productId?: string;
    salesOrderItemId?: string;
    description: string;
    quantity: number;
    deliveredQuantity: number;
  }[];
}

interface Props {
  businessId: string;
  note?: any;
  onClose: () => void;
}

export default function DeliveryNoteModal({ businessId, note, onClose }: Props) {
  const create = useCreateDeliveryNote(businessId);
  const update = useUpdateDeliveryNote(businessId, note?.id || '');
  const { data: clientsData } = useClients(businessId, { limit: 100 });
  const { data: ordersData } = useSalesOrders(businessId, { limit: 100 });
  const [error, setError] = useState<string | null>(null);
  const [itemStocks, setItemStocks] = useState<{ [key: number]: { stock: number; isStockable: boolean } }>({});

  const isEdit = !!note;

  // Track whether the order-items effect has already run once (create mode only)
  const orderItemsPopulated = useRef(false);

  // Deduplicate items helper
  const deduplicateItems = useCallback((items: any[]) => {
    return items.reduce((acc: any[], item: any) => {
      const existing = acc.find(
        (i: any) =>
          i.description?.trim().toLowerCase() === item.description?.trim().toLowerCase(),
      );
      if (existing) {
        // Keep the one with higher deliveredQuantity
        if (Number(item.deliveredQuantity) > Number(existing.deliveredQuantity)) {
          const index = acc.indexOf(existing);
          acc[index] = item;
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  }, []);

  // Compute default values — stable, runs only once on mount
  const defaultValues = useMemo((): DeliveryNoteFormValues => {
    if (isEdit && note) {
      const uniqueItems = deduplicateItems(note.items ?? []);
      return {
        clientId: note.clientId || '',
        salesOrderId: note.salesOrderId || '',
        deliveryDate: note.deliveryDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: note.notes || '',
        items: uniqueItems.map((item: any) => ({
          description: item.description,
          quantity: Number(item.quantity),
          deliveredQuantity: Number(item.deliveredQuantity),
          productId: item.productId ?? undefined,
          salesOrderItemId: item.salesOrderItemId ?? undefined,
        })),
      };
    }

    return {
      clientId: '',
      salesOrderId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ description: '', quantity: 1, deliveredQuantity: 1 }],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only compute once on mount

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryNoteFormValues>({
    defaultValues,
    mode: 'onChange',
    shouldUnregister: false,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
    keyName: 'fieldId',
  });

  const watchedSalesOrderId = watch('salesOrderId');
  const watchedItems = watch('items') || [];

  // ─── KEY FIX ────────────────────────────────────────────────────────────────
  // Only populate items from order in CREATE mode, and only once per order
  // selection (guarded by the ref). In EDIT mode this effect never runs.
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Never auto-populate in edit mode
    if (isEdit) return;
    // Only run when we have an order selected and the orders data is loaded
    if (!watchedSalesOrderId || !ordersData?.data) return;
    // Don't run again if we already populated for this selection
    if (orderItemsPopulated.current) return;

    const selectedOrder = ordersData.data.find((o: any) => o.id === watchedSalesOrderId);
    if (selectedOrder?.items) {
      const orderItems = selectedOrder.items.map((item: any) => ({
        salesOrderItemId: item.id,
        productId: item.productId,
        description: item.description,
        quantity: Number(item.quantity),
        deliveredQuantity: Number(item.quantity),
      }));
      replace(orderItems);
      setValue('clientId', selectedOrder.clientId);
      orderItemsPopulated.current = true;
    }
  }, [watchedSalesOrderId, ordersData, isEdit, replace, setValue]);

  // Reset the guard when the user picks a different order (create mode)
  useEffect(() => {
    if (!isEdit) {
      orderItemsPopulated.current = false;
    }
  }, [watchedSalesOrderId, isEdit]);

  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.description`, product.name);
      setItemStocks(prev => ({
        ...prev,
        [index]: { stock: product.current_stock || 0, isStockable: product.is_stockable }
      }));
    } else {
      setValue(`items.${index}.productId`, undefined);
      setValue(`items.${index}.description`, '');
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
    
    const quantity = Number(watchedItems[index]?.deliveredQuantity) || 0;
    if (quantity > itemStock.stock) {
      return `Stock insuffisant ! Disponible: ${itemStock.stock}`;
    }
    return null;
  };

  const onSubmit = async (values: DeliveryNoteFormValues) => {
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
        deliveredQuantity: Number(item.deliveredQuantity) || 0,
        ...(item.productId ? { productId: item.productId } : {}),
        ...(item.salesOrderItemId ? { salesOrderItemId: item.salesOrderItemId } : {}),
      })) as CreateDeliveryNoteItemDto[];

      const payload = {
        clientId: values.clientId,
        salesOrderId: values.salesOrderId || undefined,
        deliveryDate: values.deliveryDate || undefined,
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
      console.error('❌ Erreur bon de livraison:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Erreur lors de l'opération",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Modifier le bon de livraison' : 'Nouveau bon de livraison'}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commande client
              </label>
              <select
                {...register('salesOrderId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                disabled={isEdit}
              >
                <option value="">Sélectionner une commande (optionnel)</option>
                {ordersData?.data?.map((order: any) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.client?.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez une commande pour lier automatiquement les articles
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              {watchedSalesOrderId || isEdit ? (
                <>
                  <input
                    type="hidden"
                    {...register('clientId', { required: 'Client requis' })}
                  />
                  <select
                    value={watch('clientId')}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  >
                    <option value="">Sélectionner un client</option>
                    {clientsData?.clients?.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le client ne peut pas être modifié
                  </p>
                </>
              ) : (
                <>
                  <select
                    {...register('clientId', { required: 'Client requis' })}
                    className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${
                      errors.clientId ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un client</option>
                    {clientsData?.clients?.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de livraison
              </label>
              <input
                type="date"
                {...register('deliveryDate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">Articles livrés</span>
                {watchedSalesOrderId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Articles liés à la commande — Modifiez les quantités livrées selon la
                    livraison réelle
                  </p>
                )}
              </div>
              {!watchedSalesOrderId && (
                <button
                  type="button"
                  onClick={() =>
                    append({ description: '', quantity: 1, deliveredQuantity: 1 })
                  }
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      Produit *
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-32">
                      Qté commandée
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-green-600 w-32 bg-green-50">
                      Qté livrée *
                      <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                        Modifiable
                      </div>
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => {
                    const stockWarning = getStockWarning(i);
                    return (
                    <tr key={field.fieldId} className={stockWarning ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2">
                        <ProductSelector
                          value={watchedItems[i]?.productId}
                          onChange={(product) => handleProductSelect(i, product)}
                          disabled={!!watchedSalesOrderId}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                        <input type="hidden" {...register(`items.${i}.productId`)} />
                        <input type="hidden" {...register(`items.${i}.description`, { required: true })} />
                        <input type="hidden" {...register(`items.${i}.salesOrderItemId`)} />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-center bg-gray-50"
                          disabled={!!watchedSalesOrderId}
                          readOnly={!!watchedSalesOrderId}
                        />
                      </td>
                      <td className="px-4 py-2 bg-green-50/30">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          {...register(`items.${i}.deliveredQuantity`, {
                            required: 'Quantité livrée requise',
                            setValueAs: (v) => (v === '' ? 0 : parseFloat(v)),
                          })}
                          className={`w-full px-2 py-1.5 border-2 rounded text-sm text-center font-semibold focus:ring-2 ${
                            stockWarning 
                              ? 'border-red-500 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-200' 
                              : 'border-green-300 text-green-700 focus:border-green-500 focus:ring-green-200'
                          }`}
                          placeholder="0.000"
                        />
                        {stockWarning && (
                          <div className="text-xs text-red-600 mt-1 font-semibold">{stockWarning}</div>
                        )}
                        {errors.items?.[i]?.deliveredQuantity && (
                          <p className="text-red-500 text-[10px] mt-0.5">Requis</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {fields.length > 1 && !watchedSalesOrderId && (
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
              {isSubmitting
                ? isEdit
                  ? 'Modification...'
                  : 'Création...'
                : isEdit
                  ? 'Modifier'
                  : 'Créer le bon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}