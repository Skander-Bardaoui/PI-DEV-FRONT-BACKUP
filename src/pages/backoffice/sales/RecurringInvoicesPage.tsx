// src/pages/backoffice/sales/RecurringInvoicesPage.tsx
import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, Pause, Play, Calendar, RefreshCw, History, Search, Tag, Percent } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrentBusinessMember } from '../../../hooks/useCurrentBusinessMember';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useRecurringInvoices,
  useDeleteRecurringInvoice,
  useActivateRecurringInvoice,
  usePauseRecurringInvoice,
  useResumeRecurringInvoice,
  useBulkUpdateRecurringInvoices,
} from '@/hooks/useRecurringInvoices';
import { RECURRING_FREQUENCY_LABELS, RECURRING_STATUS_LABELS, RecurringInvoiceStatus, RecurringFrequency, DiscountType } from '@/types/recurring-invoice';
import RecurringInvoiceModal from '@/components/sales/RecurringInvoiceModal';
import RecurringInvoiceStatsCards from '@/components/sales/RecurringInvoiceStatsCards';
import RecurringInvoiceHistoryDrawer from '@/components/sales/RecurringInvoiceHistoryDrawer';
import RecurringInvoiceBulkActions from '@/components/sales/RecurringInvoiceBulkActions';

const LIMIT = 20;

