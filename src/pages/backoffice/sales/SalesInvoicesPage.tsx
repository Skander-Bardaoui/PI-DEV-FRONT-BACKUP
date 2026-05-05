import { useState, useMemo } from 'react';
import { Plus, Eye, ChevronUp, ChevronDown, Filter, Search, FileText, Trash2, Mail, ScanLine, Bell, GitCompare, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrentBusinessMember } from '../../../hooks/useCurrentBusinessMember';
import { useSalesInvoices, useDeleteSalesInvoice } from '@/hooks/useSalesInvoices';
import { SALES_INVOICE_STATUS_COLORS, SALES_INVOICE_STATUS_LABELS, SalesInvoiceType } from '@/types/sales-invoice';
import SalesInvoiceModal from '@/components/sales/SalesInvoiceModal';
import SalesInvoiceDetailModal from '@/components/sales/SalesInvoiceDetailModal';
import SendInvoiceEmailModal from '@/components/sales/SendInvoiceEmailModal';
import SalesOcrInvoiceModal from '@/components/sales/SalesOcrInvoiceModal';
import SalesMatchingModal from '@/components/sales/SalesMatchingModal';
import { useAIAccess } from '@/hooks/useAIAccess';

const INVOICE_TYPE_LABELS: Record<SalesInvoiceType, string> = {
  [SalesInvoiceType.NORMAL]: 'Standard',
  [SalesInvoiceType.AVOIR]: 'Remboursement',
  [SalesInvoiceType.PROFORMA]: 'Provisoire',
  [SalesInvoiceType.ACOMPTE]: 'Avance',
};

const INVOICE_TYPE_COLORS: Record<SalesInvoiceType, string> = {
  [SalesInvoiceType.NORMAL]: 'bg-blue-100 text-blue-700',
  [SalesInvoiceType.AVOIR]: 'bg-red-100 text-red-700',
  [SalesInvoiceType.PROFORMA]: 'bg-purple-100 text-purple-700',
  [SalesInvoiceType.ACOMPTE]: 'bg-orange-100 text-orange-700',
};

type SortField = 'invoice_number' | 'date' | 'due_date' | 'net_amount' | 'client';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'En préparation' },
  { value: 'SENT', label: 'Envoyée' },
  { value: 'PARTIALLY_PAID', label: 'Payée en partie' },
  { value: 'PAID', label: 'Payée' },
  { value: 'OVERDUE', label: 'En retard' },
  { value: 'CANCELLED', label: 'Annulée' },
];

const LIMIT = 20;

