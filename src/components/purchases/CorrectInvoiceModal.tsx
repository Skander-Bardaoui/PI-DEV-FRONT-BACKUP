// src/components/purchases/CorrectInvoiceModal.tsx
import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useUpdatePurchaseInvoice, useResolveDispute, useUpdatePayment } from '@/hooks/usePurchaseInvoices';
import { formatAmount, PurchaseInvoice, round3 } from '@/types';
import UploadInvoiceScan from '@/components/purchases/UploadInvoiceScan';

const DISPUTE_TYPES: Record<string, {
  label:       string;
  icon:        string;
  description: string;
  correction:  string;
  fields:      ('amounts' | 'dates' | 'duplicate' | 'none')[];
}> = {
  'Montant incorrect': {
    label:       'Montant incorrect',
    icon:        '💰',
    description: 'Le montant facturé ne correspond pas au bon de commande ou au contrat.',
    correction:  'Corriger les montants HT, TVA ou timbre fiscal.',
    fields:      ['amounts', 'dates'],
  },
  'Produit non conforme à la commande': {
    label:       'Produit non conforme',
    icon:        '📦',
    description: 'Les produits ou services livrés ne correspondent pas à la commande.',
    correction:  'Ajuster le montant si livraison partielle, ou résoudre après retour.',
    fields:      ['amounts'],
  },
  'Facture déjà réglée': {
    label:       'Facture déjà réglée',
    icon:        '✓',
    description: 'Cette facture a déjà été payée — paiement non enregistré dans le système.',
    correction:  'Enregistrer le paiement déjà effectué pour solder la facture.',
    fields:      ['none'],
  },
  'Double facturation': {
    label:       'Double facturation',
    icon:        '🔁',
    description: 'Le fournisseur a envoyé deux factures pour la même prestation.',
    correction:  'Résoudre le litige sans payer — contacter le fournisseur pour annulation.',
    fields:      ['duplicate'],
  },
  'Prestation non réalisée': {
    label:       'Prestation non réalisée',
    icon:        '🚫',
    description: 'Le service ou la livraison n\'a pas été effectué.',
    correction:  'Résoudre après accord avec le fournisseur (avoir ou annulation).',
    fields:      ['none'],
  },
  'Autre': {
    label:       'Autre motif',
    icon:        '📝',
    description: 'Motif spécifique précisé lors de la mise en litige.',
    correction:  'Corriger selon l\'accord trouvé avec le fournisseur.',
    fields:      ['amounts', 'dates'],
  },
};

interface Props {
  businessId: string;
  invoice:    PurchaseInvoice;
  onClose:    () => void;
}

