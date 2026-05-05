// src/components/treasury/ExpensesToPayPage.tsx

import { useState } from 'react';
import {
  CreditCard,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CalendarDays, // ✅ add this
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCurrentBusinessMember } from '@/hooks/useCurrentBusinessMember';
import { useApprovedOrPartialInvoices } from '@/hooks/usePurchaseInvoices';
import { formatAmount, formatDate, InvoiceStatus, PurchaseInvoice } from '@/types';
import InvoiceDetailModal from '@/components/purchases/Invoicedetailmodal ';
import SupplierPaymentModal from './Supplierpaymentmodal';
import InstallmentScheduleModal from '@/components/treasury/InstallmentScheduleModal';

const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  [InvoiceStatus.APPROVED]: {
    label: 'Approuvée',
    classes: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [InvoiceStatus.PARTIALLY_PAID]: {
    label: 'Paiement partiel',
    classes: 'bg-amber-100 text-amber-700',
    icon: <Clock className="h-3 w-3" />,
  },
};

function getDueBadge(dueDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}j en retard`, classes: 'text-red-600 font-semibold' };
  if (diffDays === 0) return { label: "Aujourd'hui", classes: 'text-orange-600 font-semibold' };
  if (diffDays <= 7) return { label: `Dans ${diffDays}j`, classes: 'text-amber-600 font-medium' };
  return { label: formatDate(dueDateStr), classes: 'text-gray-500' };
}

function PaymentProgress({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatAmount(paid)} / {formatAmount(total)}
      </span>
    </div>
  );
}

function SummaryCards({ invoices }: { invoices: PurchaseInvoice[] }) {
  const totalDue = invoices.reduce((sum, inv) => sum + (Number(inv.net_amount) - Number(inv.paid_amount)), 0);
  const overdue = invoices.filter((inv) => new Date(inv.due_date) < new Date());
  const totalOverdue = overdue.reduce((sum, inv) => sum + (Number(inv.net_amount) - Number(inv.paid_amount)), 0);
  const partial = invoices.filter((inv) => inv.status === InvoiceStatus.PARTIALLY_PAID);
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total à payer</p>
        <p className="text-2xl font-bold text-gray-900">{formatAmount(totalDue)}</p>
        <p className="text-xs text-gray-400 mt-1">{invoices.length} facture(s)</p>
      </div>
      <div className={`rounded-xl border p-5 ${overdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          {overdue.length > 0 && <AlertCircle className="h-3 w-3 text-red-500" />}
          En retard
        </p>
        <p className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {formatAmount(totalOverdue)}
        </p>
        <p className="text-xs text-gray-400 mt-1">{overdue.length} facture(s)</p>
      </div>
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paiement partiel</p>
        <p className="text-2xl font-bold text-gray-900">{partial.length}</p>
        <p className="text-xs text-gray-400 mt-1">facture(s) en cours</p>
      </div>
    </div>
  );
}

