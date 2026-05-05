// src/components/purchases/InvoiceDetailModal.tsx
import { useState } from 'react';
import {
  X,
  ExternalLink,
  Pencil,
  Download,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import { formatAmount, formatDate, INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS, InvoiceStatus, PurchaseInvoice, round3 } from '@/types';
import { usePDFExport } from '@/hooks/usePDFExport';
import CorrectInvoiceModal from '@/components/purchases/CorrectInvoiceModal';
import { ActionButton, ActionSection } from '@/components/ui/ActionButton';

interface Props {
  invoice:    PurchaseInvoice;
  onClose:    () => void;
  businessId: string;
}

export default function InvoiceDetailModal({ invoice, onClose, businessId }: Props) {
  const remaining = round3(Number(invoice.net_amount) - Number(invoice.paid_amount));
  const paidPct   = Math.round((Number(invoice.paid_amount) / Number(invoice.net_amount)) * 100);

  const { exportFacture, loading } = usePDFExport();
  const [correctOpen, setCorrectOpen] = useState(false);

  // Déterminer l'icône de statut
  const getStatusIcon = () => {
    switch (invoice.status) {
      case InvoiceStatus.PAID:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case InvoiceStatus.DISPUTED:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case InvoiceStatus.OVERDUE:
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">

          {/* Header simplifié */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon()}
                  <h2 className="text-xl font-semibold text-gray-900">{invoice.invoice_number_supplier}</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${INVOICE_STATUS_COLORS[invoice.status]}`}>
                    {INVOICE_STATUS_LABELS[invoice.status]}
                  </span>
                  {invoice.supplier_po && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                      <Package className="w-3 h-3" />
                      BC: {invoice.supplier_po.po_number}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="p-6 space-y-5">

              {/* Informations principales - version simplifiée */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50/50 rounded-lg p-3.5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600">Fournisseur</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{invoice.supplier?.name}</p>
                </div>

                <div className="bg-purple-50/50 rounded-lg p-3.5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-medium text-gray-600">Date facture</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</p>
                </div>

                <div className={`rounded-lg p-3.5 border ${
                  invoice.status === InvoiceStatus.OVERDUE
                    ? 'bg-red-50/50 border-red-100'
                    : 'bg-green-50/50 border-green-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className={`w-4 h-4 ${
                      invoice.status === InvoiceStatus.OVERDUE ? 'text-red-500' : 'text-green-500'
                    }`} />
                    <span className="text-xs font-medium text-gray-600">Date échéance</span>
                  </div>
                  <p className={`text-sm font-semibold ${
                    invoice.status === InvoiceStatus.OVERDUE ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(invoice.due_date)}
                  </p>
                </div>

                <div className="bg-amber-50/50 rounded-lg p-3.5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-gray-600">Montant total</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatAmount(invoice.net_amount)}</p>
                </div>
              </div>

              {/* Détail des montants - simplifié */}
              <div className="bg-gray-50/70 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Détail des montants</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoice.subtotal_ht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timbre fiscal</span>
                    <span className="font-medium text-gray-900">{formatAmount(invoice.timbre_fiscal)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Net TTC</span>
                    <span className="text-lg font-bold text-indigo-600">{formatAmount(invoice.net_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Suivi du paiement - simplifié */}
              <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Suivi du paiement</h3>
                  <span className="text-lg font-bold text-green-600">{paidPct}%</span>
                </div>
                
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden mb-3">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(paidPct, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Montant payé</p>
                    <p className="font-semibold text-green-600">{formatAmount(invoice.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Reste à payer</p>
                    <p className={`font-semibold ${
                      remaining > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {formatAmount(remaining)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Motif litige - avec bouton de résolution */}
              {invoice.status === InvoiceStatus.DISPUTED && invoice.dispute_reason && (
                <div className="bg-orange-50/50 border-2 border-orange-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-orange-900 mb-2">Motif du litige</h3>
                      <p className="text-sm text-orange-800 mb-3">{invoice.dispute_reason}</p>
                      
                      {/* Bouton de résolution visible */}
                      <button
                        onClick={() => setCorrectOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm shadow-sm"
                      >
                        <Pencil className="w-4 h-4" />
                        Résoudre ce litige
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer avec boutons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="space-y-4">
              
              {/* Section: Documents */}
              <ActionSection title="Documents">
                <ActionButton
                  icon={Download}
                  label="Télécharger PDF"
                  description="Générer la facture"
                  onClick={() => exportFacture(invoice)}
                  variant="indigo"
                  loading={loading}
                />
                
                {invoice.receipt_url && (
                  <ActionButton
                    icon={ExternalLink}
                    label="Voir le scan"
                    description="Ouvrir le document"
                    onClick={() => window.open(invoice.receipt_url, '_blank')}
                    variant="primary"
                  />
                )}
              </ActionSection>
            </div>
          </div>
        </div>
      </div>

      {correctOpen && (
        <CorrectInvoiceModal
          businessId={businessId}
          invoice={invoice}
          onClose={() => {
            setCorrectOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}