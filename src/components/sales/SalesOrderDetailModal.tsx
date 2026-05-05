// src/components/sales/SalesOrderDetailModal.tsx
import { X, Package, ChevronDown, ChevronUp, Edit, Trash2, Play, Truck, FileText, XCircle, Mail, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalesOrder, SALES_ORDER_STATUS_COLORS, SALES_ORDER_STATUS_LABELS, SalesOrderStatus } from '@/types/sales-order';
import {
  useStartProgressSalesOrder,
  useMarkDeliveredSalesOrder,
  useMarkInvoicedSalesOrder,
  useConvertSalesOrderToInvoice,
  useCancelSalesOrder,
  useSalesOrder,
  useSendSalesOrderEmail,
} from '@/hooks/useSalesOrders';
import { useDeliveryNotesBySalesOrder } from '@/hooks/useDeliveryNotes';
import SalesOrderModal from './SalesOrderModal';
import ConfirmModal from '../ui/ConfirmModal';
import PDFButton from '../purchases/PDFButton';
import { printSalesOrder } from '@/utils/sales-order-print';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getBusinessInfo } from '@/utils/business-info.utils';

interface Props {
  order: SalesOrder;
  businessId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function SalesOrderDetailModal({ order: initialOrder, businessId, onClose, onDelete }: Props) {
  const [showItems, setShowItems] = useState(true);
  const [showDeliveryNotes, setShowDeliveryNotes] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Fetch full order details with items
  const { data: fullOrder, isLoading } = useSalesOrder(businessId, initialOrder.id);
  const order = fullOrder || initialOrder;

  // Fetch delivery notes for this sales order
  const { data: deliveryNotes = [] } = useDeliveryNotesBySalesOrder(businessId, order.id);

  const startProgress = useStartProgressSalesOrder(businessId);
  const markDelivered = useMarkDeliveredSalesOrder(businessId);
  const markInvoiced = useMarkInvoicedSalesOrder(businessId);
  const convertToInvoice = useConvertSalesOrderToInvoice(businessId);
  const cancel = useCancelSalesOrder(businessId);
  const sendEmail = useSendSalesOrderEmail(businessId);

  const handleConvertToInvoice = async () => {
    try {
      const result = await convertToInvoice.mutateAsync(order.id);
      toast.success('Facture créée', 'La facture a été créée avec succès. Rafraîchissez la page pour voir les changements.');
      onClose();
    } catch (error: any) {
      console.error('Conversion error:', error);
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la conversion';
      toast.error('Erreur de conversion', errorMessage);
    }
  };

  const canEdit = order.status === SalesOrderStatus.CONFIRMED;
  const canStartProgress = order.status === SalesOrderStatus.CONFIRMED;
  const canMarkDelivered = order.status === SalesOrderStatus.IN_PROGRESS;
  const canMarkInvoiced = order.status === SalesOrderStatus.DELIVERED;
  const canCancel = [SalesOrderStatus.CONFIRMED, SalesOrderStatus.IN_PROGRESS].includes(order.status);
  const canDelete = order.status === SalesOrderStatus.CONFIRMED || order.status === SalesOrderStatus.INVOICED;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toFixed(3);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(order.id);
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
                <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${SALES_ORDER_STATUS_COLORS[order.status]}`}>
                  {SALES_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{order.client?.name}</p>
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
                <p className="font-medium">{order.client?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Date de commande</p>
                <p className="font-medium">{formatDate(order.orderDate)}</p>
              </div>
              {order.expectedDelivery && (
                <div>
                  <p className="text-gray-500">Livraison prévue</p>
                  <p className="font-medium">{formatDate(order.expectedDelivery)}</p>
                </div>
              )}
            </div>

            {/* Lignes */}
            <div>
              <button
                onClick={() => setShowItems(v => !v)}
                className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left"
              >
                <Package className="h-4 w-4" />
                Lignes de la commande ({order.items?.length ?? 0})
                {showItems ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </button>
              {showItems && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-500">Description</th>
                        <th className="text-center px-4 py-2 text-gray-500">Qté</th>
                        <th className="text-right px-4 py-2 text-gray-500">Prix HT</th>
                        <th className="text-center px-4 py-2 text-gray-500">TVA</th>
                        <th className="text-right px-4 py-2 text-gray-500">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(order.items ?? []).map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatAmount(item.unitPrice)} DT</td>
                          <td className="px-4 py-2 text-center">{item.taxRate}%</td>
                          <td className="px-4 py-2 text-right">{formatAmount(item.total)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bons de livraison */}
            {deliveryNotes.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDeliveryNotes(v => !v)}
                  className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left"
                >
                  <PackageCheck className="h-4 w-4" />
                  Bons de livraison ({deliveryNotes.length})
                  {showDeliveryNotes ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                {showDeliveryNotes && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-gray-500">N° BL</th>
                          <th className="text-center px-4 py-2 text-gray-500">Date</th>
                          <th className="text-center px-4 py-2 text-gray-500">Statut</th>
                          <th className="text-center px-4 py-2 text-gray-500">Articles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {deliveryNotes.map(dn => (
                          <tr key={dn.id}>
                            <td className="px-4 py-2 text-gray-900 font-medium">{dn.deliveryNoteNumber}</td>
                            <td className="px-4 py-2 text-center">{formatDate(dn.deliveryDate)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                {dn.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">{dn.items?.length ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Totaux */}
            <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span><span>{formatAmount(order.subtotal)} DT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA</span><span>{formatAmount(order.taxAmount)} DT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Timbre fiscal</span><span>{formatAmount(order.timbreFiscal)} DT</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Net TTC</span><span>{formatAmount(order.netAmount)} DT</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
          )}

          {/* Footer - Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* Actions principales groupées par contexte */}
            <div className="space-y-4">
              
              {/* Section: Actions de document */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Documents & Communication
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      const info = await getBusinessInfo(user);
                      printSalesOrder(order, info.businessName, info.businessMF, info.businessAddress);
                    }}
                    className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-red-900 text-sm">Télécharger PDF</div>
                        <div className="text-xs text-red-600">Générer le document</div>
                      </div>
                    </div>
                  </button>

                  {order.client?.email && (
                    <button
                      onClick={() => sendEmail.mutate(order.id)}
                      disabled={sendEmail.isPending}
                      className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-green-900 text-sm">
                            {sendEmail.isPending ? 'Envoi...' : 'Envoyer au client'}
                          </div>
                          <div className="text-xs text-green-600">{order.client.email}</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Section: Actions de workflow */}
              {(canEdit || canStartProgress || canMarkDelivered || canMarkInvoiced) && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Gestion de la commande
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {canEdit && (
                      <button
                        onClick={() => setEditOpen(true)}
                        className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Edit className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900 text-sm">Modifier</div>
                            <div className="text-xs text-gray-600">Éditer les détails</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {canStartProgress && (
                      <button
                        onClick={async () => {
                          try {
                            await startProgress.mutateAsync(order.id);
                            toast.success('Commande démarrée', 'Un bon de livraison a été créé automatiquement');
                            onClose();
                          } catch (error: any) {
                            toast.error('Erreur', error?.response?.data?.message || 'Erreur lors du démarrage');
                          }
                        }}
                        disabled={startProgress.isPending}
                        className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-blue-900 text-sm">
                              {startProgress.isPending ? 'Démarrage...' : 'Démarrer'}
                            </div>
                            <div className="text-xs text-blue-600">Lancer la préparation</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {canMarkDelivered && (
                      <button
                        onClick={async () => {
                          try {
                            await markDelivered.mutateAsync(order.id);
                            toast.success('Commande livrée', 'La commande a été marquée comme livrée');
                            onClose();
                          } catch (error: any) {
                            toast.error('Erreur', error?.response?.data?.message || 'Erreur lors de la mise à jour');
                          }
                        }}
                        disabled={markDelivered.isPending}
                        className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Truck className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-emerald-900 text-sm">
                              {markDelivered.isPending ? 'Mise à jour...' : 'Marquer livré'}
                            </div>
                            <div className="text-xs text-emerald-600">Confirmer la livraison</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {canMarkInvoiced && (
                      <button
                        onClick={handleConvertToInvoice}
                        disabled={convertToInvoice.isPending}
                        className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border border-indigo-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-indigo-900 text-sm">
                              {convertToInvoice.isPending ? 'Conversion...' : 'Convertir en facture'}
                            </div>
                            <div className="text-xs text-indigo-600">Créer la facture</div>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Section: Actions critiques */}
              {(canCancel || canDelete) && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
                  <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">
                    Actions critiques
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {canCancel && (
                      <button
                        onClick={() => cancel.mutate(order.id)}
                        disabled={cancel.isPending}
                        className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border border-orange-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <XCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-orange-900 text-sm">Annuler</div>
                            <div className="text-xs text-orange-600">Annuler la commande</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Trash2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-red-900 text-sm">Supprimer</div>
                            <div className="text-xs text-red-600">Supprimer définitivement</div>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <SalesOrderModal
          businessId={businessId}
          order={order}
          onClose={() => {
            setEditOpen(false);
            onClose();
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer la commande"
          message={`Êtes-vous sûr de vouloir supprimer la commande ${order.orderNumber} ?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}
