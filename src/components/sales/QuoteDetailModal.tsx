// src/components/sales/QuoteDetailModal.tsx
import { X, Package, ChevronDown, ChevronUp, Edit, Trash2, Send, Check, XCircle, FileText, ShoppingCart, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, QUOTE_STATUS_COLORS, QUOTE_STATUS_LABELS, QuoteStatus } from '@/types/quote';
import {
  useSendQuote,
  useAcceptQuote,
  useRejectQuote,
  useConvertQuote,
  useConvertQuoteToInvoice,
  useConvertQuoteToOrder,
  useQuote,
} from '@/hooks/useQuotes';
import QuoteModal from './QuoteModal';
import ConfirmModal from '../ui/ConfirmModal';
import { ActionButton, ActionSection } from '../ui/ActionButton';
import { printQuote } from '@/utils/sales-quote-print';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getBusinessInfo } from '@/utils/business-info.utils';

interface Props {
  quote: Quote;
  businessId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function QuoteDetailModal({ quote: initialQuote, businessId, onClose, onDelete }: Props) {
  const [showItems, setShowItems] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Fetch full quote details with items
  const { data: fullQuote, isLoading } = useQuote(businessId, initialQuote.id);
  const quote = fullQuote || initialQuote;

  const send = useSendQuote(businessId);
  const accept = useAcceptQuote(businessId);
  const reject = useRejectQuote(businessId);
  const convert = useConvertQuote(businessId);
  const convertToInvoice = useConvertQuoteToInvoice(businessId);
  const convertToOrder = useConvertQuoteToOrder(businessId);

  const handleConvertToInvoice = async () => {
    try {
      await convertToInvoice.mutateAsync(quote.id);
      toast.success('Facture créée', 'La facture a été créée avec succès. Rafraîchissez la page pour voir les changements.');
      onClose();
    } catch (error: any) {
      console.error('Conversion error:', error);
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la conversion';
      toast.error('Erreur de conversion', errorMessage);
    }
  };

  const handleConvertToOrder = async () => {
    try {
      await convertToOrder.mutateAsync(quote.id);
      toast.success('Commande créée', 'La commande a été créée avec succès. Rafraîchissez la page pour voir les changements.');
      onClose();
    } catch (error: any) {
      console.error('Conversion error:', error);
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la conversion';
      toast.error('Erreur de conversion', errorMessage);
    }
  };

  const handleAccept = async () => {
    try {
      // First accept the quote
      await accept.mutateAsync(quote.id);
      
      // Then automatically convert to sales order
      await convertToOrder.mutateAsync(quote.id);
      
      toast.success('Devis accepté et converti', 'Le devis a été accepté et converti en commande avec succès.');
      onClose();
    } catch (error: any) {
      console.error('Accept/Convert error:', error);
      const errorMessage = error?.response?.data?.message || 'Erreur lors de l\'acceptation';
      toast.error('Erreur', errorMessage);
    }
  };

  const canEdit = quote.status === QuoteStatus.DRAFT;
  const canSend = quote.status === QuoteStatus.DRAFT;
  const canAccept = quote.status === QuoteStatus.SENT;
  const canReject = quote.status === QuoteStatus.SENT;
  const canConvert = quote.status === QuoteStatus.ACCEPTED;
  const canDelete = quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.CONVERTED;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return Number(amount).toFixed(3);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(quote.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{quote.quoteNumber}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${QUOTE_STATUS_COLORS[quote.status]}`}>
                  {QUOTE_STATUS_LABELS[quote.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{quote.client?.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Chargement des détails...</div>
          ) : (
            <div className="p-6 space-y-6">
            {/* Infos générales */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-medium">{quote.client?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Date du devis</p>
                <p className="font-medium">{formatDate(quote.quoteDate)}</p>
              </div>
              {quote.validUntil && (
                <div>
                  <p className="text-gray-500">Valide jusqu'au</p>
                  <p className="font-medium">{formatDate(quote.validUntil)}</p>
                </div>
              )}
            </div>

            {/* Lignes */}
            <div>
              <button
                onClick={() => setShowItems(v => !v)}
                className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left"
              >
                <Package className="h-4 w-4" />
                Lignes du devis ({quote.items?.length ?? 0})
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
                      {(quote.items ?? []).map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatAmount(item.unitPrice)} DT</td>
                          <td className="px-4 py-2 text-center">{item.taxRate}%</td>
                          <td className="px-4 py-2 text-right">{formatAmount(item.total)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totaux */}
            <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span><span>{formatAmount(quote.subtotal)} DT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA</span><span>{formatAmount(quote.taxAmount)} DT</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Timbre fiscal</span><span>{formatAmount(quote.timbreFiscal)} DT</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Net TTC</span><span>{formatAmount(quote.netAmount)} DT</span>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{quote.notes}</p>
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
                    printQuote(quote, info.businessName, info.businessMF, info.businessAddress);
                  }}
                  variant="danger"
                />

                {canSend && (
                  <ActionButton
                    icon={Mail}
                    label="Envoyer au client"
                    description={quote.client?.email || 'Email client'}
                    onClick={() => send.mutate(quote.id)}
                    variant="success"
                    loading={send.isPending}
                  />
                )}
              </ActionSection>

              {/* Section: Gestion du devis */}
              {(canEdit || canAccept || canReject) && (
                <ActionSection title="Gestion du devis">
                  {canEdit && (
                    <ActionButton
                      icon={Edit}
                      label="Modifier"
                      description="Éditer les détails"
                      onClick={() => setEditOpen(true)}
                      variant="secondary"
                    />
                  )}

                  {canAccept && (
                    <ActionButton
                      icon={Check}
                      label="Accepter → Commande"
                      description="Accepter et créer commande"
                      onClick={handleAccept}
                      variant="success"
                      loading={accept.isPending || convertToOrder.isPending}
                    />
                  )}

                  {canReject && (
                    <ActionButton
                      icon={XCircle}
                      label="Rejeter"
                      description="Refuser le devis"
                      onClick={() => reject.mutate(quote.id)}
                      variant="danger"
                      loading={reject.isPending}
                    />
                  )}
                </ActionSection>
              )}

              {/* Section: Conversion */}
              {canConvert && (
                <ActionSection title="Conversion">
                  <ActionButton
                    icon={FileText}
                    label="Convertir en facture"
                    description="Créer une facture"
                    onClick={handleConvertToInvoice}
                    variant="indigo"
                    loading={convertToInvoice.isPending}
                  />

                  <ActionButton
                    icon={ShoppingCart}
                    label="Convertir en commande"
                    description="Créer une commande"
                    onClick={handleConvertToOrder}
                    variant="purple"
                    loading={convertToOrder.isPending}
                  />
                </ActionSection>
              )}

              {/* Section: Actions critiques */}
              {canDelete && (
                <ActionSection title="Actions critiques" variant="danger">
                  <ActionButton
                    icon={Trash2}
                    label="Supprimer"
                    description="Supprimer définitivement"
                    onClick={() => setDeleteConfirm(true)}
                    variant="danger"
                  />
                </ActionSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <QuoteModal
          businessId={businessId}
          quote={quote}
          onClose={() => {
            setEditOpen(false);
            onClose();
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer le devis"
          message={`Êtes-vous sûr de vouloir supprimer le devis ${quote.quoteNumber} ?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}