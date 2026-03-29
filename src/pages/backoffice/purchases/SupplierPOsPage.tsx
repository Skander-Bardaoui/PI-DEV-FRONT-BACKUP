// src/pages/backoffice/purchases/SupplierPOsPage.tsx
// VERSION MISE À JOUR — filtres avancés + tri colonnes + ConfirmModal + Toast

import { useState } from 'react';
import { Plus, Eye, Send, Check, X, ChevronUp, ChevronDown, Filter, Sparkles } from 'lucide-react';
import { useAuth }            from '../../../hooks/useAuth';
import {
  useSupplierPOs, useSendSupplierPO,
  useConfirmSupplierPO, useCancelSupplierPO,
} from '@/hooks/useSupplierPOs';

import { useSuppliers }      from '@/hooks/useSuppliers';
import { useToast }          from '@/components/ui/Toast';
import ConfirmModal, { useApiError }          from '@/components/ui/ConfirmModal';
import SupplierPOModal       from '@/components/purchases/SupplierPOModal';
import SupplierPODetailModal from '@/components/purchases/SupplierPODetailModal';
import AiPOGeneratorModal    from '@/components/purchases/AiPOGeneratorModal';
import PDFButton             from '@/components/purchases/PDFButton';
import { usePDFExport }      from '@/hooks/usePDFExport';
import { formatAmount, formatDate, PO_STATUS_COLORS, PO_STATUS_LABELS, POStatus, SupplierPO } from '@/types';

type SortField = 'po_number' | 'created_at' | 'net_amount' | 'supplier';
type SortDir   = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: '',                          label: 'Tous les statuts' },
  { value: POStatus.DRAFT,              label: 'Brouillon'         },
  { value: POStatus.SENT,               label: 'Envoyé'            },
  { value: POStatus.CONFIRMED,          label: 'Confirmé'          },
  { value: POStatus.PARTIALLY_RECEIVED, label: 'Partiellement reçu'},
  { value: POStatus.FULLY_RECEIVED,     label: 'Entièrement reçu'  },
  { value: POStatus.CANCELLED,          label: 'Annulé'            },
];

