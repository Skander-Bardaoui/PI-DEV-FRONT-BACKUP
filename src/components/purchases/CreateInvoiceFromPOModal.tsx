// src/components/purchases/CreateInvoiceFromPOModal.tsx
// Création d'une facture directement depuis un BC — pré-remplit tout
// FIX: Calcul automatique depuis les BRs si disponibles

import { useState, useEffect } from 'react';
import { X, FileText, Zap, PackageCheck } from 'lucide-react';
import { useCreatePurchaseInvoice } from '@/hooks/usePurchaseInvoices';
import { usePurchaseInvoices }      from '@/hooks/usePurchaseInvoices';
import { useGoodsReceiptsByPO }     from '@/hooks/useGoodsReceipts';
import { useToast }                 from '@/components/ui/Toast';
import { formatAmount, round3, SupplierPO, TIMBRE_FISCAL } from '@/types';
import { useApiError } from '../ui/ConfirmModal';
import OcrInvoiceModal from './OcrInvoiceModal';
import UploadInvoiceScan from './UploadInvoiceScan';

interface Props {
  businessId: string;
  po:         SupplierPO;
  onClose:    () => void;
}

export default function CreateInvoiceFromPOModal({ businessId, po, onClose }: Props) {
  const create        = useCreatePurchaseInvoice(businessId);
  const toast         = useToast();
  const { handleError } = useApiError();

  // Charger les BRs pour calculer le montant réellement reçu
  const { data: receipts } = useGoodsReceiptsByPO(businessId, po.id);

  // Vérification doublon
  const { data: existingInvoices } = usePurchaseInvoices(businessId, {
    supplier_id: po.supplier_id,
    limit: 100,
  });

  const [form, setForm] = useState({
    invoice_number_supplier: '',
    invoice_date:  new Date().toISOString().split('T')[0],
    due_date:      '',
    subtotal_ht:   Number(po.subtotal_ht),
    tax_amount:    Number(po.tax_amount),
    timbre_fiscal: Number(po.timbre_fiscal) || TIMBRE_FISCAL,
    receipt_url:   '',
  });

  // Sélection du BR à facturer
  const [selectedGRId, setSelectedGRId] = useState<string>('');

  // FIX: Calculer automatiquement les montants depuis le BR SÉLECTIONNÉ
  useEffect(() => {
    if (!receipts || receipts.length === 0) return;

    // Si aucun BR sélectionné, sélectionner automatiquement le premier BR non facturé
    if (!selectedGRId && receipts.length > 0) {
      // Trouver les BRs déjà facturés en comparant les montants
      const invoicedAmounts = new Set(
        (existingInvoices?.data ?? []).map(inv => 
          `${Number(inv.subtotal_ht).toFixed(3)}-${Number(inv.tax_amount).toFixed(3)}`
        )
      );

      // Trouver le premier BR non facturé
      const unfactoredGR = receipts.find(gr => {
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
        const key = `${round3(grHT).toFixed(3)}-${round3(grTVA).toFixed(3)}`;
        return !invoicedAmounts.has(key);
      });

      if (unfactoredGR) {
        setSelectedGRId(unfactoredGR.id);
      }
    }

    // Calculer les montants du BR sélectionné
    if (selectedGRId) {
      const selectedGR = receipts.find(gr => gr.id === selectedGRId);
      if (selectedGR) {
        let grHT = 0;
        let grTVA = 0;

        selectedGR.items?.forEach(grItem => {
          const poItem = po.items?.find(pi => pi.id === grItem.supplier_po_item_id);
          if (poItem) {
            const lineHT = Number(grItem.quantity_received) * Number(poItem.unit_price_ht);
            const lineTVA = lineHT * (Number(poItem.tax_rate_value) / 100);
            grHT += lineHT;
            grTVA += lineTVA;
          }
        });

        setForm(f => ({
          ...f,
          subtotal_ht: round3(grHT),
          tax_amount: round3(grTVA),
        }));
      }
    }
  }, [receipts, po.items, existingInvoices, selectedGRId]);

  const net_amount = round3(form.subtotal_ht + form.tax_amount + form.timbre_fiscal);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const [ocrOpen, setOcrOpen] = useState(false);

  // ── Détection doublon ─────────────────────────────────────────────────────
  const isDuplicate = (existingInvoices?.data ?? []).some(
    inv => inv.invoice_number_supplier.toLowerCase().trim() === form.invoice_number_supplier.toLowerCase().trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDuplicate) {
      toast.error('Doublon détecté', `Une facture avec le N° "${form.invoice_number_supplier}" existe déjà pour ce fournisseur`);
      return;
    }

    try {
      await create.mutateAsync({
        invoice_number_supplier: form.invoice_number_supplier,
        supplier_id:   po.supplier_id,
        supplier_po_id: po.id,
        invoice_date:  form.invoice_date,
        due_date:      form.due_date || undefined,
        subtotal_ht:   form.subtotal_ht,
        tax_amount:    form.tax_amount,
        timbre_fiscal: form.timbre_fiscal,
        receipt_url:   form.receipt_url || undefined,
      });
      toast.success('Facture créée', `La facture ${form.invoice_number_supplier} a été enregistrée`);
      onClose();
    } catch (err) { handleError(err, 'Impossible de créer la facture'); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Créer une facture</h2>
              <p className="text-sm text-gray-500">depuis {po.po_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info BC source + Sélection du BR */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm space-y-2">
            <p className="font-medium text-indigo-800">BC source : {po.po_number}</p>
            <p className="text-indigo-600">Fournisseur : {po.supplier?.name} · Net TTC BC : {formatAmount(po.net_amount)}</p>
            
            {receipts && receipts.length > 0 && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-indigo-700 mb-1">
                  Bon de réception à facturer *
                </label>
                <select
                  value={selectedGRId}
                  onChange={(e) => setSelectedGRId(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Sélectionner un BR</option>
                  {receipts.map(gr => {
                    // Calculer le montant du BR
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
                    const grTotal = round3(grHT + grTVA + 1.000);
                    
                    // Vérifier si déjà facturé
                    const isInvoiced = (existingInvoices?.data ?? []).some(inv => 
                      Math.abs(Number(inv.subtotal_ht) - grHT) < 0.01 && 
                      Math.abs(Number(inv.tax_amount) - grTVA) < 0.01
                    );

                    return (
                      <option key={gr.id} value={gr.id}>
                        {gr.gr_number} - {new Date(gr.receipt_date).toLocaleDateString('fr-FR')} - {formatAmount(grTotal)}
                        {isInvoiced ? ' (déjà facturé)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="flex items-center gap-1.5 mt-2 text-green-700">
                  <PackageCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Montants calculés automatiquement depuis le BR sélectionné
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° facture fournisseur *
            </label>
            <input type="text" required value={form.invoice_number_supplier}
              onChange={e => set('invoice_number_supplier', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                isDuplicate && form.invoice_number_supplier ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ex: FACT-2024-0042" />
            {isDuplicate && form.invoice_number_supplier && (
              <p className="text-red-600 text-xs mt-1">⚠ Ce numéro de facture existe déjà pour ce fournisseur</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date facture *</label>
              <input type="date" required value={form.invoice_date}
                onChange={e => set('invoice_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Échéance</label>
              <input type="date" value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Montants pré-remplis depuis les BRs ou le BC */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Montants {selectedGRId ? `(depuis BR ${receipts?.find(g => g.id === selectedGRId)?.gr_number})` : '(depuis le BC)'}
              </p>
              {selectedGRId && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Auto-calculé
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sous-total HT</label>
                <input type="number" min={0} step={0.001} value={form.subtotal_ht}
                  onChange={e => set('subtotal_ht', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">TVA</label>
                <input type="number" min={0} step={0.001} value={form.tax_amount}
                  onChange={e => set('tax_amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Timbre</label>
                <input type="number" min={0} step={0.001} value={form.timbre_fiscal}
                  onChange={e => set('timbre_fiscal', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            {/* Alerte si montants différents du BC */}
            {Math.abs(net_amount - Number(po.net_amount)) > 1.000 && (
              <div className={`border rounded-lg p-3 text-sm ${
                receipts && receipts.length > 0 && net_amount < Number(po.net_amount)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                {receipts && receipts.length > 0 && net_amount < Number(po.net_amount) ? (
                  <>
                    <p className="text-blue-700 font-medium">ℹ Facture partielle</p>
                    <p className="text-blue-600 text-xs mt-0.5">
                      Facture : {formatAmount(net_amount)} vs BC : {formatAmount(po.net_amount)} —
                      écart de {Math.abs(((net_amount - Number(po.net_amount)) / Number(po.net_amount)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      ✓ Normal : vous facturez uniquement ce qui a été réceptionné
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-orange-700 font-medium">⚠ Écart important détecté</p>
                    <p className="text-orange-600 text-xs mt-0.5">
                      Facture : {formatAmount(net_amount)} vs BC : {formatAmount(po.net_amount)} —
                      écart de {Math.abs(((net_amount - Number(po.net_amount)) / Number(po.net_amount)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-orange-600 text-xs mt-1">
                      Vérifiez que les montants correspondent à la facture papier du fournisseur
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 text-sm">
              <span>Net TTC facture</span>
              <span>{formatAmount(net_amount)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Scan de la facture</label>
              <button
                type="button"
                onClick={() => setOcrOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white 
                           rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                Import OCR
              </button>
            </div>
            <UploadInvoiceScan
              businessId={businessId}
              value={form.receipt_url}
              onChange={(url) => set('receipt_url', url)}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={create.isPending || isDuplicate}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {create.isPending ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </div>

      {ocrOpen && (
        <OcrInvoiceModal
          businessId={businessId}
          onClose={() => setOcrOpen(false)}
          onCreated={() => {
            setOcrOpen(false);
            onClose(); // fermer aussi le modal parent
          }}
        />
      )}
    </div>
  );
}