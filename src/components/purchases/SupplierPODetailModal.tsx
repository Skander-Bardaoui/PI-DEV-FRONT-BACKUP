import { useState, useRef } from 'react';
import {
  X, Package, FileText, Plus, ChevronDown, ChevronUp,
  AlertCircle, Send, Check, Loader2, Edit, XCircle,
} from 'lucide-react';
import { useGoodsReceiptsByPO }  from '@/hooks/useGoodsReceipts';
import {
  useSupplierPO,
  useSendSupplierPO,
  useConfirmSupplierPO,
  useCancelSupplierPO,
} from '@/hooks/useSupplierPOs';
import { usePurchaseInvoicesByPO } from '@/hooks/usePurchaseInvoices';
import { usePDFExport }              from '@/hooks/usePDFExport';
import { useToast }                  from '@/components/ui/Toast';
import EditSupplierPOModal           from '@/components/purchases/EditSupplierPOModal';
import GoodsReceiptModal             from '@/components/purchases/GoodsReceiptModal';
import CreateInvoiceFromPOModal      from '@/components/purchases/CreateInvoiceFromPOModal';
import InvoiceDetailModal            from '@/components/purchases/Invoicedetailmodal ';
import { ActionButton, ActionSection } from '@/components/ui/ActionButton';
import {
  formatAmount, formatDate,
  PO_STATUS_COLORS, PO_STATUS_LABELS,
  POStatus, SupplierPO, INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS,
  PurchaseInvoice, round3,
} from '@/types';

interface Props {
  po:         SupplierPO;
  businessId: string;
  onClose:    () => void;
}

