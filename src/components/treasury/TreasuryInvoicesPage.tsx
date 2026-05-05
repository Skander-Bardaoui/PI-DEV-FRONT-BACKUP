// src/pages/backoffice/treasury/TreasuryInvoicesPage.tsx

import { useState } from 'react';
import {
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCurrentBusinessMember } from '@/hooks/useCurrentBusinessMember';
import { useSalesInvoices } from '@/hooks/useSalesInvoices';
import {
  SalesInvoice,
  SalesInvoiceStatus,
  SALES_INVOICE_STATUS_LABELS,
  SALES_INVOICE_STATUS_COLORS,
} from '@/types/sales-invoice';
import { formatAmount, formatDate } from '@/types';
import SalesInvoiceDetailModal from '@/components/sales/SalesInvoiceDetailModal';
import ClientPaymentModal from './Clientpaymentmodal';

// ─── Urgency badge on due date ────────────────────────────────────────────
function getDueBadge(dueDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0)
    return { label: `${Math.abs(diffDays)}j en retard`, classes: 'text-red-600 font-semibold' };
  if (diffDays === 0)
    return { label: "Aujourd'hui", classes: 'text-orange-600 font-semibold' };
  if (diffDays <= 7)
    return { label: `Dans ${diffDays}j`, classes: 'text-amber-600 font-medium' };
  return { label: formatDate(dueDateStr), classes: 'text-gray-500' };
}

