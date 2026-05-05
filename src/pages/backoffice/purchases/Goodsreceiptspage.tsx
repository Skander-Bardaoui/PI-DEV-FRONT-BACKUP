// src/pages/backoffice/purchases/GoodsReceiptsPage.tsx — VERSION CORRIGÉE

import { useState } from 'react';
import { Eye, Package, ChevronDown, ChevronRight, PackageCheck, Clock, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSupplierPOs } from '@/hooks/useSupplierPOs';
import { useSupplierPO } from '@/hooks/useSupplierPOs'; // ← useSupplierPO pour charger items
import { useGoodsReceiptsByPO } from '@/hooks/useGoodsReceipts';
import { usePDFExport } from '@/hooks/usePDFExport';
import PDFButton from '@/components/purchases/PDFButton';
import SupplierPODetailModal from '@/components/purchases/SupplierPODetailModal';
import GoodsReceiptModal from '@/components/purchases/GoodsReceiptModal';
import {
  formatAmount, formatDate, GoodsReceipt,
  PO_STATUS_COLORS, PO_STATUS_LABELS, POStatus, SupplierPO
} from '@/types';

type SortField = 'po_number' | 'created_at' | 'supplier';
type SortDir   = 'asc' | 'desc';

// ── Ligne BC avec détail chargé correctement ──────────────────────────────────
function PORow({ businessId, po: listPO }: { businessId: string; po: SupplierPO }) {
  const [open, setOpen] = useState(false);
  const [detailPO, setDetailPO] = useState(false);
  const [grOpen, setGrOpen] = useState(false);

  // ← FIX : charger le PO complet avec ses items (toujours pour avoir la progression)
  const { data: fullPO } = useSupplierPO(businessId, listPO.id);
  const po = fullPO ?? listPO;

  const { data: receipts, isLoading: receiptsLoading } = useGoodsReceiptsByPO(
    businessId,
    open ? po.id : '',
  );

  const canReceive = [POStatus.CONFIRMED, POStatus.PARTIALLY_RECEIVED].includes(po.status);
  
  // ← FIX : calculer depuis les items chargés
  const totalOrdered  = po.items?.reduce((s, i) => s + Number(i.quantity_ordered),  0) ?? 0;
  const totalReceived = po.items?.reduce((s, i) => s + Number(i.quantity_received), 0) ?? 0;
  const pct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <>
      <tr
        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
          open ? 'bg-indigo-50/30' : ''
        }`}
        onClick={() => setOpen(o => !o)}
      >
        {/* N° BC */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {open
              ? <ChevronDown className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            }
            <span className="font-mono font-medium text-gray-900">{po.po_number}</span>
          </div>
        </td>

        {/* Fournisseur */}
        <td className="px-4 py-4 text-gray-700 text-sm">{po.supplier?.name}</td>

        {/* Date */}
        <td className="px-4 py-4 text-gray-500 text-sm">{formatDate(po.created_at)}</td>

        {/* Statut */}
        <td className="px-4 py-4">
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${PO_STATUS_COLORS[po.status]}`}>
            {PO_STATUS_LABELS[po.status]}
          </span>
        </td>

        {/* Progression réception */}
        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
          {fullPO ? (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {pct}%
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">
              Chargement...
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setDetailPO(true)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Voir détail"
            >
              <Eye className="h-4 w-4" />
            </button>
            {canReceive && (
              <button
                onClick={() => setGrOpen(true)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Créer un bon de réception"
              >
                <PackageCheck className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Bons de réception dépliables */}
      {open && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="px-10 py-3 bg-indigo-50/20 border-b border-indigo-100">

              {/* Détail des lignes items */}
              {fullPO?.items?.length > 0 && (
                <div className="mb-3 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500">Article</th>
                        <th className="text-center px-3 py-2 text-gray-500">Commandé</th>
                        <th className="text-center px-3 py-2 text-gray-500">Reçu</th>
                        <th className="text-center px-3 py-2 text-gray-500">Reliquat</th>
                        <th className="text-right px-3 py-2 text-gray-500">PU HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fullPO.items.map(item => {
                        const reliquat = Number(item.quantity_ordered) - Number(item.quantity_received);
                        const done = reliquat <= 0;
                        return (
                          <tr key={item.id} className={done ? 'bg-green-50/40' : ''}>
                            <td className="px-3 py-2 text-gray-800">{item.description}</td>
                            <td className="px-3 py-2 text-center text-gray-600">{Number(item.quantity_ordered).toFixed(3)}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={Number(item.quantity_received) > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>
                                {Number(item.quantity_received).toFixed(3)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {done
                                ? <span className="text-green-600 font-medium">✓</span>
                                : <span className="text-orange-600 font-medium">{reliquat.toFixed(3)}</span>
                              }
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">{formatAmount(item.unit_price_ht)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bons de réception existants */}
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Bons de réception ({receipts?.length ?? 0})
              </p>

              {receiptsLoading ? (
                <p className="text-xs text-gray-400 italic py-2">Chargement...</p>
              ) : !receipts?.length ? (
                <div className="flex items-center gap-2 py-3 px-3 bg-white border border-dashed border-gray-300 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 italic">
                    Aucune réception enregistrée
                    {canReceive && (
                      <button
                        onClick={() => setGrOpen(true)}
                        className="ml-2 text-indigo-600 hover:underline font-medium"
                      >
                        — créer le premier BR
                      </button>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {receipts.map(gr => <GRCard key={gr.id} gr={gr} />)}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {detailPO && (
        <SupplierPODetailModal
          businessId={businessId}
          po={po}
          onClose={() => setDetailPO(false)}
        />
      )}

      {grOpen && fullPO && (
        <GoodsReceiptModal
          businessId={businessId}
          po={fullPO}
          onClose={() => setGrOpen(false)}
        />
      )}
    </>
  );
}

// ── Carte BR (inchangée hormis le formatage) ──────────────────────────────────
function GRCard({ gr }: { gr: GoodsReceipt }) {
  const [open, setOpen] = useState(false);
  const { exportBR, loading } = usePDFExport();

  return (
    <div className="bg-white border border-green-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-green-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <PackageCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
          <div>
            <span className="font-mono font-medium text-gray-900 text-sm">{gr.gr_number}</span>
            <span className="ml-3 text-xs text-gray-400">
              {formatDate(gr.receipt_date)} · {gr.items?.length ?? 0} ligne(s)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PDFButton
            variant="icon"
            label="PDF BR"
            loading={loading}
            onClick={e => { e?.stopPropagation(); exportBR(gr); }}
          />
          {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {open && gr.items?.length > 0 && (
        <div className="border-t border-green-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-green-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-green-700">Article</th>
                <th className="text-center px-4 py-2 text-xs text-green-700">Qté reçue</th>
                <th className="text-right px-4 py-2 text-xs text-green-700">PU HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gr.items.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-gray-700">
                    {item.supplier_po_item?.description || 'Article sans nom'}
                  </td>
                  <td className="px-4 py-2 text-center font-medium text-green-700">
                    {Number(item.quantity_received).toFixed(3)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {Number(item.unit_price_ht).toFixed(3)} TND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {gr.notes && (
            <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
              Note : {gr.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page principale — CORRIGER les filtres par défaut ─────────────────────────
export default function GoodsReceiptsPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  // ← FIX : filtrer par défaut les BCs réceptionnables + entièrement reçus
  const [statusFilter, setStatusFilter] = useState(
    `${POStatus.CONFIRMED},${POStatus.PARTIALLY_RECEIVED},${POStatus.FULLY_RECEIVED}`
  );
  const [page, setPage] = useState(1);

  // ── Tri ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');

  // Ordre de priorité des statuts pour le tri (partiellement reçus en haut)
  const STATUS_ORDER: Record<POStatus, number> = {
    [POStatus.DRAFT]: 99,
    [POStatus.SENT]: 99,
    [POStatus.CONFIRMED]: 2,
    [POStatus.PARTIALLY_RECEIVED]: 1, // En haut
    [POStatus.FULLY_RECEIVED]: 3,     // En bas
    [POStatus.CANCELLED]: 99,
  };

  const { data, isLoading } = useSupplierPOs(businessId, {
    status: statusFilter || undefined,
    page,
    limit: 20,
  });

  const STATUS_OPTIONS = [
    {
      value: `${POStatus.CONFIRMED},${POStatus.PARTIALLY_RECEIVED},${POStatus.FULLY_RECEIVED}`,
      label: 'Tous les BCs reçus'    // ← label par défaut
    },
    { value: POStatus.CONFIRMED,          label: 'Confirmés uniquement' },
    { value: POStatus.PARTIALLY_RECEIVED, label: 'Partiellement reçus' },
    { value: POStatus.FULLY_RECEIVED,     label: 'Entièrement reçus'   },
  ];

  // ── Tri local ─────────────────────────────────────────────────────────────
  const sorted = [...(data?.data ?? [])].sort((a, b) => {
    // Tri par statut en priorité (partiellement reçus en haut)
    const statusA = STATUS_ORDER[a.status] || 999;
    const statusB = STATUS_ORDER[b.status] || 999;
    
    if (statusA !== statusB) {
      return statusA - statusB; // Tri croissant par statut
    }

    // Ensuite tri selon le champ sélectionné
    let va: any, vb: any;
    if (sortField === 'supplier') { 
      va = a.supplier?.name ?? ''; 
      vb = b.supplier?.name ?? ''; 
    } else { 
      va = a[sortField]; 
      vb = b[sortField]; 
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

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

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bons de Réception</h1>
        <p className="text-gray-500 text-sm">
          Cliquez sur un BC pour voir ses lignes et créer un bon de réception.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === opt.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

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
                  ].map(col => (
                    <th key={col.field}
                      onClick={() => toggleSort(col.field)}
                      className="text-left px-4 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors">
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                  <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900">Statut</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900">Progression</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!sorted.length ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <Package className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      Aucun bon de commande trouvé
                    </td>
                  </tr>
                ) : sorted.map(po => (
                  <PORow key={po.id} businessId={businessId} po={po} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-500">
              {data.total} BC(s) — page {page} / {data.total_pages ?? 1}
            </p>
            <div className="flex items-center gap-2">
              {/* Bouton première page */}
              <button 
                onClick={() => setPage(1)} 
                disabled={page === 1}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                «
              </button>

              {/* Bouton précédent */}
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

              {/* Bouton dernière page */}
              <button 
                onClick={() => setPage(totalPages)} 
                disabled={page >= totalPages}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}