export default function SupplierPODetailModal({ po: initialPO, businessId, onClose }: Props) {
  const [editOpen,    setEditOpen]    = useState(false);
  const [grOpen,      setGrOpen]      = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [showItems,   setShowItems]   = useState(true);
  const [showReceipts,setShowReceipts]= useState(true);
  const [showInvoices,setShowInvoices]= useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  // Garde une ref snapshot du PO au moment où l'edit s'ouvre
  const editPORef = useRef<SupplierPO | null>(null);

  const toast = useToast();

  // FIX : recharger le BC complet avec ses items depuis l'API
  // initialPO peut ne pas avoir les items si chargé depuis la liste
  const { data: fullPO, isLoading: poLoading } = useSupplierPO(businessId, initialPO.id);
  const po = fullPO ?? initialPO;

  const { data: receipts } = useGoodsReceiptsByPO(businessId, po.id);
  const { data: existingInvoices } = usePurchaseInvoicesByPO(businessId, po.id);

  const send    = useSendSupplierPO(businessId);
  const confirm = useConfirmSupplierPO(businessId);
  const cancel  = useCancelSupplierPO(businessId);
  const { exportBC, loading: pdfLoading } = usePDFExport();

  const canEdit    = po.status === POStatus.DRAFT;
  const canSend    = po.status === POStatus.DRAFT;
  const canConfirm = po.status === POStatus.SENT;
  const canCancel  = [POStatus.DRAFT, POStatus.SENT].includes(po.status);
  const canReceive = [POStatus.CONFIRMED, POStatus.PARTIALLY_RECEIVED].includes(po.status);
  
  // LOGIQUE FINALE CORRECTE
  const hasReceipts = receipts && receipts.length > 0;
  const hasInvoices = existingInvoices && existingInvoices.length > 0;
  const isFullyReceived = po.status === POStatus.FULLY_RECEIVED;
  const isConfirmedNoReceipt = po.status === POStatus.CONFIRMED;
  
  // 1. Montant total du BC
  const totalBC = Number(po.net_amount);
  
  // 2. Montant total réceptionné (HT + TVA SANS timbre)
  // Le timbre fiscal n'est PAS proportionnel - il est de 1.000 TND par FACTURE, pas par réception
  const totalReceivedHT = po.items?.reduce((sum, item) => {
    const qtyReceived = Number(item.quantity_received) || 0;
    const unitPrice = Number(item.unit_price_ht) || 0;
    return sum + (qtyReceived * unitPrice);
  }, 0) || 0;
  
  const totalReceivedTax = po.items?.reduce((sum, item) => {
    const qtyReceived = Number(item.quantity_received) || 0;
    const unitPrice = Number(item.unit_price_ht) || 0;
    const taxRate = Number(item.tax_rate_value) || 0;
    const lineHT = qtyReceived * unitPrice;
    return sum + (lineHT * taxRate / 100);
  }, 0) || 0;
  
  // Total réceptionné SANS timbre (le timbre est ajouté à chaque facture, pas à chaque réception)
  // const totalReceived = round3(totalReceivedHT + totalReceivedTax); // Unused but kept for reference
  
  // 3. Montant total facturé
  const totalInvoiced = existingInvoices?.reduce((sum, inv) => sum + Number(inv.net_amount), 0) || 0;
  
  // 4. Calculer le montant total qui DEVRAIT être facturé pour toutes les réceptions
  // Chaque réception génère : HT + TVA + 1 Timbre
  let totalShouldBeInvoiced = 0;
  receipts?.forEach(gr => {
    let grHT = 0;
    let grTVA = 0;
    gr.items?.forEach(grItem => {
      const poItem = po.items?.find(pi => pi.id === grItem.supplier_po_item_id);
      if (poItem) {
        const lineHT = Number(grItem.quantity_received) * Number(poItem.unit_price_ht);
        const lineTVA = lineHT * (Number(poItem.tax_rate_value) / 100);
        grHT += lineHT;
        grTVA += lineTVA;
      }
    });
    totalShouldBeInvoiced += round3(grHT + grTVA + 1.000); // +1 timbre par réception
  });
  
  // 5. Montant réceptionné mais pas encore facturé
  const receivedNotInvoiced = round3(totalShouldBeInvoiced - totalInvoiced);
  
  // 6. Montant restant à facturer (par rapport au BC total)
  const remainingToInvoice = round3(totalBC - totalInvoiced);
  
  // RÈGLE : On peut créer une facture si :
  // - Il y a des réceptions ET
  // - Le montant qui devrait être facturé > montant déjà facturé
  const canCreateInvoice = hasReceipts && receivedNotInvoiced > 0.001;
  
  const shouldShowInvoiceButton = canCreateInvoice;
  const shouldBlockInvoice = !hasReceipts && isConfirmedNoReceipt;
  const isFullyInvoiced = totalInvoiced >= totalBC - 0.001;
  const needsMoreReceipts = hasInvoices && !canCreateInvoice && !isFullyReceived;

  // FIX : fermer le modal après confirmation
  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(po.id);
      toast.success('BC confirmé', `${po.po_number} est maintenant confirmé`);
      onClose(); // ← FERMER LE MODAL
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.message ?? 'Impossible de confirmer ce BC');
    }
  };

  const handleSend = async () => {
    try {
      await send.mutateAsync(po.id);
      toast.success('BC envoyé', `${po.po_number} envoyé au fournisseur`);
      onClose(); // ← FERMER AUSSI après envoi
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.message ?? 'Impossible d\'envoyer ce BC');
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(po.id);
      toast.warning('BC annulé', `${po.po_number} a été annulé`);
      onClose();
    } catch (err: any) {
      toast.error('Erreur', err?.response?.data?.message ?? 'Impossible d\'annuler ce BC');
    }
  };

  const handleOpenEdit = () => {
    editPORef.current = po; // snapshot figé au moment du clic
    setEditOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{po.po_number}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${PO_STATUS_COLORS[po.status]}`}>
                  {PO_STATUS_LABELS[po.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{po.supplier?.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {poLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="p-6 space-y-6">

              {/* Infos générales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Fournisseur</p>
                  <p className="font-medium text-gray-900">{po.supplier?.name ?? '—'}</p>
                  {po.supplier?.matricule_fiscal && (
                    <p className="text-xs text-gray-400 font-mono">{po.supplier.matricule_fiscal}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Créé le</p>
                  <p className="font-medium">{formatDate(po.created_at)}</p>
                </div>
                {po.expected_delivery && (
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Livraison prévue</p>
                    <p className="font-medium">{formatDate(po.expected_delivery)}</p>
                  </div>
                )}
                {po.supplier?.email && (
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Email fournisseur</p>
                    <p className="text-sm">{po.supplier.email}</p>
                  </div>
                )}
                {po.supplier?.phone && (
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Téléphone</p>
                    <p className="text-sm">{po.supplier.phone}</p>
                  </div>
                )}
                {po.supplier?.payment_terms !== undefined && (
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Délai paiement</p>
                    <p className="font-medium">{po.supplier.payment_terms} jours</p>
                  </div>
                )}
              </div>

              {/* Lignes BC */}
              <div>
                <button
                  onClick={() => setShowItems(v => !v)}
                  className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left hover:text-indigo-600 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Lignes du bon de commande ({po.items?.length ?? 0})
                  {showItems ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>

                {showItems && (
                  <>
                    {!po.items?.length ? (
                      <p className="text-sm text-gray-400 italic py-4 text-center">Aucune ligne</p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Description</th>
                              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Commandé</th>
                              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Reçu</th>
                              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Reliquat</th>
                              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">PU HT</th>
                              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">TVA</th>
                              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Total HT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {po.items.map(item => {
                              const reliquat = Number(item.quantity_ordered) - Number(item.quantity_received);
                              const isComplete = reliquat <= 0;
                              return (
                                <tr key={item.id} className={isComplete ? 'bg-green-50/30' : ''}>
                                  <td className="px-4 py-3 text-gray-900 font-medium">{item.description}</td>
                                  <td className="px-4 py-3 text-center">{Number(item.quantity_ordered).toFixed(3)}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={Number(item.quantity_received) > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                      {Number(item.quantity_received).toFixed(3)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isComplete ? (
                                      <span className="text-green-600 font-medium">✓</span>
                                    ) : (
                                      <span className="text-orange-600 font-medium">{reliquat.toFixed(3)}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">{formatAmount(item.unit_price_ht)}</td>
                                  <td className="px-4 py-3 text-center">{item.tax_rate_value}%</td>
                                  <td className="px-4 py-3 text-right font-medium">{formatAmount(item.line_total_ht)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Totaux */}
              <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total HT</span><span>{formatAmount(po.subtotal_ht)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TVA</span><span>{formatAmount(po.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Timbre fiscal</span><span>{formatAmount(po.timbre_fiscal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Net TTC</span><span className="text-indigo-700">{formatAmount(po.net_amount)}</span>
                </div>
              </div>

              {/* Bons de réception */}
              <div>
                <button
                  onClick={() => setShowReceipts(v => !v)}
                  className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left hover:text-indigo-600 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Bons de réception ({receipts?.length ?? 0})
                  {showReceipts ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>

                {showReceipts && (
                  <>
                    {!receipts?.length ? (
                      <p className="text-sm text-gray-400 italic py-2 text-center">Aucune réception enregistrée</p>
                    ) : (
                      <div className="space-y-2">
                        {receipts.map(gr => (
                          <div key={gr.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
                            <div>
                              <p className="font-mono font-medium text-green-800">{gr.gr_number}</p>
                              <p className="text-green-600 text-xs">{formatDate(gr.receipt_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-700 text-xs">{gr.items?.length ?? 0} ligne(s)</p>
                              <p className="text-green-600 text-xs">
                                {gr.items?.reduce((s: number, i: any) => s + Number(i.quantity_received), 0).toFixed(3)} unités
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Factures existantes */}
              {hasInvoices && (
                <div>
                  <button
                    onClick={() => setShowInvoices(v => !v)}
                    className="flex items-center gap-2 font-semibold text-gray-900 mb-3 w-full text-left hover:text-indigo-600 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Factures créées ({existingInvoices?.length ?? 0})
                    {showInvoices ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>

                  {showInvoices && (
                    <div className="space-y-2">
                      {existingInvoices?.map(inv => (
                        <div 
                          key={inv.id} 
                          onClick={() => setSelectedInvoice(inv)}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <div>
                            <p className="font-mono font-medium text-blue-800">{inv.invoice_number_supplier}</p>
                            <p className="text-blue-600 text-xs">{formatDate(inv.invoice_date)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${INVOICE_STATUS_COLORS[inv.status]}`}>
                              {INVOICE_STATUS_LABELS[inv.status]}
                            </span>
                            <p className="text-blue-700 text-xs mt-1">{formatAmount(inv.net_amount)}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Résumé facturation CORRECT */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                        <div className="flex justify-between text-indigo-700 mb-1">
                          <span>Total BC :</span>
                          <span className="font-medium">{formatAmount(totalBC)}</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 mb-1">
                          <span>Réceptions ({receipts?.length || 0}) :</span>
                          <span className="font-medium">{formatAmount(totalShouldBeInvoiced)}</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 mb-1">
                          <span>Total facturé :</span>
                          <span className="font-medium">{formatAmount(totalInvoiced)}</span>
                        </div>
                        <div className="flex justify-between text-indigo-900 font-bold border-t border-indigo-300 pt-1 mt-1">
                          <span>Réceptionné non facturé :</span>
                          <span className={receivedNotInvoiced > 0.001 ? 'text-orange-600' : 'text-green-600'}>
                            {formatAmount(receivedNotInvoiced)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-xs mt-1 pt-1 border-t border-indigo-200">
                          <span>Reste à facturer (BC) :</span>
                          <span>{formatAmount(remainingToInvoice)}</span>
                        </div>
                        <p className="text-xs text-indigo-600 mt-2 italic">
                          Note : Chaque réception génère une facture avec 1 timbre fiscal (1.000 TND)
                        </p>
                      </div>

                      {needsMoreReceipts && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          Toutes les réceptions ont été facturées. Créez un nouveau bon de réception pour pouvoir facturer le reste.
                        </div>
                      )}
                      
                      {canCreateInvoice && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                          <Check className="h-4 w-4 inline mr-1" />
                          Vous pouvez créer une facture pour les réceptions non facturées ({formatAmount(receivedNotInvoiced)}).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {po.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                  <p className="text-sm text-amber-800">{po.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer — boutons d'action */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-4">
              
              {/* Section: Documents */}
              <ActionSection title="Documents">
                <ActionButton
                  icon={FileText}
                  label="Télécharger PDF"
                  description="Générer le bon de commande"
                  onClick={() => exportBC(po)}
                  variant="danger"
                  loading={pdfLoading}
                />
              </ActionSection>

              {/* Section: Workflow */}
              {(canEdit || canSend || canConfirm || canReceive || shouldShowInvoiceButton) && (
                <ActionSection title="Gestion du bon de commande">
                  {canEdit && (
                    <ActionButton
                      icon={Edit}
                      label="Modifier"
                      description="Éditer les détails"
                      onClick={handleOpenEdit}
                      variant="secondary"
                    />
                  )}
                  
                  {canSend && (
                    <ActionButton
                      icon={Send}
                      label="Envoyer au fournisseur"
                      description="Transmettre par email"
                      onClick={handleSend}
                      variant="primary"
                      loading={send.isPending}
                    />
                  )}
                  
                  {canConfirm && (
                    <ActionButton
                      icon={Check}
                      label="Confirmer"
                      description="Valider la commande"
                      onClick={handleConfirm}
                      variant="success"
                      loading={confirm.isPending}
                    />
                  )}
                  
                  {canReceive && (
                    <ActionButton
                      icon={Plus}
                      label="Bon de réception"
                      description="Enregistrer une réception"
                      onClick={() => setGrOpen(true)}
                      variant="indigo"
                    />
                  )}
                  
                  {shouldShowInvoiceButton && (
                    <ActionButton
                      icon={FileText}
                      label={hasInvoices ? 'Facture supplémentaire' : 'Créer facture'}
                      description={`Montant: ${formatAmount(receivedNotInvoiced)}`}
                      onClick={() => setInvoiceOpen(true)}
                      variant="orange"
                    />
                  )}
                </ActionSection>
              )}

              {/* Messages d'état */}
              {isFullyInvoiced && !shouldShowInvoiceButton && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  BC entièrement facturé
                </div>
              )}
              
              {needsMoreReceipts && !shouldShowInvoiceButton && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Réception supplémentaire requise pour facturer le reste
                </div>
              )}
              
              {shouldBlockInvoice && !shouldShowInvoiceButton && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Créez d'abord un bon de réception avant de facturer
                </div>
              )}

              {/* Section: Actions critiques */}
              {canCancel && (
                <ActionSection title="Actions critiques" variant="danger">
                  <ActionButton
                    icon={XCircle}
                    label="Annuler le BC"
                    description="Annuler la commande"
                    onClick={handleCancel}
                    variant="danger"
                    loading={cancel.isPending}
                  />
                </ActionSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && editPORef.current && (
        <EditSupplierPOModal 
          po={editPORef.current}  // ← PO figé, ne change plus
          businessId={businessId} 
          onClose={() => setEditOpen(false)} 
        />
      )}
      {grOpen      && <GoodsReceiptModal  po={po} businessId={businessId} onClose={() => setGrOpen(false)} />}
      {invoiceOpen && <CreateInvoiceFromPOModal po={po} businessId={businessId} onClose={() => setInvoiceOpen(false)} />}
      {selectedInvoice && (
        <InvoiceDetailModal 
          invoice={selectedInvoice} 
          businessId={businessId} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}
    </>
  );
}