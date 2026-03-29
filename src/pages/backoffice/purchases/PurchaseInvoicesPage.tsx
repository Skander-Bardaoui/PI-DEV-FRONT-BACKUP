// src/pages/backoffice/purchases/PurchaseInvoicesPage.tsx

import { useState } from 'react';
import {
  Plus,
  Eye,
  Check,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Scale,
  ScanLine,
  Info,
} from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth';

import {
  usePurchaseInvoices,
  useApprovePurchaseInvoice,
  useDisputePurchaseInvoice,
  useResolveDispute,
  useUpdatePayment,
} from '@/hooks/usePurchaseInvoices';

import { usePDFExport } from '@/hooks/usePDFExport';

import PurchaseInvoiceModal from '@/components/purchases/PurchaseInvoiceModal';
import CorrectInvoiceModal from '@/components/purchases/CorrectInvoiceModal';
import PDFButton from '@/components/purchases/PDFButton';
import OcrInvoiceModal from '@/components/purchases/OcrInvoiceModal';

import {
  formatAmount,
  formatDate,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  InvoiceStatus,
  PurchaseInvoice,
} from '@/types';
import InvoiceDetailModal from '@/components/purchases/Invoicedetailmodal ';
import { PaymentModal } from '@/components/purchases/Paymentmodal';
import DisputeModal from '@/components/purchases/Disputemodal ';

export default function PurchaseInvoicesPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const [createOpen, setCreateOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<PurchaseInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<PurchaseInvoice | null>(null);
  const [disputeInvoice, setDisputeInvoice] = useState<PurchaseInvoice | null>(null);
  const [correctInvoice, setCorrectInvoice] = useState<PurchaseInvoice | null>(null);

  const { data, isLoading } = usePurchaseInvoices(businessId, {
    page: 1,
    limit: 100,
  });

  const approve = useApprovePurchaseInvoice(businessId);
  const dispute = useDisputePurchaseInvoice(businessId);
  const resolveDisp = useResolveDispute(businessId);
  const updatePayment = useUpdatePayment(businessId);

  const { exportFacture, loading: pdfLoading } = usePDFExport();

  return (
    <div className="space-y-6">

      {/* HEADER avec info explicative */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Factures fournisseurs</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez et suivez toutes vos factures d'achat</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/app/purchases/three-way-matching'}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center transition-colors shadow-sm"
            >
              <Scale className="h-4 w-4" />
              Rapprochement 3 Voies IA
            </button>

            <button
              onClick={() => setOcrOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center transition-colors shadow-sm"
            >
              <ScanLine className="h-4 w-4" />
              Scanner une facture
            </button>

            <button
              onClick={() => setCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Saisir manuellement
            </button>
          </div>
        </div>

        {/* Info banner pour expliquer le rapprochement 3 voies */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-purple-900 font-medium">Rapprochement automatique disponible</p>
            <p className="text-xs text-purple-700 mt-1">
              Les factures liées à un bon de commande (badge <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 rounded text-purple-700 font-medium"><Scale className="h-3 w-3" />BC</span>) peuvent être rapprochées automatiquement avec la réception pour valider les montants.
            </p>
          </div>
        </div>
      </div>

      {/* TABLE avec meilleure lisibilité */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
            <p className="text-gray-500 text-sm">Chargement des factures...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">N° Facture</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Montant TTC</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {!data?.data.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Aucune facture trouvée
                    </td>
                  </tr>
                ) : (
                  data.data.map(inv => {
                    return (
                      <tr key={inv.id} className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200">

                        <td className="px-4 py-4">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {inv.invoice_number_supplier}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900 font-medium">
                            {inv.supplier?.name}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(inv.invoice_date)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {formatAmount(inv.net_amount)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${INVOICE_STATUS_COLORS[inv.status]}`}
                              >
                                {INVOICE_STATUS_LABELS[inv.status]}
                              </span>
                              {inv.supplier_po_id && (
                                <span 
                                  className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium flex items-center gap-1 border border-purple-200"
                                  title="Rapprochement 3 voies disponible - Cette facture est liée à un BC"
                                >
                                  <Scale className="h-3 w-3" />
                                  BC
                                </span>
                              )}
                            </div>
                            {inv.status === InvoiceStatus.DISPUTED && inv.dispute_reason && (
                              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded max-w-[200px] truncate border border-orange-200" title={inv.dispute_reason}>
                                {inv.dispute_reason}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-1">

                            {/* Détail */}
                            <button
                              onClick={() => setDetailInvoice(inv)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* PDF */}
                            <PDFButton
                              variant="icon"
                              loading={pdfLoading}
                              onClick={() => exportFacture(inv)}
                            />

                            {/* RAPPROCHEMENT 3 VOIES - Visible si BC existe */}
                            {inv.supplier_po_id && (
                              <button
                                onClick={() => window.location.href = `/app/purchases/three-way-matching/${inv.id}`}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Rapprochement 3 voies avec IA"
                              >
                                <Scale className="h-4 w-4" />
                              </button>
                            )}

                            {/* APPROBATION - Seulement pour factures PENDING sans BC */}
                            {inv.status === InvoiceStatus.PENDING && !inv.supplier_po_id && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Approuver ${inv.invoice_number_supplier} sans rapprochement BC ?\n\nAttention : Cette facture n'est pas liée à un bon de commande.`
                                    )
                                  ) {
                                    approve.mutate(inv.id);
                                  }
                                }}
                                disabled={approve.isPending}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approuver la facture"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}

                            {/* PAIEMENT */}
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Enregistrer un paiement"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>

                            {/* LITIGE */}
                            {inv.status === InvoiceStatus.DISPUTED ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Résoudre le litige pour ${inv.invoice_number_supplier} ?\n\nLa facture sera marquée comme approuvée.`)) {
                                    resolveDisp.mutate(inv.id);
                                  }
                                }}
                                disabled={resolveDisp.isPending}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Résoudre le litige"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setDisputeInvoice(inv)}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Signaler un litige"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}

      {createOpen && (
        <PurchaseInvoiceModal
          businessId={businessId}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {ocrOpen && (
        <OcrInvoiceModal
          businessId={businessId}
          onClose={() => setOcrOpen(false)}
        />
      )}

      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          businessId={businessId}
          onClose={() => setDetailInvoice(null)}
        />
      )}

      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onConfirm={(paid_amount) => {
            updatePayment.mutate({
              id: paymentInvoice.id,
              dto: { paid_amount },
            });
            setPaymentInvoice(null);
          }}
        />
      )}

      {disputeInvoice && (
        <DisputeModal
          invoice={disputeInvoice}
          onClose={() => setDisputeInvoice(null)}
          onConfirm={(reason) => {
            dispute.mutate({
              id: disputeInvoice.id,
              dto: { dispute_reason: reason },
            });
            setDisputeInvoice(null);
          }}
        />
      )}

      {correctInvoice && (
        <CorrectInvoiceModal
          businessId={businessId}
          invoice={correctInvoice}
          onClose={() => setCorrectInvoice(null)}
        />
      )}
    </div>
  );
}