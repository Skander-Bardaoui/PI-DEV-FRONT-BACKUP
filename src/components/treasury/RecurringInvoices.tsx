import { useState, useMemo, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';
import {
  useRecurringInvoicePayments,
  useValidateRecurringInvoicePayment,
  useSendRecurringInvoiceReminder,
} from '@/hooks/useRecurringInvoicePayments';
import { useAccounts } from '@/hooks/useAccounts';
import { RecurringInvoicePayment } from '@/api/recurring-invoice-payments.api';
import { formatAmount, formatDate } from '@/types';
import { SummaryCardSkeleton, RecurringInvoiceRowSkeleton } from './SkeletonLoaders';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  YEARLY: 'Annuel',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'En pause',
  INACTIVE: 'Inactive',
};

// ─── Payment Validation Modal ─────────────────────────────────────────────
function PaymentValidationModal({
  recurringInvoice,
  onClose,
  onConfirm,
}: {
  recurringInvoice: RecurringInvoicePayment | null;
  onClose: () => void;
  onConfirm: (data: { account_id: string; payment_date: string; reference: string; notes: string }) => void;
}) {
  const { accounts } = useAccounts();
  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!recurringInvoice) return null;

  // Calculate amount with discount
  let amount = Number(recurringInvoice.amount);
  if (recurringInvoice.discount_type && recurringInvoice.discount_value) {
    if (recurringInvoice.discount_type === 'PERCENTAGE') {
      amount = amount * (1 - Number(recurringInvoice.discount_value) / 100);
    } else if (recurringInvoice.discount_type === 'FIXED') {
      amount = Math.max(0, amount - Number(recurringInvoice.discount_value));
    }
  }

  const taxAmount = amount * (Number(recurringInvoice.tax_rate) / 100);
  const totalAmount = amount + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error('Veuillez sélectionner un compte');
      return;
    }
    onConfirm({ account_id: accountId, payment_date: paymentDate, reference, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Valider le paiement
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {recurringInvoice.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Client:</span>
            <span className="font-medium">{recurringInvoice.client?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Fréquence:</span>
            <span className="font-medium">{FREQUENCY_LABELS[recurringInvoice.frequency]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Montant HT:</span>
            <span className="font-medium">{formatAmount(amount)} TND</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">TVA ({recurringInvoice.tax_rate}%):</span>
            <span className="font-medium">{formatAmount(taxAmount)} TND</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span className="text-gray-700">Total TTC:</span>
            <span className="text-green-600">{formatAmount(totalAmount)} TND</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte <span className="text-red-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sélectionner un compte</option>
              {accounts.filter(acc => acc.is_active).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - {formatAmount(acc.current_balance)} TND
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de paiement <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Référence du paiement"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              Valider le paiement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────────────────
function SummaryBar({ invoices }: { invoices: RecurringInvoicePayment[] }) {
  const activeCount = invoices.filter((i) => i.status === 'ACTIVE').length;
  const pausedCount = invoices.filter((i) => i.status === 'PAUSED').length;

  const monthlyRevenue = invoices
    .filter((i) => i.status === 'ACTIVE')
    .reduce((sum, i) => {
      let amount = Number(i.amount);
      if (i.discount_type && i.discount_value) {
        if (i.discount_type === 'PERCENTAGE') {
          amount = amount * (1 - Number(i.discount_value) / 100);
        } else if (i.discount_type === 'FIXED') {
          amount = Math.max(0, amount - Number(i.discount_value));
        }
      }
      const taxAmount = amount * (Number(i.tax_rate) / 100);
      const total = amount + taxAmount;

      // Normalize to monthly
      switch (i.frequency) {
        case 'DAILY':
          return sum + total * 30;
        case 'WEEKLY':
          return sum + total * 4.33;
        case 'MONTHLY':
          return sum + total;
        case 'QUARTERLY':
          return sum + total / 3;
        case 'YEARLY':
          return sum + total / 12;
        default:
          return sum + total;
      }
    }, 0);

  const totalGenerated = invoices.reduce((sum, i) => sum + i.invoices_generated, 0);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <RefreshCw className="h-3 w-3 text-green-500" />
          Factures actives
        </p>
        <p className="text-2xl font-bold text-green-600">{activeCount}</p>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-amber-500" />
          En pause
        </p>
        <p className="text-2xl font-bold text-amber-600">{pausedCount}</p>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-blue-500" />
          Revenu mensuel prévu
        </p>
        <p className="text-2xl font-bold text-blue-600">{formatAmount(monthlyRevenue)}</p>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-purple-500" />
          Total généré
        </p>
        <p className="text-2xl font-bold text-purple-600">{totalGenerated}</p>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────
function RecurringInvoicesTable({
  invoices,
  onValidatePayment,
  onSendReminder,
}: {
  invoices: RecurringInvoicePayment[];
  onValidatePayment: (invoice: RecurringInvoicePayment) => void;
  onSendReminder: (invoice: RecurringInvoicePayment) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="p-20 text-center">
        <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Aucune facture récurrente trouvée</p>
        <p className="text-gray-400 text-sm mt-1">
          Les factures récurrentes configurées apparaîtront ici.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      PAUSED: 'bg-amber-100 text-amber-700 border-amber-200',
      INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return badges[status as keyof typeof badges] || badges.INACTIVE;
  };

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-4 py-4 text-left">Client</th>
          <th className="px-4 py-4 text-left">Description</th>
          <th className="px-4 py-4 text-center">Fréquence</th>
          <th className="px-4 py-4 text-right">Montant TTC</th>
          <th className="px-4 py-4 text-center">Prochaine date</th>
          <th className="px-4 py-4 text-center">Générées</th>
          <th className="px-4 py-4 text-center">Statut</th>
          <th className="px-4 py-4 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => {
          // Calculate amount with discount
          let amount = Number(invoice.amount);
          if (invoice.discount_type && invoice.discount_value) {
            if (invoice.discount_type === 'PERCENTAGE') {
              amount = amount * (1 - Number(invoice.discount_value) / 100);
            } else if (invoice.discount_type === 'FIXED') {
              amount = Math.max(0, amount - Number(invoice.discount_value));
            }
          }
          const taxAmount = amount * (Number(invoice.tax_rate) / 100);
          const totalAmount = amount + taxAmount;

          const canValidatePayment = invoice.status === 'PAUSED';

          return (
            <tr
              key={invoice.id}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-4 text-sm font-medium text-gray-700">
                {invoice.client?.name ?? '—'}
              </td>

              <td className="px-4 py-4 text-sm text-gray-700 max-w-[240px]">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {invoice.description}
                    {invoice.discount_type && invoice.discount_value && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
                        <Tag className="h-3 w-3" />
                        {invoice.discount_type === 'PERCENTAGE'
                          ? `-${invoice.discount_value}%`
                          : `-${formatAmount(invoice.discount_value)} TND`}
                      </span>
                    )}
                  </div>
                  {invoice.notes && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {invoice.notes}
                    </div>
                  )}
                </div>
              </td>

              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-700">
                  <RefreshCw className="h-3 w-3" />
                  {FREQUENCY_LABELS[invoice.frequency]}
                </span>
              </td>

              <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                {formatAmount(totalAmount)} TND
              </td>

              <td className="px-4 py-4 text-center text-sm text-gray-500">
                <div className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(invoice.next_invoice_date)}
                </div>
              </td>

              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                  {invoice.invoices_generated}
                </span>
              </td>

              <td className="px-4 py-4 text-center">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium border ${getStatusBadge(invoice.status)}`}
                >
                  {STATUS_LABELS[invoice.status]}
                </span>
              </td>

              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onValidatePayment(invoice)}
                    disabled={!canValidatePayment}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      canValidatePayment
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={canValidatePayment ? 'Valider le paiement' : 'Disponible uniquement pour les factures en pause'}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Valider
                  </button>
                  <button
                    onClick={() => onSendReminder(invoice)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                    title="Envoyer un rappel"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Rappel
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function RecurringInvoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<RecurringInvoicePayment | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data: invoices = [], isLoading } = useRecurringInvoicePayments();
  const validatePayment = useValidateRecurringInvoicePayment();
  const sendReminder = useSendRecurringInvoiceReminder();

  // Show skeleton for minimum 2 seconds
  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter && inv.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.description?.toLowerCase().includes(q) ||
          inv.client?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleValidatePayment = (invoice: RecurringInvoicePayment) => {
    setSelectedInvoice(invoice);
  };

  const handleConfirmPayment = async (data: {
    account_id: string;
    payment_date: string;
    reference: string;
    notes: string;
  }) => {
    if (!selectedInvoice) return;

    try {
      await validatePayment.mutateAsync({
        id: selectedInvoice.id,
        dto: data,
      });
      toast.success('Paiement validé avec succès');
      setSelectedInvoice(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation du paiement');
    }
  };

  const handleSendReminder = async (invoice: RecurringInvoicePayment) => {
    try {
      const result = await sendReminder.mutateAsync(invoice.id);
      toast.success(`Rappel envoyé à ${result.sentTo}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'envoi du rappel');
    }
  };

  const isDisplayLoading = isLoading || showSkeleton;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Factures récurrentes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les paiements de vos factures récurrentes
        </p>
      </div>

      {/* SUMMARY */}
      {isDisplayLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>
      ) : (
        filtered.length > 0 && <SummaryBar invoices={filtered} />
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher client, description…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">En pause</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {filtered.length} facture(s) récurrente(s)
        </span>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isDisplayLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fréquence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prochaine facture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière facture</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Factures générées</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <RecurringInvoiceRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <RecurringInvoicesTable
              invoices={paginated}
              onValidatePayment={handleValidatePayment}
              onSendReminder={handleSendReminder}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  Page {page} sur {totalPages} —{' '}
                  <span className="font-medium">{filtered.length}</span> facture(s)
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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

      {/* PAYMENT VALIDATION MODAL */}
      <PaymentValidationModal
        recurringInvoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
