import { useState, useMemo } from 'react';
import { Plus, Eye, Send, ChevronUp, ChevronDown, Filter, Search, FileText, Trash2, FileCheck, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrentBusinessMember } from '../../../hooks/useCurrentBusinessMember';
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

const LIMIT = 20;

export default function QuotesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const { businessMember: currentMember } = useCurrentBusinessMember();

  // Permission checks
  const currentUserRole = (user as any)?.role;
  const isOwner = currentUserRole === 'BUSINESS_OWNER';
  const sales = currentMember?.sales_permissions;

  const canCreateQuote = isOwner || sales?.create_quote === true;
  const canUpdateQuote = isOwner || sales?.update_quote === true;
  const canDeleteQuote = isOwner || sales?.delete_quote === true;
  const canSendQuote = isOwner || sales?.send_quote === true;
  const canConvertQuote = isOwner || sales?.convert_quote === true;

  const [statusFilter, setStatusFilter] = useState('');
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
    page,
    limit: LIMIT,
  });

  const send = useSendQuote(businessId);
  const deleteQuote = useDeleteQuote(businessId);

  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  // Calculate statistics
  const stats = useMemo(() => {
    const quotes = data?.data || [];
    return {
      total: total,
      draft: quotes.filter(q => q.status === 'DRAFT').length,
      accepted: quotes.filter(q => q.status === 'ACCEPTED').length,
      totalAmount: quotes.reduce((sum, q) => sum + Number(q.netAmount || 0), 0),
    };
  }, [data, total]);

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

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR');
  const formatAmount = (amount: number) => Number(amount).toFixed(3);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Devis</h1>
        {canCreateQuote && (
          <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            <Plus className="h-5 w-5" />
            Nouveau devis
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Devis</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">Brouillons</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{stats.draft}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-7 w-7 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Acceptés</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.accepted}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileCheck className="h-7 w-7 text-green-600" />
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

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-4 items-center flex-wrap">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filtres
            </button>
            <div className="flex-1 max-w-md relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher par N° ou client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {showFilters && (
            <div className="flex gap-3 flex-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
              {(searchQuery || statusFilter || dateFrom || dateTo) && (
                <button onClick={() => { setSearchQuery(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('quoteNumber')}>N° Devis <SortIcon field="quoteNumber" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('client')}>Client <SortIcon field="client" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('quoteDate')}>Date <SortIcon field="quoteDate" /></th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('netAmount')}>Montant TTC <SortIcon field="netAmount" /></th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun devis trouvé</td></tr>
              ) : (
                sorted.map((quote) => (
                  <tr key={quote.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{quote.quoteNumber}</td>
                    <td className="px-4 py-3">{quote.client?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{formatDate(quote.quoteDate)}</td>
                    <td className="px-4 py-3 text-right">{formatAmount(quote.netAmount)} DT</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${QUOTE_STATUS_COLORS[quote.status]}`}>{QUOTE_STATUS_LABELS[quote.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedQuote(quote)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Voir les détails"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => setSelectedQuote(quote)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="PDF"><FileText className="h-4 w-4" /></button>
                        {canSendQuote && quote.status === 'DRAFT' && <button onClick={() => send.mutate(quote.id)} disabled={send.isPending} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Envoyer"><Send className="h-4 w-4" /></button>}
                        {canDeleteQuote && <button onClick={() => deleteQuote.mutate(quote.id)} disabled={deleteQuote.isPending} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">{total === 0 ? 'Aucun résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total} devis`}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">Précédent</button>
            {getPageNumbers().map(n => <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === n ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{n}</button>)}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">Suivant</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors">»</button>
          </div>
        </div>
      </div>

      {modalOpen && <QuoteModal businessId={businessId} onClose={() => setModalOpen(false)} />}
      {selectedQuote && (
        <QuoteDetailModal 
          quote={selectedQuote} 
          businessId={businessId} 
          onClose={() => setSelectedQuote(null)} 
          onDelete={canDeleteQuote ? (id) => deleteQuote.mutate(id) : undefined}
        />
      )}
    </div>
  );
}
