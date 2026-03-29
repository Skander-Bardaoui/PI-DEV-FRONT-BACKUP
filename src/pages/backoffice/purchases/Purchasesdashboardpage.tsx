// src/pages/backoffice/purchases/PurchasesDashboardPage.tsx
import { useMemo } from 'react';
import {
  ShoppingBag, AlertTriangle, TrendingUp, Clock,
  Building2, CheckCircle, Package, FileText,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSuppliers }         from '@/hooks/useSuppliers';
import { useSupplierPOs }       from '@/hooks/useSupplierPOs';
import { usePurchaseInvoices }  from '@/hooks/usePurchaseInvoices';
import { formatAmount, INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS, InvoiceStatus, PO_STATUS_COLORS, PO_STATUS_LABELS, POStatus } from '@/types';


export default function PurchasesDashboardPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const { data: suppliersData } = useSuppliers(businessId,      { limit: 100 });
  const { data: posData }       = useSupplierPOs(businessId,    { limit: 100 });
  const { data: invData }       = usePurchaseInvoices(businessId, { limit: 100 });

  // ── KPIs calculés ─────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const invoices = invData?.data ?? [];
    const pos      = posData?.data ?? [];

    const totalAchats   = invoices.reduce((s, i) => s + Number(i.net_amount), 0);
    const totalPaye     = invoices.reduce((s, i) => s + Number(i.paid_amount), 0);
    const totalDu       = totalAchats - totalPaye;
    const overdueCount  = invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length;
    const overdueAmount = invoices
      .filter(i => i.status === InvoiceStatus.OVERDUE)
      .reduce((s, i) => s + (Number(i.net_amount) - Number(i.paid_amount)), 0);
    const pendingPOs    = pos.filter(p => p.status === POStatus.DRAFT || p.status === POStatus.SENT).length;
    const confirmedPOs  = pos.filter(p => p.status === POStatus.CONFIRMED || p.status === POStatus.PARTIALLY_RECEIVED).length;

    return { totalAchats, totalPaye, totalDu, overdueCount, overdueAmount, pendingPOs, confirmedPOs };
  }, [invData, posData]);

  // ── Top 5 fournisseurs par montant ─────────────────────────────────────────
  const top5Suppliers = useMemo(() => {
    const invoices = invData?.data ?? [];
    const map: Record<string, { name: string; total: number; count: number }> = {};

    invoices.forEach(inv => {
      if (!inv.supplier_id) return;
      if (!map[inv.supplier_id]) {
        map[inv.supplier_id] = { name: inv.supplier?.name ?? '—', total: 0, count: 0 };
      }
      map[inv.supplier_id].total += Number(inv.net_amount);
      map[inv.supplier_id].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invData]);

  const maxSupplierTotal = top5Suppliers[0]?.total || 1;

  // ── Répartition statuts BC ──────────────────────────────────────────────────
  const poStatusCounts = useMemo(() => {
    const pos = posData?.data ?? [];
    return Object.values(POStatus).map(status => ({
      status,
      count: pos.filter(p => p.status === status).length,
    })).filter(s => s.count > 0);
  }, [posData]);

  // ── BCs en attente de réception ──────────────────────────────────────────
  const pendingReceipts = useMemo(() =>
    (posData?.data ?? [])
      .filter(p => p.status === POStatus.CONFIRMED || p.status === POStatus.PARTIALLY_RECEIVED)
      .slice(0, 5),
    [posData]);

  // ── Factures récentes ────────────────────────────────────────────────────
  const recentInvoices = useMemo(() =>
    [...(invData?.data ?? [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [invData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Achats</h1>
        <p className="text-gray-500">Vue d'ensemble du module Gestion Fournisseurs & Achats</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Total achats</p>
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(kpis.totalAchats)}</p>
          <p className="text-xs text-gray-400 mt-1">{invData?.total ?? 0} factures</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Total dû</p>
            <TrendingUp className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatAmount(kpis.totalDu)}</p>
          <p className="text-xs text-gray-400 mt-1">payé : {formatAmount(kpis.totalPaye)}</p>
        </div>

        <div className={`rounded-xl border p-5 ${kpis.overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Factures en retard</p>
            <AlertTriangle className={`h-5 w-5 ${kpis.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${kpis.overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {kpis.overdueCount}
          </p>
          {kpis.overdueCount > 0 && (
            <p className="text-xs text-red-500 mt-1">{formatAmount(kpis.overdueAmount)} en souffrance</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">BCs à réceptionner</p>
            <Package className="h-5 w-5 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{kpis.confirmedPOs}</p>
          <p className="text-xs text-gray-400 mt-1">{kpis.pendingPOs} en attente de confirmation</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 fournisseurs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Top 5 fournisseurs
          </h2>
          {top5Suppliers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {top5Suppliers.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{s.name}</span>
                    <span className="text-gray-600 ml-2 flex-shrink-0">{formatAmount(s.total)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(s.total / maxSupplierTotal) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.count} facture(s)</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition statuts BC */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            Statuts des BCs
          </h2>
          {poStatusCounts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucun bon de commande</p>
          ) : (
            <div className="space-y-2">
              {poStatusCounts.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${PO_STATUS_COLORS[status]}`}>
                    {PO_STATUS_LABELS[status]}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 rounded-full h-2 w-24">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${(count / (posData?.total || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* BCs en attente de réception */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            BCs en attente de réception
          </h2>
          {pendingReceipts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucun BC en attente</p>
          ) : (
            <div className="space-y-2">
              {pendingReceipts.map(po => (
                <div key={po.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-mono font-medium text-gray-900 text-sm">{po.po_number}</p>
                    <p className="text-xs text-gray-500">{po.supplier?.name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${PO_STATUS_COLORS[po.status]}`}>
                    {PO_STATUS_LABELS[po.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Factures récentes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Factures récentes
          </h2>
          {recentInvoices.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-900">
                      {inv.invoice_number_supplier}
                    </p>
                    <p className="text-xs text-gray-500">{inv.supplier?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatAmount(inv.net_amount)}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${INVOICE_STATUS_COLORS[inv.status]}`}>
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats globales */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Résumé global</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{suppliersData?.total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Fournisseurs actifs</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{posData?.total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Bons de commande</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{invData?.total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Factures fournisseurs</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">
              {invData?.data.filter(i => i.status === InvoiceStatus.PAID).length ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Factures payées</p>
          </div>
        </div>
      </div>
    </div>
  );
}