export default function RecurringInvoicesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const { businessMember: currentMember } = useCurrentBusinessMember();

  // Permission checks
  const currentUserRole = (user as any)?.role;
  const isOwner = currentUserRole === 'BUSINESS_OWNER';
  const sales = currentMember?.sales_permissions;

  const canCreateRecurring = isOwner || sales?.create_recurring === true;
  const canUpdateRecurring = isOwner || sales?.update_recurring === true;
  const canDeleteRecurring = isOwner || sales?.delete_recurring === true;

  const [statusFilter, setStatusFilter] = useState<RecurringInvoiceStatus | undefined>(undefined);
  const [frequencyFilter, setFrequencyFilter] = useState<RecurringFrequency | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecurringId, setHistoryRecurringId] = useState<string | null>(null);
  const [historyRecurringDesc, setHistoryRecurringDesc] = useState('');
  const [historyTotalGenerated, setHistoryTotalGenerated] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading } = useRecurringInvoices(businessId, {
    status: statusFilter,
    frequency: frequencyFilter,
    search: debouncedSearch,
    page,
    limit: LIMIT,
  });

  const deleteRecurring = useDeleteRecurringInvoice(businessId);
  const activate = useActivateRecurringInvoice(businessId);
  const pause = usePauseRecurringInvoice(businessId);
  const resume = useResumeRecurringInvoice(businessId);
  const bulkUpdate = useBulkUpdateRecurringInvoices(businessId);

  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  const allSelected = useMemo(() => {
    if (!data?.data.length) return false;
    return data.data.every((r) => selectedIds.has(r.id));
  }, [data?.data, selectedIds]);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data?.data.map((r) => r.id) || []));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkActivate = async () => {
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), action: 'activate' });
    setSelectedIds(new Set());
  };

  const handleBulkPause = async () => {
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), action: 'pause' });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), action: 'delete' });
    setSelectedIds(new Set());
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) {
      const start = Math.max(1, totalPages - 4);
      return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
    }
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toFixed(3);
  };

  const handleEdit = (recurring: any) => {
    setSelectedRecurring(recurring);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecurring(null);
  };

  const handleToggleStatus = (recurring: any) => {
    if (recurring.status === RecurringInvoiceStatus.ACTIVE) {
      pause.mutate(recurring.id);
    } else if (recurring.status === RecurringInvoiceStatus.PAUSED) {
      resume.mutate(recurring.id);
    } else {
      activate.mutate(recurring.id);
    }
  };

  const handleShowHistory = (recurring: any) => {
    setHistoryRecurringId(recurring.id);
    setHistoryRecurringDesc(recurring.description);
    setHistoryTotalGenerated(recurring.invoices_generated);
    setHistoryDrawerOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDrawerOpen(false);
    setHistoryRecurringId(null);
  };

  const getStatusBadge = (status: RecurringInvoiceStatus) => {
    const badges = {
      [RecurringInvoiceStatus.ACTIVE]: 'bg-green-100 text-green-700 border-green-200',
      [RecurringInvoiceStatus.PAUSED]: 'bg-amber-100 text-amber-700 border-amber-200',
      [RecurringInvoiceStatus.INACTIVE]: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return badges[status] || badges[RecurringInvoiceStatus.INACTIVE];
  };

  const handleFilterChange = (newStatus?: RecurringInvoiceStatus, newFrequency?: RecurringFrequency) => {
    setStatusFilter(newStatus);
    setFrequencyFilter(newFrequency);
    setPage(1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Factures Récurrentes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gérez vos factures automatiques et abonnements
          </p>
        </div>
        {canCreateRecurring && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvelle facture récurrente
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <RecurringInvoiceStatsCards businessId={businessId} />

      <div className="bg-white rounded-lg shadow">
        {/* Toolbar */}
        <div className="p-4 border-b space-y-4">
          {/* Status Filters */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleFilterChange(undefined, frequencyFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === undefined
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => handleFilterChange(RecurringInvoiceStatus.ACTIVE, frequencyFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === RecurringInvoiceStatus.ACTIVE
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Actives
            </button>
            <button
              onClick={() => handleFilterChange(RecurringInvoiceStatus.PAUSED, frequencyFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === RecurringInvoiceStatus.PAUSED
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              En pause
            </button>
            <button
              onClick={() => handleFilterChange(RecurringInvoiceStatus.INACTIVE, frequencyFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === RecurringInvoiceStatus.INACTIVE
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Inactives
            </button>
          </div>

          {/* Search and Frequency Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par description ou client..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={frequencyFilter || ''}
              onChange={(e) => handleFilterChange(statusFilter, e.target.value as RecurringFrequency || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Toutes les fréquences</option>
              {Object.entries(RECURRING_FREQUENCY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">N°</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Fréquence</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Montant HT</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Prochaine</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Générées</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : (data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Aucune facture récurrente trouvée
                  </td>
                </tr>
              ) : (
                (data?.data ?? []).map((recurring, index) => (
                  <tr key={recurring.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(recurring.id)}
                        onChange={() => handleSelectOne(recurring.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-sm">
                      #{(page - 1) * LIMIT + index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {recurring.client?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {recurring.description}
                          {recurring.discount_type && recurring.discount_value && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                              <Tag className="h-3 w-3" />
                              {recurring.discount_type === DiscountType.PERCENTAGE
                                ? `-${recurring.discount_value}%`
                                : `-${formatAmount(recurring.discount_value)} DT`}
                            </span>
                          )}
                        </div>
                        {recurring.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {recurring.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        <RefreshCw className="h-3 w-3" />
                        {RECURRING_FREQUENCY_LABELS[recurring.frequency]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatAmount(recurring.amount)} DT
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(recurring.next_invoice_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleShowHistory(recurring)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm hover:bg-blue-200 transition-colors"
                        title="Voir l'historique"
                      >
                        {recurring.invoices_generated}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(recurring.status)}`}>
                        {RECURRING_STATUS_LABELS[recurring.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleShowHistory(recurring)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Historique"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        {canUpdateRecurring && (
                          <button
                            onClick={() => handleEdit(recurring)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canUpdateRecurring && (
                          <button
                            onClick={() => handleToggleStatus(recurring)}
                            disabled={activate.isPending || pause.isPending || resume.isPending}
                            className={`p-1.5 rounded-lg transition-colors ${
                              recurring.status === RecurringInvoiceStatus.ACTIVE
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : recurring.status === RecurringInvoiceStatus.PAUSED
                                ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={
                              recurring.status === RecurringInvoiceStatus.ACTIVE
                                ? 'Mettre en pause'
                                : recurring.status === RecurringInvoiceStatus.PAUSED
                                ? 'Reprendre'
                                : 'Activer'
                            }
                          >
                            {recurring.status === RecurringInvoiceStatus.ACTIVE ? (
                              <Pause className="h-4 w-4" />
                            ) : recurring.status === RecurringInvoiceStatus.PAUSED ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {canDeleteRecurring && (
                          <button
                            onClick={() => deleteRecurring.mutate(recurring.id)}
                            disabled={deleteRecurring.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {total === 0
              ? 'Aucun résultat'
              : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total} facture${total > 1 ? 's' : ''} récurrente${total > 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Précédent
            </button>
            {getPageNumbers().map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === n ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Suivant
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <RecurringInvoiceModal
          businessId={businessId}
          recurringInvoice={selectedRecurring}
          onClose={handleCloseModal}
        />
      )}

      {/* History Drawer */}
      {historyDrawerOpen && (
        <RecurringInvoiceHistoryDrawer
          businessId={businessId}
          recurringId={historyRecurringId}
          recurringDescription={historyRecurringDesc}
          totalGenerated={historyTotalGenerated}
          onClose={handleCloseHistory}
        />
      )}

      {/* Bulk Actions */}
      <RecurringInvoiceBulkActions
        selectedCount={selectedIds.size}
        onActivate={handleBulkActivate}
        onPause={handleBulkPause}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
        isLoading={bulkUpdate.isPending}
      />
    </div>
  );
}