export default function SupplierPOsPage() {
  const { user }    = useAuth();
  const businessId  = (user as any)?.business_id ?? '';
  const toast       = useToast();
  const { handleError } = useApiError();
  const { exportBC, loading: pdfLoading } = usePDFExport();

  // ── Filtres ───────────────────────────────────────────────────────────────
  const [statusFilter,     setStatusFilter]     = useState('');
  const [supplierFilter,   setSupplierFilter]   = useState('');
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');
  const [showFilters,      setShowFilters]      = useState(false);
  const [page,             setPage]             = useState(1);

  // ── Tri ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');

  // ── Modals ────────────────────────────────────────────────────────────────
  const [modalOpen,   setModalOpen]   = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [detailPO,    setDetailPO]    = useState<SupplierPO | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<SupplierPO | null>(null);

  const { data, isLoading } = useSupplierPOs(businessId, {
    status:      statusFilter   || undefined,
    supplier_id: supplierFilter || undefined,
    date_from:   dateFrom       || undefined,
    date_to:     dateTo         || undefined,
    page,
    limit: 20,
  });

  const { data: suppliersData } = useSuppliers(businessId, { is_active: true, limit: 100 });

  const send    = useSendSupplierPO(businessId);
  const confirm = useConfirmSupplierPO(businessId);
  const cancel  = useCancelSupplierPO(businessId);

  // ── Tri local ─────────────────────────────────────────────────────────────
  const sorted = [...(data?.data ?? [])].sort((a, b) => {
    let va: any, vb: any;
    if (sortField === 'supplier')    { va = a.supplier?.name ?? ''; vb = b.supplier?.name ?? ''; }
    else if (sortField === 'net_amount') { va = Number(a.net_amount); vb = Number(b.net_amount); }
    else { va = a[sortField]; vb = b[sortField]; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
      : <span className="h-3 w-3 inline ml-1 opacity-30">↕</span>;
  const totalPages = data?.total_pages ?? 1;

  // ── Actions avec toast ────────────────────────────────────────────────────
  const handleSend = async (po: SupplierPO) => {
    try {
      await send.mutateAsync(po.id);
      toast.success('BC envoyé', `${po.po_number} a été envoyé au fournisseur`);
    } catch (err) { handleError(err, 'Impossible d\'envoyer ce BC'); }
  };

  const handleConfirm = async (po: SupplierPO) => {
    try {
      await confirm.mutateAsync(po.id);
      toast.success('BC confirmé', `${po.po_number} est maintenant confirmé`);
    } catch (err) { handleError(err, 'Impossible de confirmer ce BC'); }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    try {
      await cancel.mutateAsync(confirmCancel.id);
      toast.warning('BC annulé', `${confirmCancel.po_number} a été annulé`);
      setConfirmCancel(null);
    } catch (err) { handleError(err, 'Impossible d\'annuler ce BC'); }
  };

  const hasActiveFilters = statusFilter || supplierFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter(''); setSupplierFilter('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bons de Commande</h1>
          <p className="text-gray-500 text-sm">
            {data?.total ?? 0} commande(s) fournisseur
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              hasActiveFilters
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres {hasActiveFilters && `(actifs)`}
          </button>
          <button
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30"
          >
            <Sparkles className="h-5 w-5" />
            Générer par IA
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouveau BC
          </button>
        </div>
      </div>

      {/* Filtres avancés dépliables */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fournisseur</label>
              <select value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">Tous les fournisseurs</option>
                {suppliersData?.data.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date de</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date à</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 underline">
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    { label: 'N° BC',       field: 'po_number'   as SortField },
                    { label: 'Fournisseur', field: 'supplier'    as SortField },
                    { label: 'Date',        field: 'created_at'  as SortField },
                    { label: 'Net TTC',     field: 'net_amount'  as SortField },
                  ].map(col => (
                    <th key={col.field}
                      onClick={() => toggleSort(col.field)}
                      className="text-left px-4 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors">
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-900">Statut</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!sorted.length ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">Aucun bon de commande</td></tr>
                ) : sorted.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-mono font-medium text-gray-900 text-sm">{po.po_number}</td>
                    <td className="px-4 py-4 text-gray-700 text-sm">{po.supplier?.name}</td>
                    <td className="px-4 py-4 text-gray-600 text-sm">{formatDate(po.created_at)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900 text-sm">
                      {formatAmount(po.net_amount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${PO_STATUS_COLORS[po.status]}`}>
                        {PO_STATUS_LABELS[po.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setDetailPO(po)} title="Voir"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <PDFButton variant="icon" loading={pdfLoading} onClick={() => exportBC(po)} label="PDF" />
                        {po.status === POStatus.DRAFT && (
                          <button onClick={() => handleSend(po)} disabled={send.isPending} title="Envoyer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        {po.status === POStatus.SENT && (
                          <button onClick={() => handleConfirm(po)} disabled={confirm.isPending} title="Confirmer"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {[POStatus.DRAFT, POStatus.SENT].includes(po.status) && (
                          <button onClick={() => setConfirmCancel(po)} title="Annuler"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      
        {/* Pagination toujours visible */}
{data && (
  <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

    <p className="text-sm text-gray-500">
      {data.total} BCs — page {page} / {data.total_pages ?? 1}
    </p>

    <div className="flex items-center gap-2">

      {/* Bouton précédent */}
      <button onClick={() => setPage(1)} disabled={page === 1}
      className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors">
      «
      </button>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
      >
        Précédent
      </button>

      {/* Numéros de pages */}
      {Array.from({ length: data.total_pages ?? 1 }, (_, i) => i + 1)
        .filter(p =>
          p === 1 ||
          p === (data.total_pages ?? 1) ||
          Math.abs(p - page) <= 1
        )
        .map((p, index, arr) => (
          <span key={p} className="flex items-center">
            {index > 0 && arr[index - 1] !== p - 1 && (
              <span className="px-1 text-gray-400">...</span>
            )}

            <button
              onClick={() => setPage(p)}
              className={`px-3 py-1 border rounded-lg text-sm transition-colors ${
                page === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          </span>
        ))}

      {/* Bouton suivant */}
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={page >= (data.total_pages ?? 1)}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
      >
        Suivant
      </button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
              className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors">
              »
            </button>
    </div>
  </div>
)}
      </div>

      {/* Modals */}
      {modalOpen && <SupplierPOModal businessId={businessId} onClose={() => setModalOpen(false)} />}
      {aiModalOpen && <AiPOGeneratorModal businessId={businessId} onClose={() => setAiModalOpen(false)} onSuccess={() => toast.success('BC créé', 'Le bon de commande a été généré avec succès')} />}
      {detailPO  && <SupplierPODetailModal businessId={businessId} po={detailPO} onClose={() => setDetailPO(null)} />}
      {confirmCancel && (
        <ConfirmModal
          title="Annuler le bon de commande ?"
          message={`Le BC ${confirmCancel.po_number} sera annulé et ne pourra plus être modifié.`}
          confirmLabel="Oui, annuler le BC"
          variant="danger"
          loading={cancel.isPending}
          onConfirm={handleCancel}
          onClose={() => setConfirmCancel(null)}
        />
      )}
    </div>
  );
}