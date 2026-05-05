// src/components/sales/RecurringInvoiceHistoryDrawer.tsx
import { X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRecurringInvoiceHistory } from '@/hooks/useRecurringInvoices';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  businessId: string;
  recurringId: string | null;
  recurringDescription: string;
  totalGenerated: number;
  onClose: () => void;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  PAID: 'Payée',
  PARTIALLY_PAID: 'Partiellement payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function RecurringInvoiceHistoryDrawer({
  businessId,
  recurringId,
  recurringDescription,
  totalGenerated,
  onClose,
}: Props) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useRecurringInvoiceHistory(businessId, recurringId, page, limit);

  if (!recurringId) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toFixed(3);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Historique des factures</h2>
            <p className="text-sm text-gray-600 mt-1">{recurringDescription}</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalGenerated} facture{totalGenerated > 1 ? 's' : ''} générée{totalGenerated > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="space-y-3">
              {data.data.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/app/sales/invoices`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              INVOICE_STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Générée le {formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatAmount(invoice.total_ttc)} DT
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune facture générée pour le moment</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="border-t border-gray-200 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} sur {data.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