export default function CorrectInvoiceModal({ businessId, invoice, onClose }: Props) {
  const update        = useUpdatePurchaseInvoice(businessId, invoice.id);
  const resolve       = useResolveDispute(businessId);
  const updatePayment = useUpdatePayment(businessId);

  const disputeKey  = Object.keys(DISPUTE_TYPES).find(k =>
    invoice.dispute_reason?.toLowerCase().includes(k.toLowerCase()),
  ) ?? 'Autre';
  const disputeType = DISPUTE_TYPES[disputeKey];

  const [action, setAction] = useState<
    'choose' | 'correct_amounts' | 'mark_paid' | 'resolve_only'
  >('choose');

  const [subtotalHT,  setSubtotalHT]  = useState(Number(invoice.subtotal_ht));
  const [taxAmount,   setTaxAmount]   = useState(Number(invoice.tax_amount));
  const [timbre,      setTimbre]      = useState(Number(invoice.timbre_fiscal));
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoice_date?.split('T')[0] ?? '');
  const [dueDate,     setDueDate]     = useState(invoice.due_date?.split('T')[0] ?? '');
  // FONCTIONNALITÉ 2 : état pour le nouveau scan uploadé lors de la correction
  const [receiptUrl,  setReceiptUrl]  = useState(invoice.receipt_url ?? '');
  const [paidAmount,  setPaidAmount]  = useState(
    round3(Number(invoice.net_amount) - Number(invoice.paid_amount)),
  );
  const [error, setError] = useState('');

  const newNet     = round3(subtotalHT + taxAmount + timbre);
  const oldNet     = Number(invoice.net_amount);
  const diff       = round3(newNet - oldNet);
  const hasChanged = Math.abs(diff) > 0.001 || receiptUrl !== (invoice.receipt_url ?? '');

  const handleCorrectAmounts = async () => {
    // Validation
    const errors: string[] = [];
    
    if (subtotalHT < 0) errors.push('Le sous-total HT ne peut pas être négatif');
    if (taxAmount < 0) errors.push('La TVA ne peut pas être négative');
    if (timbre < 0) errors.push('Le timbre fiscal ne peut pas être négatif');
    if (!invoiceDate) errors.push('La date de facture est obligatoire');
    if (dueDate && invoiceDate && new Date(dueDate) < new Date(invoiceDate)) {
      errors.push('La date d\'échéance doit être postérieure à la date de facture');
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }
    
    if (!hasChanged) { setError('Aucune modification détectée'); return; }
    setError('');
    try {
      await resolve.mutateAsync(invoice.id);
      await update.mutateAsync({
        subtotal_ht:   subtotalHT,
        tax_amount:    taxAmount,
        timbre_fiscal: timbre,
        invoice_date:  invoiceDate  || undefined,
        due_date:      dueDate      || undefined,
        receipt_url:   receiptUrl   || undefined,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Erreur lors de la correction'));
    }
  };

  const handleMarkAsPaid = async () => {
    setError('');
    
    // Validation
    if (paidAmount <= 0) { 
      setError('Le montant payé doit être supérieur à 0'); 
      return; 
    }
    if (paidAmount > round3(Number(invoice.net_amount) - Number(invoice.paid_amount))) {
      setError('Le montant ne peut pas dépasser le solde restant');
      return;
    }
    
    try {
      await resolve.mutateAsync(invoice.id);
      const newTotalPaid = round3(Number(invoice.paid_amount) + paidAmount);
      await updatePayment.mutateAsync({
        id:  invoice.id,
        dto: { paid_amount: newTotalPaid },
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Erreur'));
    }
  };

  const handleResolveOnly = async () => {
    setError('');
    try {
      await resolve.mutateAsync(invoice.id);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Erreur'));
    }
  };

  const isPending = update.isPending || resolve.isPending || updatePayment.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Résoudre le litige</h2>
              <p className="text-sm text-gray-500">{invoice.invoice_number_supplier}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Motif */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{disputeType.icon}</span>
              <p className="text-sm font-semibold text-orange-800">{disputeType.label}</p>
            </div>
            <p className="text-sm text-orange-700 mt-1">{invoice.dispute_reason}</p>
            <p className="text-xs text-orange-600 mt-2 italic">{disputeType.description}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* ÉTAPE 1 : Choisir l'action */}
          {action === 'choose' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Comment voulez-vous résoudre ce litige ?
              </p>

              {disputeType.fields.includes('amounts') && (
                <button
                  onClick={() => setAction('correct_amounts')}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center text-lg">💰</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Corriger les montants</p>
                      <p className="text-xs text-gray-500 mt-0.5">Modifier HT, TVA, timbre ou scan</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              )}

              {disputeType.fields.includes('none') && disputeKey === 'Facture déjà réglée' && (
                <button
                  onClick={() => setAction('mark_paid')}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-green-100 rounded-lg flex items-center justify-center text-lg">✓</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Enregistrer le paiement existant</p>
                      <p className="text-xs text-gray-500 mt-0.5">Marquer comme payée — paiement déjà effectué</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              )}

              <button
                onClick={() => setAction('resolve_only')}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🤝</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Résoudre sans modification</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {disputeKey === 'Double facturation'
                        ? 'Litige réglé — ne pas payer cette facture'
                        : disputeKey === 'Prestation non réalisée'
                        ? 'Accord trouvé avec le fournisseur'
                        : 'Les montants sont corrects, reprendre le paiement normal'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* ÉTAPE 2A : Correction montants + nouveau scan */}
          {action === 'correct_amounts' && (
            <div className="space-y-4">
              <button
                onClick={() => setAction('choose')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Retour
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date facture</label>
                  <input type="date" value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date échéance</label>
                  <input type="date" value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Montants corrigés</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sous-total HT</label>
                    <input type="number" min={0} step={0.001} value={subtotalHT}
                      onChange={e => setSubtotalHT(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">TVA</label>
                    <input type="number" min={0} step={0.001} value={taxAmount}
                      onChange={e => setTaxAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Timbre fiscal</label>
                    <input type="number" min={0} step={0.001} value={timbre}
                      onChange={e => setTimbre(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Montant original</span>
                    <span className="line-through font-mono">{formatAmount(oldNet)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">Nouveau net TTC</span>
                    <span className={`font-mono ${Math.abs(diff) > 0.001 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {formatAmount(newNet)}
                    </span>
                  </div>
                  {Math.abs(diff) > 0.001 && (
                    <div className={`flex justify-between text-xs font-semibold ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <span>Variation</span>
                      <span>{diff > 0 ? '+' : ''}{formatAmount(diff)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* FONCTIONNALITÉ 2 : upload nouveau scan lors de la correction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan corrigé <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
                </label>
                <UploadInvoiceScan
                  businessId={businessId}
                  value={receiptUrl}
                  onChange={setReceiptUrl}
                />
              </div>

              {hasChanged && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">
                    Après correction, le litige sera résolu et la facture passera en <strong>Approuvée</strong>.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('choose')}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={handleCorrectAmounts}
                  disabled={isPending || !hasChanged}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isPending ? 'En cours...' : 'Corriger et résoudre'}
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2B : Facture déjà réglée */}
          {action === 'mark_paid' && (
            <div className="space-y-4">
              <button
                onClick={() => setAction('choose')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Retour
              </button>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-medium text-green-800 mb-1">Paiement déjà effectué</p>
                <p className="text-sm text-green-700">
                  Indiquez le montant qui a été réglé en dehors du système.
                  La facture sera soldée et le litige résolu.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à enregistrer (TND)
                </label>
                <input
                  type="number" min={0.001} step={0.001} value={paidAmount}
                  onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right font-mono text-lg focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button"
                    onClick={() => setPaidAmount(round3(Number(invoice.net_amount) / 2))}
                    className="flex-1 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                    50%
                  </button>
                  <button type="button"
                    onClick={() => setPaidAmount(round3(Number(invoice.net_amount) - Number(invoice.paid_amount)))}
                    className="flex-1 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                    Solde ({formatAmount(round3(Number(invoice.net_amount) - Number(invoice.paid_amount)))})
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('choose')}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isPending || paidAmount <= 0}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isPending ? 'En cours...' : 'Enregistrer et résoudre'}
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2C : Résoudre uniquement */}
          {action === 'resolve_only' && (
            <div className="space-y-4">
              <button
                onClick={() => setAction('choose')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Retour
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Confirmation</p>
                {disputeKey === 'Double facturation' ? (
                  <p className="text-sm text-blue-700">
                    Le litige sera résolu. La facture passera en <strong>Approuvée</strong> mais
                    vous n'êtes pas obligé de la payer.
                  </p>
                ) : disputeKey === 'Prestation non réalisée' ? (
                  <p className="text-sm text-blue-700">
                    Le litige sera résolu suite à l'accord trouvé avec le fournisseur.
                    La facture passera en <strong>Approuvée</strong>.
                  </p>
                ) : (
                  <p className="text-sm text-blue-700">
                    Le litige sera résolu sans modification des montants.
                    La facture passera en <strong>Approuvée</strong>.
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Net TTC (inchangé)</span>
                  <span className="font-bold text-gray-900">{formatAmount(invoice.net_amount)}</span>
                </div>
                {Number(invoice.paid_amount) > 0 && (
                  <div className="flex justify-between text-gray-600 mt-1">
                    <span>Déjà payé</span>
                    <span className="text-green-600 font-medium">{formatAmount(invoice.paid_amount)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction('choose')}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={handleResolveOnly}
                  disabled={isPending}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isPending ? 'En cours...' : 'Confirmer la résolution'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}