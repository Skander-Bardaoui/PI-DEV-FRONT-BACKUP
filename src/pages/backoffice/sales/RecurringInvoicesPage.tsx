// src/pages/backoffice/sales/RecurringInvoicesPage.tsx
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Power, PowerOff, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  useRecurringInvoices,
  useDeleteRecurringInvoice,
  useActivateRecurringInvoice,
  useDeactivateRecurringInvoice,
} from '@/hooks/useRecurringInvoices';
import { RECURRING_FREQUENCY_LABELS } from '@/types/recurring-invoice';
import RecurringInvoiceModal from '@/components/sales/RecurringInvoiceModal';

export default function RecurringInvoicesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);

  const { data, isLoading } = useRecurringInvoices(businessId, {
    is_active: activeFilter,
    page,
    limit: 20,
  });

  const deleteRecurring = useDeleteRecurringInvoice(businessId);
  const activate = useActivateRecurringInvoice(businessId);
  const deactivate = useDeactivateRecurringInvoice(businessId);

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

  const handleToggleActive = (recurring: any) => {
    if (recurring.is_active) {
      deactivate.mutate(recurring.id);
    } else {
      activate.mutate(recurring.id);
    }
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
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle facture récurrente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveFilter(undefined)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === undefined
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setActiveFilter(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === true
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Actives
            </button>
            <button
              onClick={() => setActiveFilter(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === false
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Inactives
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Fréquence
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  Montant HT
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Prochaine facture
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Générées
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : (data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucune facture récurrente trouvée
                  </td>
                </tr>
              ) : (
                (data?.data ?? []).map((recurring) => (
                  <tr key={recurring.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {recurring.client?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {recurring.description}
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
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {recurring.invoices_generated}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {recurring.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(recurring)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(recurring)}
                          disabled={activate.isPending || deactivate.isPending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            recurring.is_active
                              ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={recurring.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {recurring.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteRecurring.mutate(recurring.id)}
                          disabled={deleteRecurring.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {data.page} sur {data.total_pages} ({data.total} résultats)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <RecurringInvoiceModal
          businessId={businessId}
          recurringInvoice={selectedRecurring}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
