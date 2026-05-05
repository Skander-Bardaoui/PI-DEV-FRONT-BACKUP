// src/components/purchases/DisputesSlideOver.tsx
import { useState } from 'react';
import { X, AlertTriangle, Clock, DollarSign, TrendingUp, Mail, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { DisputeResolutionModal } from './DisputeResolutionModal';

interface DisputedInvoice {
  id: string;
  invoice_number_supplier: string;
  invoice_date: string;
  net_amount: number;
  dispute_reason: string;
  dispute_category: string;
  updated_at: string;
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  supplier_po?: {
    po_number: string;
    net_amount: number;
  };
}

interface DisputesSlideOverProps {
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  onInvoiceSelect?: (invoiceId: string) => void;
}

export default function DisputesSlideOver({
  businessId,
  isOpen,
  onClose,
  onInvoiceSelect,
}: DisputesSlideOverProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<DisputedInvoice | null>(null);

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['disputed-invoices', businessId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/businesses/${businessId}/purchase-invoices?status=DISPUTED`
      );
      return response.data as DisputedInvoice[];
    },
    enabled: isOpen && !!businessId,
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  const getDaysInDispute = (updatedAt: string) => {
    const days = Math.floor(
      (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PRICE_DISCREPANCY: 'Écart de prix',
      QUANTITY_MISMATCH: 'Écart de quantité',
      CALCULATION_ERROR: 'Erreur de calcul',
      PARTIAL_DELIVERY: 'Livraison partielle',
      OTHER: 'Autre',
    };
    return labels[category] || 'Non catégorisé';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PRICE_DISCREPANCY: 'bg-red-100 text-red-700',
      QUANTITY_MISMATCH: 'bg-orange-100 text-orange-700',
      CALCULATION_ERROR: 'bg-purple-100 text-purple-700',
      PARTIAL_DELIVERY: 'bg-yellow-100 text-yellow-700',
      OTHER: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.OTHER;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide Over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Litiges Actifs</h2>
              <p className="text-sm text-white text-opacity-90">
                {invoices?.length || 0} facture(s) en litige
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun litige en cours
              </h3>
              <p className="text-gray-600">
                Toutes vos factures sont en ordre !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const daysInDispute = getDaysInDispute(invoice.updated_at);
                const discrepancy = invoice.supplier_po
                  ? invoice.net_amount - invoice.supplier_po.net_amount
                  : 0;

                return (
                  <div
                    key={invoice.id}
                    className="bg-white border-2 border-orange-200 rounded-xl p-4 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {invoice.invoice_number_supplier}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                              invoice.dispute_category
                            )}`}
                          >
                            {getCategoryLabel(invoice.dispute_category)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {invoice.supplier.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatAmount(invoice.net_amount)}
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            daysInDispute > 7 ? 'text-red-600' : 'text-orange-600'
                          }`}
                        >
                          <Clock className="w-3 h-3 inline mr-1" />
                          {daysInDispute}j
                        </div>
                      </div>
                    </div>

                    {/* Dispute Reason */}
                    <div className="bg-orange-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-orange-900 line-clamp-2">
                        {invoice.dispute_reason}
                      </p>
                    </div>

                    {/* Discrepancy */}
                    {invoice.supplier_po && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Écart:</span>
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            discrepancy > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          <DollarSign className="w-4 h-4" />
                          {discrepancy > 0 ? '+' : ''}
                          {formatAmount(discrepancy)}
                        </span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-300 rounded-lg transition-colors"
                      >
                        <Wrench className="w-4 h-4" />
                        Résoudre
                      </button>
                      <a
                        href={`mailto:${invoice.supplier.email}?subject=RE: Facture ${invoice.invoice_number_supplier}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedInvoice && (
        <DisputeResolutionModal
          businessId={businessId}
          invoiceId={selectedInvoice.id}
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={() => {
            setSelectedInvoice(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
