import { useState } from 'react';
import { Plus, Eye, ChevronUp, ChevronDown, Filter, Search, FileText, Trash2, Mail, ScanLine, Bell, GitCompare } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSalesInvoices, useDeleteSalesInvoice } from '@/hooks/useSalesInvoices';
import { SALES_INVOICE_STATUS_COLORS, SALES_INVOICE_STATUS_LABELS, SalesInvoiceType } from '@/types/sales-invoice';
import SalesInvoiceModal from '@/components/sales/SalesInvoiceModal';
import SalesInvoiceDetailModal from '@/components/sales/SalesInvoiceDetailModal';
import SendInvoiceEmailModal from '@/components/sales/SendInvoiceEmailModal';
import SalesOcrInvoiceModal from '@/components/sales/SalesOcrInvoiceModal';
import SalesMatchingModal from '@/components/sales/SalesMatchingModal';

const INVOICE_TYPE_LABELS: Record<SalesInvoiceType, string> = {
  [SalesInvoiceType.NORMAL]: 'Normale',
  [SalesInvoiceType.AVOIR]: 'Avoir',
  [SalesInvoiceType.PROFORMA]: 'Proforma',
  [SalesInvoiceType.ACOMPTE]: 'Acompte',
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
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyée' },
  { value: 'PARTIALLY_PAID', label: 'Partiellement payée' },
  { value: 'PAID', label: 'Payée' },
  { value: 'OVERDUE', label: 'En retard' },
  { value: 'CANCELLED', label: 'Annulée' },
];

export default function SalesInvoicesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

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
    limit: 20,
  });

  const deleteInvoice = useDeleteSalesInvoice(businessId);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
      : <span className="h-3 w-3 inline ml-1 opacity-30">↕</span>;

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Factures clients</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowOcrModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <ScanLine className="h-5 w-5" />
            Scanner une facture
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Rapprochement Notice */}
      <div className="mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <GitCompare className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-indigo-900 mb-1">
              Rapprochement automatique disponible
            </h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Les factures liées à une commande client (badge <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">CMD</span>) peuvent être rapprochées automatiquement avec les bons de livraison pour valider les montants.
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
                            title="Rapprochement automatique"
                          >
                            <GitCompare className="h-4 w-4" />
                          </button>
                        )}
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
                        {(invoice.status === 'OVERDUE' || invoice.status === 'SENT') && (
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
                        <button
                          onClick={() => deleteInvoice.mutate(invoice.id)}
                          disabled={deleteInvoice.isPending}
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
