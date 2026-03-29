// src/components/sales/QuoteDetailModal.tsx
import { X, Package, ChevronDown, ChevronUp, Edit, Trash2, Send, Check, XCircle, FileText, ShoppingCart } from 'lucide-react';
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
import PDFButton from '../purchases/PDFButton';
import { printQuote } from '@/utils/sales-quote-print';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

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
          <div className="p-6 border-t border-gray-200 space-y-3">
            <div className="flex flex-wrap gap-2">
              <PDFButton
                onClick={() => printQuote(quote, (user as any)?.business?.name || 'Entreprise', (user as any)?.business?.matricule_fiscal, (user as any)?.business?.address)}
                label="Télécharger PDF"
                variant="ghost"
              />
              {canEdit && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
              )}
              {canSend && (
                <button
                  onClick={() => send.mutate(quote.id)}
                  disabled={send.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="h-4 w-4" />
                  Envoyer au client
                </button>
              )}
              {canAccept && (
                <button
                  onClick={handleAccept}
                  disabled={accept.isPending || convertToOrder.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  {(accept.isPending || convertToOrder.isPending) ? 'Acceptation...' : 'Accepter → Commande'}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => reject.mutate(quote.id)}
                  disabled={reject.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </button>
              )}
              {canConvert && (
                <>
                  <button
                    onClick={handleConvertToInvoice}
                    disabled={convertToInvoice.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    {convertToInvoice.isPending ? 'Conversion...' : 'Convertir en facture'}
                  </button>
                  <button
                    onClick={handleConvertToOrder}
                    disabled={convertToOrder.isPending}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {convertToOrder.isPending ? 'Conversion...' : 'Convertir en commande'}
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
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