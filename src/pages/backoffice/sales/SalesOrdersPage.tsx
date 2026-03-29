import { useState } from 'react';
import { Plus, Eye, ChevronUp, ChevronDown, Filter, Search, FileText, Trash2, Mail, Edit, Play, Truck, XCircle, MoreVertical } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSalesOrders, useDeleteSalesOrder, useStartProgressSalesOrder, useMarkDeliveredSalesOrder, useConvertSalesOrderToInvoice, useCancelSalesOrder, useSendSalesOrderEmail } from '@/hooks/useSalesOrders';
import { SALES_ORDER_STATUS_COLORS, SALES_ORDER_STATUS_LABELS, SalesOrderStatus } from '@/types/sales-order';
import SalesOrderModal from '@/components/sales/SalesOrderModal';
import SalesOrderDetailModal from '@/components/sales/SalesOrderDetailModal';
import { useToast } from '@/components/ui/Toast';

type SortField = 'orderNumber' | 'orderDate' | 'netAmount' | 'client';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DELIVERED', label: 'Livré' },
  { value: 'INVOICED', label: 'Facturé' },
  { value: 'CANCELLED', label: 'Annulé' },
];

export default function SalesOrdersPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const { data, isLoading } = useSalesOrders(businessId, {
    status: statusFilter || undefined,
    client_id: clientFilter || undefined,
    page,
    limit: 20,
  });

  const deleteOrder = useDeleteSalesOrder(businessId);
  const startProgress = useStartProgressSalesOrder(businessId);
  const markDelivered = useMarkDeliveredSalesOrder(businessId);
  const convertToInvoice = useConvertSalesOrderToInvoice(businessId);
  const cancel = useCancelSalesOrder(businessId);
  const sendEmail = useSendSalesOrderEmail(businessId);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
      : <span className="h-3 w-3 inline ml-1 opacity-30">↕</span>;

  // Filter and search
  const filtered = (data?.data ?? []).filter(order => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesNumber = order.orderNumber?.toLowerCase().includes(search);
      const matchesClient = order.client?.name?.toLowerCase().includes(search);
      if (!matchesNumber && !matchesClient) return false;
    }
    if (dateFrom && order.orderDate < dateFrom) return false;
    if (dateTo && order.orderDate > dateTo) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va: any, vb: any;
    if (sortField === 'client') { va = a.client?.name ?? ''; vb = b.client?.name ?? ''; }
    else if (sortField === 'netAmount') { va = Number(a.netAmount); vb = Number(b.netAmount); }
    else { va = a[sortField]; vb = b[sortField]; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toFixed(3);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Commandes clients</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nouvelle commande
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
            <div className="flex-1 max-w-md relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par N° ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {showFilters && (
            <div className="flex gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Date début"
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Date fin"
                className="border rounded-lg px-3 py-2 text-sm"
              />
              {(searchQuery || statusFilter || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('orderNumber')}>
                  N° Commande <SortIcon field="orderNumber" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('client')}>
                  Client <SortIcon field="client" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('orderDate')}>
                  Date <SortIcon field="orderDate" />
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('netAmount')}>
                  Montant TTC <SortIcon field="netAmount" />
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                sorted.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">{order.client?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{formatDate(order.orderDate)}</td>
                    <td className="px-4 py-3 text-right">{formatAmount(order.netAmount)} DT</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${SALES_ORDER_STATUS_COLORS[order.status]}`}>
                        {SALES_ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {order.status === SalesOrderStatus.CONFIRMED && order.client?.email && (
                          <button
                            onClick={async () => {
                              try {
                                await sendEmail.mutateAsync(order.id);
                                toast.success('Email envoyé', `Email de confirmation envoyé à ${order.client.email}`);
                              } catch (error: any) {
                                toast.error('Erreur', error?.response?.data?.message || 'Erreur lors de l\'envoi');
                              }
                            }}
                            disabled={sendEmail.isPending}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Envoyer au client"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        
                        {order.status === SalesOrderStatus.CONFIRMED && (
                          <>
                            <button
                              onClick={() => setEditingOrder(order)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await startProgress.mutateAsync(order.id);
                                  toast.success('Commande démarrée', 'Un bon de livraison a été créé automatiquement');
                                } catch (error: any) {
                                  toast.error('Erreur', error?.response?.data?.message || 'Erreur lors du démarrage');
                                }
                              }}
                              disabled={startProgress.isPending}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Démarrer"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {order.status === SalesOrderStatus.IN_PROGRESS && (
                          <button
                            onClick={async () => {
                              try {
                                await markDelivered.mutateAsync(order.id);
                                toast.success('Commande livrée', 'La commande a été marquée comme livrée');
                              } catch (error: any) {
                                toast.error('Erreur', error?.response?.data?.message || 'Erreur lors de la mise à jour');
                              }
                            }}
                            disabled={markDelivered.isPending}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Marquer livré"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                        
                        {order.status === SalesOrderStatus.DELIVERED && (
                          <button
                            onClick={async () => {
                              try {
                                await convertToInvoice.mutateAsync(order.id);
                                toast.success('Facture créée', 'La facture a été créée avec succès');
                              } catch (error: any) {
                                toast.error('Erreur', error?.response?.data?.message || 'Erreur lors de la conversion');
                              }
                            }}
                            disabled={convertToInvoice.isPending}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Convertir en facture"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        
                        {[SalesOrderStatus.CONFIRMED, SalesOrderStatus.IN_PROGRESS].includes(order.status) && (
                          <button
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
                                try {
                                  await cancel.mutateAsync(order.id);
                                  toast.success('Commande annulée', 'La commande a été annulée');
                                } catch (error: any) {
                                  toast.error('Erreur', error?.response?.data?.message || 'Erreur lors de l\'annulation');
                                }
                              }
                            }}
                            disabled={cancel.isPending}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Annuler"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {(order.status === SalesOrderStatus.CONFIRMED || order.status === SalesOrderStatus.INVOICED) && (
                          <button
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
                                deleteOrder.mutate(order.id);
                              }
                            }}
                            disabled={deleteOrder.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <SalesOrderModal businessId={businessId} onClose={() => setModalOpen(false)} />
      )}

      {editingOrder && (
        <SalesOrderModal 
          businessId={businessId} 
          order={editingOrder}
          onClose={() => setEditingOrder(null)} 
        />
      )}

      {selectedOrder && (
        <SalesOrderDetailModal
          order={selectedOrder}
          businessId={businessId}
          onClose={() => setSelectedOrder(null)}
          onDelete={(id) => deleteOrder.mutate(id)}
        />
      )}
    </div>
  );
}
