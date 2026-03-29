// src/components/purchases/PurchaseInvoiceModal.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText, Calculator, Sparkles, ChevronRight, Package, PackageCheck, AlertCircle } from 'lucide-react';
import { purchaseInvoiceSchema, PurchaseInvoiceFormValues } from '@/schemas/purchases.schemas';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierPOs } from '@/hooks/useSupplierPOs';
import { useGoodsReceiptsByPO } from '@/hooks/useGoodsReceipts';
import { useCreatePurchaseInvoice } from '@/hooks/usePurchaseInvoices';
import { formatAmount, formatDate, round3, TIMBRE_FISCAL, POStatus } from '@/types';
import UploadInvoiceScan from '@/components/purchases/UploadInvoiceScan';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = (error?: string) => `
  w-full px-3.5 py-2.5 border-2 rounded-xl text-sm transition-all duration-150 outline-none
  focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50
  ${error ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}
`;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
      <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
      {msg}
    </p>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1 rounded-md bg-indigo-50">{icon}</div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

interface Props { businessId: string; onClose: () => void; }

export function PurchaseInvoiceModal({ businessId, onClose }: Props) {
  const [step, setStep] = useState<'choice' | 'select-po' | 'select-gr' | 'form'>('choice');
  const [selectedPOId, setSelectedPOId] = useState<string>('');
  const [selectedGRId, setSelectedGRId] = useState<string>('');
  const [creationMode, setCreationMode] = useState<'from-gr' | 'manual'>('manual');

  const { data: suppliersData } = useSuppliers(businessId, { is_active: true, limit: 100 });
  const { data: posData } = useSupplierPOs(businessId, { limit: 100 });
  
  // Charger les BRs seulement si un PO est sélectionné
  const { data: grsData, isLoading: grsLoading } = useGoodsReceiptsByPO(
    businessId, 
    selectedPOId,
  );
  
  const create = useCreatePurchaseInvoice(businessId);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(purchaseInvoiceSchema),
    defaultValues: {
      invoice_number_supplier: '',
      supplier_id:   '',
      supplier_po_id: '',
      invoice_date:  new Date().toISOString().split('T')[0],
      due_date:      '',
      subtotal_ht:   0,
      tax_amount:    0,
      timbre_fiscal: TIMBRE_FISCAL,
      receipt_url:   '',
    },
  });

  const [ht, tax, timbre] = [
    watch('subtotal_ht')   || 0,
    watch('tax_amount')    || 0,
    watch('timbre_fiscal') || 0,
  ];
  const netDisplay = round3(Number(ht) + Number(tax) + Number(timbre));

  // Taux de TVA communs (raccourcis)
  const TVA_RATES = [0, 7, 13, 19];
  const applyTva = (rate: number) => {
    const tva = round3(Number(ht) * rate / 100);
    setValue('tax_amount', tva);
  };

  // Pré-remplir depuis un BR
  const handleSelectGR = (grId: string) => {
    setSelectedGRId(grId);
    const gr = grsData?.find(g => g.id === grId);
    const po = posData?.data?.find(p => p.id === selectedPOId);
    
    if (gr && po) {
      setValue('supplier_id', po.supplier_id);
      setValue('supplier_po_id', po.id);
      
      // Calculer le montant depuis les items du BR
      const totalHT = gr.items?.reduce((sum, item) => {
        const poItem = po.items?.find(pi => pi.id === item.supplier_po_item_id);
        if (poItem) {
          return sum + (item.quantity_received * Number(poItem.unit_price_ht));
        }
        return sum;
      }, 0) || 0;
      
      setValue('subtotal_ht', round3(totalHT));
      applyTva(19); // TVA par défaut 19%
    }
    
    // Passer au formulaire
    setStep('form');
  };

  const handleChooseFromGR = () => {
    setCreationMode('from-gr');
    setStep('select-po');
  };

  const handleChooseManual = () => {
    setCreationMode('manual');
    setStep('form');
  };

  const handleSelectPO = (poId: string) => {
    setSelectedPOId(poId);
    setStep('select-gr');
  };

  const handleBackToChoice = () => {
    setStep('choice');
    setSelectedPOId('');
    setSelectedGRId('');
    setCreationMode('manual');
  };

  const handleBackToPOSelection = () => {
    setStep('select-po');
    setSelectedPOId('');
    setSelectedGRId('');
  };

  const onSubmit = async (values: PurchaseInvoiceFormValues) => {
    await create.mutateAsync({
      invoice_number_supplier: values.invoice_number_supplier,
      supplier_id:    values.supplier_id,
      supplier_po_id: values.supplier_po_id || undefined,
      invoice_date:   values.invoice_date,
      due_date:       values.due_date || undefined,
      subtotal_ht:    Number(values.subtotal_ht)   || 0,
      tax_amount:     Number(values.tax_amount)    || 0,
      timbre_fiscal:  Number(values.timbre_fiscal) || TIMBRE_FISCAL,
      receipt_url:    values.receipt_url || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100">
          <div className="px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle facture fournisseur</h2>
              <p className="text-xs text-gray-500">
                {step === 'choice' && 'Choisissez le mode de création'}
                {step === 'select-po' && 'Sélectionnez un bon de commande'}
                {step === 'select-gr' && 'Sélectionnez un bon de réception'}
                {step === 'form' && creationMode === 'from-gr' && 'Depuis un bon de réception'}
                {step === 'form' && creationMode === 'manual' && 'Saisie manuelle'}
              </p>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Étape 1 : Choix du mode */}
        {step === 'choice' && (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Comment souhaitez-vous créer cette facture ?</p>
                <p className="text-blue-700">
                  Pour un meilleur suivi et un rapprochement automatique, créez la facture depuis un bon de réception.
                </p>
              </div>
            </div>

            {/* Option 1 : Depuis BR (recommandé) */}
            <button
              onClick={handleChooseFromGR}
              disabled={!posData?.data || posData.data.length === 0}
              className="w-full p-5 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <PackageCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">Depuis un bon de réception</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Créez la facture à partir d'une réception de marchandises déjà enregistrée
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      ✓ Montants pré-remplis
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ✓ Rapprochement automatique
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ✓ Traçabilité complète
                    </span>
                  </div>
                  {posData?.data && posData.data.length > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-2">
                      {posData.data.length} bon(s) de commande disponible(s)
                    </p>
                  )}
                  {(!posData?.data || posData.data.length === 0) && (
                    <p className="text-xs text-orange-600 font-medium mt-2">
                      Aucun bon de commande disponible
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </button>

            {/* Option 2 : Saisie manuelle */}
            <button
              onClick={handleChooseManual}
              className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <FileText className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Saisie manuelle</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Pour les achats ponctuels sans bon de commande (frais, services, etc.)
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Saisie libre</span>
                    <span>•</span>
                    <span>Pas de rapprochement automatique</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </button>
          </div>
        )}

        {/* Étape 2 : Sélection du BC */}
        {step === 'select-po' && (
          <div className="p-6 space-y-4">
            <button
              onClick={handleBackToChoice}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              ← Retour au choix
            </button>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sélectionnez un bon de commande
              </label>
              <div className="space-y-2">
                {posData?.data && posData.data.length > 0 ? (
                  posData.data.map(po => (
                    <button
                      key={po.id}
                      onClick={() => handleSelectPO(po.id)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{po.po_number}</p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              po.status === POStatus.RECEIVED ? 'bg-green-100 text-green-700' :
                              po.status === POStatus.PARTIALLY_RECEIVED ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {po.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{po.supplier?.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Montant: {formatAmount(po.net_amount || 0)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Aucun bon de commande disponible</p>
                    <p className="text-sm text-gray-500 mt-1">Créez d'abord un bon de commande</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 : Sélection du BR */}
        {step === 'select-gr' && (
          <div className="p-6 space-y-4">
            <button
              onClick={handleBackToPOSelection}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              ← Changer de bon de commande
            </button>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sélectionnez un bon de réception
              </label>
              
              {grsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : grsData && grsData.length > 0 ? (
                <div className="space-y-2">
                  {grsData.map(gr => (
                    <button
                      key={gr.id}
                      onClick={() => handleSelectGR(gr.id)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{gr.receipt_number}</p>
                          <p className="text-sm text-gray-600">{formatDate(gr.receipt_date)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {gr.items?.length || 0} article(s) réceptionné(s)
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900 mb-2">Aucun bon de réception disponible</p>
                      <p className="text-sm text-orange-800 mb-3">
                        Ce bon de commande n'a pas encore de réception enregistrée. 
                        Vous devez d'abord créer un bon de réception avant de pouvoir facturer.
                      </p>
                      <button
                        onClick={handleBackToPOSelection}
                        className="text-sm text-orange-700 hover:text-orange-800 font-medium underline"
                      >
                        Choisir un autre bon de commande
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 4 : Formulaire */}
        {step === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6" noValidate>
            {creationMode === 'from-gr' && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToPOSelection}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  ← Changer de bon de réception
                </button>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <PackageCheck className="w-3 h-3" />
                  Depuis BR
                </span>
              </div>
            )}

            {creationMode === 'manual' && (
              <button
                type="button"
                onClick={handleBackToChoice}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                ← Retour au choix
              </button>
            )}

            {/* ── Section 1 : Identification ── */}
            <div>
              <SectionLabel
                icon={<FileText className="h-3.5 w-3.5 text-indigo-500" />}
                label="Identification"
              />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    N° facture fournisseur <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('invoice_number_supplier')}
                    className={inputCls(errors.invoice_number_supplier?.message)}
                    placeholder="Ex: FACT-2024-0042"
                  />
                  <FieldError msg={errors.invoice_number_supplier?.message} />
                </div>

                {creationMode === 'manual' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Fournisseur <span className="text-red-500">*</span>
                    </label>
                    <select {...register('supplier_id')} className={inputCls(errors.supplier_id?.message)}>
                      <option value="">— Sélectionner un fournisseur —</option>
                      {suppliersData?.data?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.supplier_id?.message} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Date facture <span className="text-red-500">*</span>
                    </label>
                    <input type="date" {...register('invoice_date')} className={inputCls(errors.invoice_date?.message)} />
                    <FieldError msg={errors.invoice_date?.message} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Échéance
                      <span className="ml-1 text-xs text-gray-400 font-normal">(auto +30j)</span>
                    </label>
                    <input type="date" {...register('due_date')} className={inputCls(errors.due_date?.message)} />
                    <FieldError msg={errors.due_date?.message} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2 : Montants ── */}
            <div>
              <SectionLabel
                icon={<Calculator className="h-3.5 w-3.5 text-indigo-500" />}
                label="Montants (TND)"
              />

              <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl p-4 border border-gray-100 space-y-4">

                {/* HT */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Sous-total HT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" step="0.001" min="0"
                    {...register('subtotal_ht', { valueAsNumber: true })}
                    className={inputCls(errors.subtotal_ht?.message) + ' text-right font-mono'}
                  />
                  <FieldError msg={errors.subtotal_ht?.message} />
                </div>

                {/* TVA + raccourcis */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      TVA <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      {TVA_RATES.map(r => (
                        <button key={r} type="button" onClick={() => applyTva(r)}
                          className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number" step="0.001" min="0"
                    {...register('tax_amount', { valueAsNumber: true })}
                    className={inputCls(errors.tax_amount?.message) + ' text-right font-mono'}
                  />
                  <FieldError msg={errors.tax_amount?.message} />
                </div>

                {/* Timbre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Timbre fiscal
                    <span className="ml-1 text-xs text-gray-400 font-normal">(1.000 TND par défaut)</span>
                  </label>
                  <input
                    type="number" step="0.001" min="0"
                    {...register('timbre_fiscal', { valueAsNumber: true })}
                    className={inputCls(errors.timbre_fiscal?.message) + ' text-right font-mono'}
                  />
                  <FieldError msg={errors.timbre_fiscal?.message} />
                </div>

                {/* Séparateur + Net TTC */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">Net TTC</span>
                      <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded font-medium">Auto-calculé</span>
                    </div>
                    <span className="text-xl font-black text-indigo-700 font-mono tabular-nums">
                      {formatAmount(netDisplay)}
                    </span>
                  </div>
                  {/* Barre de décomposition visuelle */}
                  {netDisplay > 0 && (
                    <div className="mt-2 flex rounded-full overflow-hidden h-1.5 gap-0.5">
                      <div className="bg-indigo-400 transition-all" style={{ width: `${(Number(ht) / netDisplay) * 100}%` }} title="HT" />
                      <div className="bg-purple-400 transition-all" style={{ width: `${(Number(tax) / netDisplay) * 100}%` }} title="TVA" />
                      <div className="bg-blue-300 transition-all" style={{ width: `${(Number(timbre) / netDisplay) * 100}%` }} title="Timbre" />
                    </div>
                  )}
                  {netDisplay > 0 && (
                    <div className="flex gap-3 mt-1.5">
                      {[
                        { label: 'HT', val: ht, color: 'bg-indigo-400' },
                        { label: 'TVA', val: tax, color: 'bg-purple-400' },
                        { label: 'Timbre', val: timbre, color: 'bg-blue-300' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-xs text-gray-500">{item.label} : {formatAmount(item.val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 3 : Scan ── */}
            <div>
              <SectionLabel
                icon={<Sparkles className="h-3.5 w-3.5 text-indigo-500" />}
                label="Pièce justificative"
              />
              <UploadInvoiceScan
                businessId={businessId}
                value={watch('receipt_url')}
                onChange={(url) => setValue('receipt_url', url)}
              />
              <FieldError msg={errors.receipt_url?.message} />
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting || create.isPending}
                className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                {isSubmitting || create.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Créer la facture
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}

export default PurchaseInvoiceModal;
