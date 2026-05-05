// src/components/sales/DeliveryNoteDetailModal.tsx
import { X, Package, ChevronDown, ChevronUp, Edit, Trash2, Truck, XCircle, ShoppingCart, FileText } from 'lucide-react';
import { useState } from 'react';
import { DeliveryNote, DELIVERY_NOTE_STATUS_COLORS, DELIVERY_NOTE_STATUS_LABELS, DeliveryNoteStatus } from '@/types/delivery-note';
import {
  useMarkDelivered,
  useCancelDeliveryNote,
  useDeliveryNote,
  useCleanDuplicates,
} from '@/hooks/useDeliveryNotes';
import { useSalesOrder } from '@/hooks/useSalesOrders';
import DeliveryNoteModal from './DeliveryNoteModal';
import ConfirmModal from '../ui/ConfirmModal';
import PDFButton from '../purchases/PDFButton';
import { printDeliveryNote } from '@/utils/delivery-note-print';
import { useAuth } from '@/hooks/useAuth';
import { ActionButton, ActionSection } from '../ui/ActionButton';
import { getBusinessInfo } from '@/utils/business-info.utils';

interface Props {
  note: DeliveryNote;
  businessId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function DeliveryNoteDetailModal({ note: initialNote, businessId, onClose, onDelete }: Props) {
  const [showItems, setShowItems] = useState(true);
  const [showSalesOrderItems, setShowSalesOrderItems] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { user } = useAuth();

  // Fetch full note details with items
  const { data: fullNote, isLoading, refetch } = useDeliveryNote(businessId, initialNote.id);
  const note = fullNote || initialNote;

  // Fetch sales order if linked
  const shouldFetchSalesOrder = !!note.salesOrderId;
  const { data: salesOrder } = useSalesOrder(
    businessId, 
    shouldFetchSalesOrder ? note.salesOrderId : ''
  );

  const markDelivered = useMarkDelivered(businessId);
  const cancel = useCancelDeliveryNote(businessId);
  const cleanDups = useCleanDuplicates(businessId);

  const canEdit = note.status === DeliveryNoteStatus.PENDING;
  const canMarkDelivered = note.status === DeliveryNoteStatus.PENDING;
  const canCancel = note.status === DeliveryNoteStatus.PENDING;
  const canDelete = note.status === DeliveryNoteStatus.PENDING && onDelete !== undefined;
  
  // Check if all items have delivered quantity > 0
  const hasZeroQuantity = note.items?.some((item: any) => Number(item.deliveredQuantity) === 0);
  
  // Check for duplicates (same description)
  const hasDuplicates = note.items && note.items.length > new Set(note.items.map((i: any) => i.description)).size;

  // Calculate totals for delivered items
  const deliveryTotals = (() => {
    if (!salesOrder) return null;
    
    let subtotal = 0;
    let taxTotal = 0;
    
    (note.items ?? []).forEach(item => {
      const orderItem = salesOrder.items?.find((oi: any) => 
        oi.id === item.salesOrderItemId || 
        oi.description?.trim().toLowerCase() === item.description?.trim().toLowerCase()
      );
      if (orderItem) {
        const lineHT = Number(orderItem.unitPrice) * Number(item.deliveredQuantity);
        subtotal += lineHT;
        taxTotal += lineHT * (Number(orderItem.taxRate) / 100);
      }
    });
    
    const timbreFiscal = 1.000;
    const netTTC = subtotal + taxTotal + timbreFiscal;
    
    return {
      subtotal: subtotal.toFixed(3),
      taxTotal: taxTotal.toFixed(3),
      timbreFiscal: timbreFiscal.toFixed(3),
      netTTC: netTTC.toFixed(3),
    };
  })();

  const handleMarkDelivered = () => {
    if (hasZeroQuantity) {
      alert('⚠️ Impossible de marquer comme livré : certaines lignes ont une quantité livrée de 0.\n\nVeuillez cliquer sur "Modifier" pour corriger les quantités livrées.');
      return;
    }
    markDelivered.mutate(note.id, {
      onError: (error: any) => {
        const message = error?.response?.data?.message || error?.message || 'Erreur lors du marquage';
        alert('❌ ' + message);
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(note.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{note.deliveryNoteNumber}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${DELIVERY_NOTE_STATUS_COLORS[note.status]}`}>
                  {DELIVERY_NOTE_STATUS_LABELS[note.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{note.client?.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Chargement des détails...</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Infos générales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Client</p>
                  <p className="font-medium">{note.client?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date de livraison</p>
                  <p className="font-medium">{formatDate(note.deliveryDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Créé le</p>
                  <p className="font-medium">{formatDate(note.createdAt)}</p>
                </div>
                {salesOrder && (
                  <div>
                    <p className="text-gray-500">Commande client</p>
                    <p className="font-medium text-indigo-600">{salesOrder.orderNumber}</p>
                  </div>
                )}
              </div>

              {/* Lignes de la commande client (si liée) */}
              {salesOrder && salesOrder.items && salesOrder.items.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowSalesOrderItems(v => !v)}
                    className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left"
                  >
                    <ShoppingCart className="h-4 w-4 text-indigo-600" />
                    <span className="text-indigo-600">Lignes de la commande client</span>
                    <span className="text-gray-500 text-sm font-normal">({salesOrder.items.length})</span>
                    {showSalesOrderItems ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>
                  {showSalesOrderItems && (
                    <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/30">
                      <table className="w-full text-sm">
                        <thead className="bg-indigo-100">
                          <tr>
                            <th className="text-left px-4 py-2 text-indigo-700">Description</th>
                            <th className="text-center px-4 py-2 text-indigo-700">Qté commandée</th>
                            <th className="text-right px-4 py-2 text-indigo-700">Prix unitaire HT</th>
                            <th className="text-center px-4 py-2 text-indigo-700">TVA</th>
                            <th className="text-right px-4 py-2 text-indigo-700">Total HT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100 bg-white">
                          {salesOrder.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-gray-900">{item.description}</td>
                              <td className="px-4 py-2 text-center">{Number(item.quantity).toFixed(3)}</td>
                              <td className="px-4 py-2 text-right">{Number(item.unitPrice).toFixed(3)} DT</td>
                              <td className="px-4 py-2 text-center">{item.taxRate}%</td>
                              <td className="px-4 py-2 text-right font-medium">{Number(item.total).toFixed(3)} DT</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Lignes livrées */}
              <div>
                <button
                  onClick={() => setShowItems(v => !v)}
                  className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left"
                >
                  <Package className="h-4 w-4" />
                  Articles livrés ({note.items?.length ?? 0})
                  {showItems ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                
                {hasZeroQuantity && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">Quantités livrées manquantes</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Certaines lignes ont une quantité livrée de 0. Cliquez sur "Modifier" pour corriger avant de marquer comme livré.
                      </p>
                    </div>
                  </div>
                )}
                
                {hasDuplicates && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <span className="text-red-600 text-lg">🔴</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Lignes en double détectées</p>
                      <p className="text-xs text-red-700 mt-1">
                        Ce bon de livraison contient des lignes dupliquées. Cliquez sur le bouton ci-dessous pour nettoyer automatiquement.
                      </p>
                      <button
                        onClick={() => {
                          if (confirm('Voulez-vous supprimer les lignes en double ? La ligne avec la quantité livrée la plus élevée sera conservée.')) {
                            cleanDups.mutate(note.id, {
                              onSuccess: () => {
                                refetch();
                                alert('✅ Doublons supprimés avec succès !');
                              },
                              onError: (error: any) => {
                                alert('❌ Erreur: ' + (error?.response?.data?.message || error?.message));
                              }
                            });
                          }
                        }}
                        disabled={cleanDups.isPending}
                        className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {cleanDups.isPending ? 'Nettoyage...' : '🧹 Nettoyer les doublons'}
                      </button>
                    </div>
                  </div>
                )}
                
                {showItems && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-gray-500">Description</th>
                          <th className="text-center px-4 py-2 text-gray-500">Qté commandée</th>
                          <th className="text-center px-4 py-2 text-gray-500">Qté livrée</th>
                          {salesOrder && (
                            <>
                              <th className="text-right px-4 py-2 text-gray-500">Prix unitaire HT</th>
                              <th className="text-center px-4 py-2 text-gray-500">TVA</th>
                              <th className="text-right px-4 py-2 text-gray-500">Total HT</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(note.items ?? []).map(item => {
                          const isZero = Number(item.deliveredQuantity) === 0;
                          
                          // Find matching sales order item for price info
                          const orderItem = salesOrder?.items?.find((oi: any) => 
                            oi.id === item.salesOrderItemId || 
                            oi.description?.trim().toLowerCase() === item.description?.trim().toLowerCase()
                          );
                          
                          const unitPrice = orderItem ? Number(orderItem.unitPrice) : 0;
                          const taxRate = orderItem ? Number(orderItem.taxRate) : 0;
                          const totalHT = unitPrice * Number(item.deliveredQuantity);
                          
                          return (
                            <tr key={item.id} className={isZero ? 'bg-yellow-50' : ''}>
                              <td className="px-4 py-2 text-gray-900">{item.description}</td>
                              <td className="px-4 py-2 text-center">{Number(item.quantity).toFixed(3)}</td>
                              <td className={`px-4 py-2 text-center font-medium ${isZero ? 'text-red-600' : 'text-green-600'}`}>
                                {Number(item.deliveredQuantity).toFixed(3)}
                                {isZero && <span className="ml-1 text-xs">⚠️</span>}
                              </td>
                              {salesOrder && (
                                <>
                                  <td className="px-4 py-2 text-right">{unitPrice.toFixed(3)} DT</td>
                                  <td className="px-4 py-2 text-center">{taxRate}%</td>
                                  <td className="px-4 py-2 text-right font-medium">{totalHT.toFixed(3)} DT</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totaux (si lié à une commande) */}
              {salesOrder && deliveryTotals && (
                <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total HT</span>
                    <span>{deliveryTotals.subtotal} DT</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TVA</span>
                    <span>{deliveryTotals.taxTotal} DT</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Timbre fiscal</span>
                    <span>{deliveryTotals.timbreFiscal} DT</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                    <span>Net TTC</span>
                    <span>{deliveryTotals.netTTC} DT</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {note.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{note.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer - Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-4">
              
              {/* Section: Documents */}
              <ActionSection title="Documents">
                <ActionButton
                  icon={FileText}
                  label="Télécharger PDF"
                  description="Générer le document"
                  onClick={async () => {
                    const info = await getBusinessInfo(user);
                    printDeliveryNote(note, info.businessName, info.businessMF, info.businessAddress);
                  }}
                  variant="danger"
                />
              </ActionSection>

              {/* Section: Gestion */}
              {(canEdit || canMarkDelivered) && (
                <ActionSection title="Gestion du bon de livraison">
                  {canEdit && (
                    <ActionButton
                      icon={Edit}
                      label="Modifier"
                      description="Éditer les détails"
                      onClick={() => setEditOpen(true)}
                      variant="secondary"
                    />
                  )}
                  {canMarkDelivered && (
                    <ActionButton
                      icon={Truck}
                      label={hasZeroQuantity ? 'Corriger quantités' : 'Marquer livré'}
                      description={hasZeroQuantity ? 'Quantités manquantes ⚠️' : 'Confirmer la livraison'}
                      onClick={handleMarkDelivered}
                      variant={hasZeroQuantity ? 'secondary' : 'success'}
                      disabled={hasZeroQuantity}
                      loading={markDelivered.isPending}
                    />
                  )}
                </ActionSection>
              )}

              {/* Section: Actions critiques */}
              {(canCancel || canDelete) && (
                <ActionSection title="Actions critiques" variant="danger">
                  {canCancel && (
                    <ActionButton
                      icon={XCircle}
                      label="Annuler"
                      description="Annuler le bon de livraison"
                      onClick={() => cancel.mutate(note.id)}
                      variant="warning"
                      loading={cancel.isPending}
                    />
                  )}
                  {canDelete && (
                    <ActionButton
                      icon={Trash2}
                      label="Supprimer"
                      description="Supprimer définitivement"
                      onClick={() => setDeleteConfirm(true)}
                      variant="danger"
                    />
                  )}
                </ActionSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <DeliveryNoteModal
          key={`edit-${note.id}-items-${note.items?.length || 0}`}
          businessId={businessId}
          note={note}
          onClose={() => {
            setEditOpen(false);
            // Recharger les données du bon de livraison
            refetch();
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer le bon de livraison"
          message={`Êtes-vous sûr de vouloir supprimer le bon de livraison ${note.deliveryNoteNumber} ?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}