export default function SalesInvoicesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const { businessMember: currentMember } = useCurrentBusinessMember();
  const { hasAIAccess, loading: aiLoading } = useAIAccess();

  // Permission checks
  const currentUserRole = (user as any)?.role;
  const isOwner = currentUserRole === 'BUSINESS_OWNER';
  const sales = currentMember?.sales_permissions;

  const canCreateInvoice = isOwner || sales?.create_invoice === true;
  const canUpdateInvoice = isOwner || sales?.update_invoice === true;
  const canDeleteInvoice = isOwner || sales?.delete_invoice === true;
  const canSendInvoice = isOwner || sales?.send_invoice === true;

  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [invoiceForEmail, setInvoiceForEmail] = useState<any>(null);
  const [matchingInvoice, setMatchingInvoice] = useState<any>(null);

  const { data, isLoading } = useSalesInvoices(businessId, {
    status: statusFilter || undefined,
    client_id: clientFilter || undefined,
    page,
    limit: LIMIT,
  });

  const deleteInvoice = useDeleteSalesInvoice(businessId);

  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  // Calculate statistics
  const stats = useMemo(() => {
    const invoices = data?.data || [];
    return {
      total: total,
      draft: invoices.filter(i => i.status === 'DRAFT').length,
      paid: invoices.filter(i => i.status === 'PAID').length,
      overdue: invoices.filter(i => i.status === 'OVERDUE').length,
      totalAmount: invoices.reduce((sum, i) => sum + Number(i.net_amount || 0), 0),
    };
  }, [data, total]);

  // Calcul des numéros de pages à afficher
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [page-2, page-1, page, page+1, page+2];
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField === field) {
      return sortDir === 'asc' 
        ? <ChevronUp className="h-3 w-3 inline ml-1" /> 
        : <ChevronDown className="h-3 w-3 inline ml-1" />;
    }
    return <span className="h-3 w-3 inline ml-1 opacity-30">↕</span>;
  };

  // Filter and search
  const filtered = (data?.data ?? []).filter(invoice => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesNumber = invoice.invoice_number?.toLowerCase().includes(search);
      const matchesClient = invoice.client?.name?.toLowerCase().includes(search);
      if (!matchesNumber && !matchesClient) return false;
    }
    if (dateFrom && invoice.date < dateFrom) return false;
    if (dateTo && invoice.date > dateTo) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va: any, vb: any;
    if (sortField === 'client') { va = a.client?.name ?? ''; vb = b.client?.name ?? ''; }
    else if (sortField === 'net_amount') { va = Number(a.net_amount); vb = Number(b.net_amount); }
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Factures clients</h1>
        <div className="flex gap-3">
          {/* AI Feature - Only for Premium users */}
          {!aiLoading && hasAIAccess && canCreateInvoice && (
            <button
              onClick={() => setShowOcrModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <ScanLine className="h-5 w-5" />
              Importer une facture
            </button>
          )}
          {canCreateInvoice && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nouvelle facture
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Factures</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Payées</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.paid}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium">En Retard</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{stats.overdue}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg border border-purple-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Montant Total</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{formatAmount(stats.totalAmount)} DT</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-7 w-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vérification automatique Notice */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <GitCompare className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-indigo-900 mb-1">
              Vérification automatique disponible
            </h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Les factures liées à une commande client (badge <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">CMD</span>) peuvent être vérifiées automatiquement avec les bons de livraison pour valider les montants.
            </p>
          </div>
        </div>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('invoice_number')}>
                  N° Facture <SortIcon field="invoice_number" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('client')}>
                  Client <SortIcon field="client" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('date')}>
                  Date <SortIcon field="date" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('due_date')}>
                  Échéance <SortIcon field="due_date" />
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('net_amount')}>
                  Montant TTC <SortIcon field="net_amount" />
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                sorted.map((invoice) => (
                  <tr key={invoice.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{invoice.invoice_number}</span>
                        {invoice.sales_order_id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            CMD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${INVOICE_TYPE_COLORS[invoice.type || SalesInvoiceType.NORMAL]}`}>
                        {INVOICE_TYPE_LABELS[invoice.type || SalesInvoiceType.NORMAL]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{invoice.client?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{formatDate(invoice.date)}</td>
                    <td className="px-4 py-3">{formatDate(invoice.due_date)}</td>
                    <td className="px-4 py-3 text-right">{formatAmount(invoice.net_amount)} DT</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${SALES_INVOICE_STATUS_COLORS[invoice.status]}`}>
                        {SALES_INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {invoice.sales_order_id && (
                          <button
                            onClick={() => setMatchingInvoice(invoice)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Vérifier automatiquement"
                          >
                            <GitCompare className="h-4 w-4" />
                          </button>
                        )}
                        {canSendInvoice && (
                          <button
                            onClick={() => {
                              setInvoiceForEmail(invoice);
                              setShowEmailModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Envoyer par email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        {(invoice.status === 'OVERDUE' || invoice.status === 'SENT') && canSendInvoice && (
                          <button
                            onClick={() => {
                              setInvoiceForEmail(invoice);
                              setShowEmailModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Rappel de paiement"
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {canDeleteInvoice && (
                          <button
                            onClick={() => deleteInvoice.mutate(invoice.id)}
                            disabled={deleteInvoice.isPending}
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

        {/* Pagination — toujours visible */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {total === 0
              ? 'Aucun résultat'
              : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total} facture${total > 1 ? 's' : ''}`
            }
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors">
              «
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Précédent
            </button>
            {getPageNumbers().map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === n ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Suivant
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors">
              »
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <SalesInvoiceModal 
          businessId={businessId} 
          onClose={() => setModalOpen(false)}
        />
      )}

      {selectedInvoice && (
        <SalesInvoiceDetailModal
          invoice={selectedInvoice}
          businessId={businessId}
          onClose={() => setSelectedInvoice(null)}
          onDelete={(id) => deleteInvoice.mutate(id)}
        />
      )}

      {showEmailModal && invoiceForEmail && (
        <SendInvoiceEmailModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setInvoiceForEmail(null);
          }}
          invoice={invoiceForEmail}
          businessId={businessId}
          onSuccess={() => {
            // Rafraîchir la liste si nécessaire
            window.location.reload();
          }}
        />
      )}

      {showOcrModal && (
        <SalesOcrInvoiceModal
          businessId={businessId}
          onClose={() => setShowOcrModal(false)}
          onCreated={() => {
            setShowOcrModal(false);
            window.location.reload();
          }}
        />
      )}

      {matchingInvoice && (
        <SalesMatchingModal
          businessId={businessId}
          invoiceId={matchingInvoice.id}
          onClose={() => setMatchingInvoice(null)}
        />
      )}
    </div>
  );
}