// ─── Progress bar for partially paid ─────────────────────────────────────
function PaymentProgress({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatAmount(paid)} / {formatAmount(total)}
      </span>
    </div>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────
function SummaryCards({ invoices }: { invoices: SalesInvoice[] }) {
  const totalToReceive = invoices.reduce(
    (sum, inv) => sum + (Number(inv.total_ttc) - Number(inv.paid_amount)),
    0,
  );
  const overdue = invoices.filter(
    (inv) => new Date(inv.due_date) < new Date(),
  );
  const totalOverdue = overdue.reduce(
    (sum, inv) => sum + (Number(inv.total_ttc) - Number(inv.paid_amount)),
    0,
  );
  const partial = invoices.filter(
    (inv) => inv.status === SalesInvoiceStatus.PARTIALLY_PAID,
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Total à encaisser */}
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-500" />
          Total à encaisser
        </p>
        <p className="text-2xl font-bold text-gray-900">{formatAmount(totalToReceive)}</p>
        <p className="text-xs text-gray-400 mt-1">{invoices.length} facture(s)</p>
      </div>

      {/* En retard */}
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

      {/* Partiellement payées */}
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-500" />
          Paiement partiel
        </p>
        <p className="text-2xl font-bold text-gray-900">{partial.length}</p>
        <p className="text-xs text-gray-400 mt-1">facture(s) en cours</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function TreasuryInvoicesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const { businessMember } = useCurrentBusinessMember();

  // Permission checks
  // BUSINESS_OWNER bypasses all permission checks
  const isOwner = user?.role === 'BUSINESS_OWNER' || businessMember?.role === 'BUSINESS_OWNER';
  const pay = businessMember?.payment_permissions;
  const canCreateClientPayment = isOwner || pay?.create_client_payment === true;

  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');

  const [detailInvoice, setDetailInvoice]   = useState<SalesInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);

  // Fetch SENT invoices (page 1)
  const { data: sentData, isLoading: sentLoading, refetch: refetchSent } = useSalesInvoices(
    businessId,
    { status: SalesInvoiceStatus.SENT, page, limit: 20 },
  );

  // Fetch PARTIALLY_PAID invoices (page 1)
  const { data: partialData, isLoading: partialLoading, refetch: refetchPartial } = useSalesInvoices(
    businessId,
    { status: SalesInvoiceStatus.PARTIALLY_PAID, page: 1, limit: 100 },
  );

  const isLoading   = sentLoading || partialLoading;

  // Merge + deduplicate
  const allInvoices: SalesInvoice[] = [
    ...(sentData?.data    ?? []),
    ...(partialData?.data ?? []),
  ].filter(
    (inv, idx, arr) => arr.findIndex((i) => i.id === inv.id) === idx,
  );

  // Client-side sort
  const sorted = [...allInvoices].sort((a, b) => {
    let valA: any, valB: any;
    if (sortField === 'due_date')       { valA = a.due_date;       valB = b.due_date; }
    else if (sortField === 'date')      { valA = a.date;           valB = b.date; }
    else if (sortField === 'total_ttc') { valA = Number(a.total_ttc); valB = Number(b.total_ttc); }
    else if (sortField === 'client')    { valA = a.client?.name ?? ''; valB = b.client?.name ?? ''; }
    else                                { valA = a.due_date;       valB = b.due_date; }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ?  1 : -1;
    return 0;
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
    `px-4 py-4 text-left cursor-pointer select-none hover:text-indigo-600 transition-colors ${
      sortField === field ? 'text-indigo-600' : ''
    }`;

  const handlePaymentSuccess = () => {
    refetchSent();
    refetchPartial();
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Encaissements à recevoir</h1>
        <p className="text-sm text-gray-500 mt-1">
          Factures envoyées et partiellement payées en attente de règlement client
        </p>
      </div>

      {/* SUMMARY CARDS */}
      {!isLoading && allInvoices.length > 0 && (
        <SummaryCards invoices={allInvoices} />
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400">Chargement...</div>
        ) : sorted.length === 0 ? (
          <div className="p-20 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun encaissement en attente</p>
            <p className="text-gray-400 text-sm mt-1">
              Toutes les factures envoyées ont été réglées.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className={thCls('invoice_number')} onClick={() => handleSort('invoice_number')}>
                    N° Facture <SortIcon field="invoice_number" />
                  </th>
                  <th className={thCls('client')} onClick={() => handleSort('client')}>
                    Client <SortIcon field="client" />
                  </th>
                  <th className={thCls('date')} onClick={() => handleSort('date')}>
                    Date <SortIcon field="date" />
                  </th>
                  <th className={thCls('due_date')} onClick={() => handleSort('due_date')}>
                    Échéance <SortIcon field="due_date" />
                  </th>
                  <th className={`${thCls('total_ttc')} text-right`} onClick={() => handleSort('total_ttc')}>
                    Montant TTC <SortIcon field="total_ttc" />
                  </th>
                  <th className="px-4 py-4 text-left">Progression</th>
                  <th className="px-4 py-4 text-center">Statut</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((inv) => {
                  const dueBadge  = getDueBadge(inv.due_date);
                  const remaining = Number(inv.total_ttc) - Number(inv.paid_amount);

                  return (
                    <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">

                      {/* N° Facture */}
                      <td className="px-4 py-4 font-mono text-sm text-gray-800">
                        {inv.invoice_number}
                      </td>

                      {/* Client */}
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {inv.client?.name ?? inv.client?.company_name ?? '—'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(inv.date)}
                      </td>

                      {/* Échéance */}
                      <td className={`px-4 py-4 text-sm ${dueBadge.classes}`}>
                        {dueBadge.label}
                      </td>

                      {/* Montant TTC */}
                      <td className="px-4 py-4 text-right font-semibold text-gray-900 text-sm">
                        {formatAmount(inv.total_ttc)}
                      </td>

                      {/* Progression */}
                      <td className="px-4 py-4 min-w-[180px]">
                        {inv.status === SalesInvoiceStatus.PARTIALLY_PAID ? (
                          <PaymentProgress
                            paid={Number(inv.paid_amount)}
                            total={Number(inv.total_ttc)}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            Restant : {formatAmount(remaining)}
                          </span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${SALES_INVOICE_STATUS_COLORS[inv.status]}`}>
                          {SALES_INVOICE_STATUS_LABELS[inv.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setDetailInvoice(inv)}
                            title="Voir le détail"
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canCreateClientPayment && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              title="Enregistrer un encaissement"
                              className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINATION — driven by sent invoices since they're the paginated set */}
            {(sentData?.total_pages ?? 1) > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  Page {sentData?.page} sur {sentData?.total_pages} —{' '}
                  <span className="font-medium">{sorted.length}</span> facture(s) affichées
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(sentData?.total_pages ?? 1, p + 1))}
                    disabled={page === (sentData?.total_pages ?? 1)}
                    className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {detailInvoice && (
        <SalesInvoiceDetailModal
          invoice={detailInvoice}
          businessId={businessId}
          onClose={() => setDetailInvoice(null)}
        />
      )}

      {paymentInvoice && (
        <ClientPaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