export default function ExpensesToPayPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const { businessMember } = useCurrentBusinessMember();

  // Permission checks
  // BUSINESS_OWNER bypasses all permission checks
  const isOwner = user?.role === 'BUSINESS_OWNER' || businessMember?.role === 'BUSINESS_OWNER';
  const pay = businessMember?.payment_permissions;
  const canCreateSupplierPayment = isOwner || pay?.create_supplier_payment === true;
  const canCreateSchedule = isOwner || pay?.create_schedule === true;

  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [detailInvoice, setDetailInvoice] = useState<PurchaseInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<PurchaseInvoice | null>(null);
  const [installmentInvoice, setInstallmentInvoice] = useState<PurchaseInvoice | null>(null); // ✅ inside component

  const { data, isLoading } = useApprovedOrPartialInvoices(businessId, {
    page, limit: 20, sort_field: sortField, sort_dir: sortDir,
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-indigo-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thCls = (field: string) =>
    `px-4 py-4 text-left cursor-pointer select-none hover:text-indigo-600 transition-colors ${sortField === field ? 'text-indigo-600' : ''}`;

  const allInvoices = data?.data ?? [];

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses à payer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Factures approuvées et partiellement payées en attente de règlement
          </p>
        </div>
      </div>

      {!isLoading && allInvoices.length > 0 && <SummaryCards invoices={allInvoices} />}

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400">Chargement...</div>
        ) : allInvoices.length === 0 ? (
          <div className="p-20 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune facture à payer</p>
            <p className="text-gray-400 text-sm mt-1">Toutes les factures approuvées ont été réglées.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className={thCls('invoice_number_supplier')} onClick={() => handleSort('invoice_number_supplier')}>
                    N° Facture <SortIcon field="invoice_number_supplier" />
                  </th>
                  <th className={thCls('supplier')} onClick={() => handleSort('supplier')}>
                    Fournisseur <SortIcon field="supplier" />
                  </th>
                  <th className={thCls('invoice_date')} onClick={() => handleSort('invoice_date')}>
                    Date <SortIcon field="invoice_date" />
                  </th>
                  <th className={thCls('due_date')} onClick={() => handleSort('due_date')}>
                    Échéance <SortIcon field="due_date" />
                  </th>
                  <th className={`${thCls('net_amount')} text-right`} onClick={() => handleSort('net_amount')}>
                    Montant net <SortIcon field="net_amount" />
                  </th>
                  <th className="px-4 py-4 text-left">Progression</th>
                  <th className="px-4 py-4 text-center">Statut</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allInvoices.map((inv) => {
                  const dueBadge = getDueBadge(inv.due_date as unknown as string);
                  const statusCfg = STATUS_CONFIG[inv.status];
                  const remaining = Number(inv.net_amount) - Number(inv.paid_amount);
                  return (
                    <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-mono text-sm text-gray-800">{inv.invoice_number_supplier}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{inv.supplier?.name ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{formatDate(inv.invoice_date)}</td>
                      <td className={`px-4 py-4 text-sm ${dueBadge.classes}`}>{dueBadge.label}</td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900 text-sm">{formatAmount(inv.net_amount)}</td>
                      <td className="px-4 py-4 min-w-[180px]">
                        {inv.status === InvoiceStatus.PARTIALLY_PAID ? (
                          <PaymentProgress paid={Number(inv.paid_amount)} total={Number(inv.net_amount)} />
                        ) : (
                          <span className="text-xs text-gray-400">Restant : {formatAmount(remaining)}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {statusCfg && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${statusCfg.classes}`}>
                            {statusCfg.icon}{statusCfg.label}
                          </span>
                        )}
                      </td>

                      {/* ── Actions ── */}
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">

                          {/* Détail */}
                          <button
                            onClick={() => setDetailInvoice(inv)}
                            title="Voir le détail"
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Paiement direct */}
                          {canCreateSupplierPayment && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              title="Enregistrer un paiement"
                              className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}

                          {/* ✅ Paiement échelonné */}
                          {canCreateSchedule && (
                            <button
                              onClick={() => setInstallmentInvoice(inv)}
                              title="Paiement échelonné"
                              className="p-1.5 hover:bg-violet-50 rounded-lg text-gray-500 hover:text-violet-600 transition-colors"
                            >
                              <CalendarDays className="h-4 w-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(data?.total_pages ?? 1) > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  Page {data?.page} sur {data?.total_pages} — <span className="font-medium">{data?.total}</span> facture(s)
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(data?.total_pages ?? 1, p + 1))} disabled={page === (data?.total_pages ?? 1)} className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {detailInvoice && (
        <InvoiceDetailModal invoice={detailInvoice} businessId={businessId} onClose={() => setDetailInvoice(null)} />
      )}

      {paymentInvoice && (
        <SupplierPaymentModal
          businessId={businessId}
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => setPaymentInvoice(null)}
        />
      )}

      {/* ✅ Installment modal */}
      {installmentInvoice && (
        <InstallmentScheduleModal
          businessId={businessId}
          invoice={installmentInvoice}
          onClose={() => setInstallmentInvoice(null)}
          onSuccess={() => setInstallmentInvoice(null)}
        />
      )}

    </div>
  );
}
