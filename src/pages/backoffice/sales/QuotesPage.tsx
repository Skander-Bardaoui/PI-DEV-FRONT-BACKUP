import { useState } from 'react';
import { Plus, Eye, Send, Check, X, ChevronUp, ChevronDown, Filter, Search, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useQuotes, useSendQuote, useDeleteQuote } from '@/hooks/useQuotes';
import { QUOTE_STATUS_COLORS, QUOTE_STATUS_LABELS } from '@/types/quote';
import QuoteModal from '@/components/sales/QuoteModal';
import QuoteDetailModal from '@/components/sales/QuoteDetailModal';

type SortField = 'quoteNumber' | 'quoteDate' | 'netAmount' | 'client';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'REJECTED', label: 'Rejeté' },
  { value: 'EXPIRED', label: 'Expiré' },
  { value: 'CONVERTED', label: 'Converti' },
];

export default function QuotesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('quoteDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  const { data, isLoading } = useQuotes(businessId, {
    status: statusFilter || undefined,
    client_id: clientFilter || undefined,
    page,
    limit: 20,
  });

  const send = useSendQuote(businessId);
  const deleteQuote = useDeleteQuote(businessId);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
      : <span className="h-3 w-3 inline ml-1 opacity-30">↕</span>;

  // Filter and search
  const filtered = (data?.data ?? []).filter(quote => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesNumber = quote.quoteNumber?.toLowerCase().includes(search);
      const matchesClient = quote.client?.name?.toLowerCase().includes(search);
      if (!matchesNumber && !matchesClient) return false;
    }
    if (dateFrom && quote.quoteDate < dateFrom) return false;
    if (dateTo && quote.quoteDate > dateTo) return false;
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
        <h1 className="text-2xl font-bold">Devis</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nouveau devis
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('quoteNumber')}>
                  N° Devis <SortIcon field="quoteNumber" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('client')}>
                  Client <SortIcon field="client" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('quoteDate')}>
                  Date <SortIcon field="quoteDate" />
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
                    Aucun devis trouvé
                  </td>
                </tr>
              ) : (
                sorted.map((quote) => (
                  <tr key={quote.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{quote.quoteNumber}</td>
                    <td className="px-4 py-3">{quote.client?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{formatDate(quote.quoteDate)}</td>
                    <td className="px-4 py-3 text-right">{formatAmount(quote.netAmount)} DT</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${QUOTE_STATUS_COLORS[quote.status]}`}>
                        {QUOTE_STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {quote.status === 'DRAFT' && (
                          <button
                            onClick={() => send.mutate(quote.id)}
                            disabled={send.isPending}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Envoyer"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteQuote.mutate(quote.id)}
                          disabled={deleteQuote.isPending}
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
        <QuoteModal businessId={businessId} onClose={() => setModalOpen(false)} />
      )}

      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          businessId={businessId}
          onClose={() => setSelectedQuote(null)}
          onDelete={(id) => deleteQuote.mutate(id)}
        />
      )}
    </div>
  );
}
