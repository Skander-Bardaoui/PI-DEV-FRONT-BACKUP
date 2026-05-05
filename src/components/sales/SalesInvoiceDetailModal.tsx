// src/components/sales/SalesInvoiceDetailModal.tsx
import { X, Package, ChevronDown, ChevronUp, Edit, Trash2, Send, DollarSign, AlertCircle, XCircle, FileText, Mail } from 'lucide-react';
import { useState } from 'react';
import { SalesInvoice, SALES_INVOICE_STATUS_COLORS, SALES_INVOICE_STATUS_LABELS, SalesInvoiceStatus } from '@/types/sales-invoice';
import {
  useSendSalesInvoice,
  useMarkPartiallyPaidSalesInvoice,
  useMarkPaidSalesInvoice,
  useMarkOverdueSalesInvoice,
  useCancelSalesInvoice,
  useSalesInvoice,
} from '@/hooks/useSalesInvoices';
import SalesInvoiceModal from './SalesInvoiceModal';
import ConfirmModal from '../ui/ConfirmModal';
import { ActionButton, ActionSection } from '../ui/ActionButton';
import { printSalesInvoice } from '@/utils/sales-invoice-print';
import { useAuth } from '@/hooks/useAuth';
import { getBusinessInfo } from '@/utils/business-info.utils';

interface Props {
  invoice: SalesInvoice;
  businessId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function SalesInvoiceDetailModal({ invoice: initialInvoice, businessId, onClose, onDelete }: Props) {
  const [showItems, setShowItems] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { user } = useAuth();

  // Fetch full invoice details with items
  const { data: fullInvoice, isLoading } = useSalesInvoice(businessId, initialInvoice.id);
  const invoice = fullInvoice || initialInvoice;

  const send = useSendSalesInvoice(businessId);
  const markPartiallyPaid = useMarkPartiallyPaidSalesInvoice(businessId);
  const markPaid = useMarkPaidSalesInvoice(businessId);
  const markOverdue = useMarkOverdueSalesInvoice(businessId);
  const cancel = useCancelSalesInvoice(businessId);

  const canEdit = invoice.status === SalesInvoiceStatus.DRAFT;
  const canSend = invoice.status === SalesInvoiceStatus.DRAFT;
  const canMarkPartiallyPaid = [SalesInvoiceStatus.SENT, SalesInvoiceStatus.OVERDUE].includes(invoice.status);
  const canMarkPaid = [SalesInvoiceStatus.SENT, SalesInvoiceStatus.PARTIALLY_PAID, SalesInvoiceStatus.OVERDUE].includes(invoice.status);
  const canMarkOverdue = invoice.status === SalesInvoiceStatus.SENT;
  const canCancel = [SalesInvoiceStatus.DRAFT, SalesInvoiceStatus.SENT].includes(invoice.status);
  const canDelete = invoice.status === SalesInvoiceStatus.DRAFT;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toFixed(3);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(invoice.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${SALES_INVOICE_STATUS_COLORS[invoice.status]}`}>
                  {SALES_INVOICE_STATUS_LABELS[invoice.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{invoice.client?.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Chargement des détails...</div>
          ) : (
            <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-medium">{invoice.client?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Date de facture</p>
                <p className="font-medium">{formatDate(invoice.date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-gray-500">Date d'échéance</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setShowItems(v => !v)}
                className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left"
              >
                <Package className="h-4 w-4" />
                Lignes de la facture ({invoice.items?.length ?? 0})
                {showItems ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </button>
              {showItems && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-500">Description</th>
                        <th className="text-center px-4 py-2 text-gray-500">Qté</th>
                        <th className="text-right px-4 py-2 text-gray-500">Prix HT</th>
                        <th className="text-center px-4 py-2 text-gray-500">TVA</th>
                        <th className="text-right px-4 py-2 text-gray-500">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(invoice.items ?? []).map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatAmount(item.unit_price)} DT</td>
                          <td className="px-4 py-2 text-center">{item.tax_rate_value}%</td>
                          <td className="px-4 py-2 text-right">{formatAmount(item.line_total_ht)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span><span>{formatAmount(invoice.subtotal_ht)} DT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA</span><span>{formatAmount(invoice.tax_amount)} DT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Timbre fiscal</span><span>{formatAmount(invoice.timbre_fiscal)} DT</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Net TTC</span><span>{formatAmount(invoice.net_amount)} DT</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </div>
          )}

          {/* Footer - Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-4">
              
              {/* Section: Documents & Communication */}
              <ActionSection title="Documents & Communication">
                <ActionButton
                  icon={FileText}
                  label="Télécharger PDF"
                  description="Générer le document"
                  onClick={async () => {
                    const info = await getBusinessInfo(user);
                    printSalesInvoice(invoice, info.businessName, info.businessMF, info.businessAddress);
                  }}
                  variant="danger"
                />

                {canSend && (
                  <ActionButton
                    icon={Mail}
                    label="Envoyer au client"
                    description={invoice.client?.email || 'Email client'}
                    onClick={() => send.mutate(invoice.id)}
                    variant="success"
                    loading={send.isPending}
                  />
                )}
              </ActionSection>

              {/* Section: Gestion de la facture */}
              {(canEdit || canMarkPartiallyPaid || canMarkPaid || canMarkOverdue) && (
                <ActionSection title="Gestion de la facture">
                  {canEdit && (
                    <ActionButton
                      icon={Edit}
                      label="Modifier"
                      description="Éditer les détails"
                      onClick={() => setEditOpen(true)}
                      variant="secondary"
                    />
                  )}

                  {canMarkPartiallyPaid && (
                    <ActionButton
                      icon={DollarSign}
                      label="Partiellement payé"
                      description="Paiement partiel reçu"
                      onClick={() => markPartiallyPaid.mutate(invoice.id)}
                      variant="warning"
                      loading={markPartiallyPaid.isPending}
                    />
                  )}

                  {canMarkPaid && (
                    <ActionButton
                      icon={DollarSign}
                      label="Marquer payé"
                      description="Paiement complet reçu"
                      onClick={() => markPaid.mutate(invoice.id)}
                      variant="success"
                      loading={markPaid.isPending}
                    />
                  )}

                  {canMarkOverdue && (
                    <ActionButton
                      icon={AlertCircle}
                      label="Marquer en retard"
                      description="Échéance dépassée"
                      onClick={() => markOverdue.mutate(invoice.id)}
                      variant="warning"
                      loading={markOverdue.isPending}
                    />
                  )}
                </ActionSection>
              )}

              {/* Section: Actions critiques */}
              {(canCancel || canDelete) && (
                <ActionSection title="Actions critiques" variant="danger">
                  {canCancel && (
                    <ActionButton
                      icon={XCircle}
                      label="Annuler"
                      description="Annuler la facture"
                      onClick={() => cancel.mutate(invoice.id)}
                      variant="warning"
                      loading={cancel.isPending}
                    />
                  )}

                  {canDelete && (
                    <ActionButton
                      icon={Trash2}
                      label="Supprimer"
                      description="Supprimer définitivement"
                      onClick={() => setDeleteConfirm(true)}
                      variant="danger"
                    />
                  )}
                </ActionSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <SalesInvoiceModal businessId={businessId} invoice={invoice} onClose={() => { setEditOpen(false); onClose(); }} />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer la facture"
          message={`Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoice_number} ?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}
