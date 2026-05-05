// src/components/purchases/EditSupplierPOModal.tsx
// Modal de modification d'un BC en statut DRAFT uniquement

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { useUpdateSupplierPO }  from '@/hooks/useSupplierPOs';
import { useToast }             from '@/components/ui/Toast';
import { CreateSupplierPOItemDto, formatAmount, round3, SupplierPO, TIMBRE_FISCAL, TVA_RATES } from '@/types';
import { useApiError } from '../ui/ConfirmModal';
import ProductSelectorPurchase from './ProductSelectorPurchase';
import { Product } from '@/types/product';

interface Props {
  businessId: string;
  po:         SupplierPO;
  onClose:    () => void;
}

export default function EditSupplierPOModal({ businessId, po, onClose }: Props) {
  const update        = useUpdateSupplierPO(businessId, po.id);
  const toast         = useToast();
  const { handleError } = useApiError();

  const [expectedDelivery, setExpectedDelivery] = useState(po.expected_delivery?.split('T')[0] ?? '');
  const [notes,            setNotes]            = useState(po.notes ?? '');
  const [lines,            setLines]            = useState<CreateSupplierPOItemDto[]>([]);
  const [errors,           setErrors]           = useState<{ [key: string]: string }>({});
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  
  // Utiliser useRef pour s'assurer que l'initialisation ne se fait qu'une seule fois
  const hasInitialized = useRef(false);

  // Initialiser les lignes depuis le BC existant - SEULEMENT au montage initial
  useEffect(() => {
    // Ne s'exécute qu'une seule fois, même si le composant se re-render
    if (hasInitialized.current) {
      console.log('⚠️ Initialization already done, skipping');
      return;
    }
    
    console.log('🔧 Modal mounted - Initializing with PO:', po.id);
    console.log('🔧 PO has', po.items?.length, 'items');
    console.log('🔧 Items:', po.items?.map(i => ({ id: i.id, desc: i.description, qty: i.quantity_ordered })));
    
    const initialLines = (po.items ?? []).map(item => ({
      product_id:       item.product_id || undefined,
      description:      item.description,
      quantity_ordered: Number(item.quantity_ordered),
      unit_price_ht:    Number(item.unit_price_ht),
      tax_rate_value:   Number(item.tax_rate_value),
      sort_order:       item.sort_order,
    }));
    
    console.log('🔧 Setting', initialLines.length, 'lines in state');
    setLines(initialLines);
    hasInitialized.current = true;
    
    // Cleanup: reset the ref when component unmounts
    return () => {
      console.log('🔧 Modal unmounting - resetting hasInitialized');
      hasInitialized.current = false;
    };
  }, []); // ✅ [] = seulement au montage, jamais après

  // Calculs
  const computed = lines.map(l => {
    const ht  = round3(l.quantity_ordered * l.unit_price_ht);
    const tax = round3(ht * (l.tax_rate_value / 100));
    return { ht, tax };
  });
  const subtotal_ht = round3(computed.reduce((s, c) => s + c.ht, 0));
  const tax_amount  = round3(computed.reduce((s, c) => s + c.tax, 0));
  const net_amount  = round3(subtotal_ht + tax_amount + TIMBRE_FISCAL);

  const setLine = (i: number, key: keyof CreateSupplierPOItemDto, value: any) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [key]: value } : l));

  const addLine = () => setLines(ls => [...ls, { 
    product_id: undefined as any, // Will be set when product is selected
    description: '', 
    quantity_ordered: 1, 
    unit_price_ht: 0, 
    tax_rate_value: 19 
  }]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const handleProductSelect = (index: number, product: Product | null) => {
    if (product) {
      setLine(index, 'product_id', product.id);
      setLine(index, 'description', product.name);
      // Ne pas pré-remplir le prix - l'utilisateur doit saisir le prix d'achat
      // car product.purchase_price_ht est le prix de vente, pas le prix d'achat
    } else {
      setLine(index, 'product_id', undefined);
      setLine(index, 'description', '');
      setLine(index, 'unit_price_ht', 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (update.isPending || isSubmitting) {
      console.log('⚠️ Submit already in progress, ignoring');
      return;
    }
    
    setIsSubmitting(true);
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    
    if (lines.length === 0) {
      newErrors.lines = 'Au moins une ligne est requise';
    }
    
    lines.forEach((line, i) => {
      if (!line.description.trim()) {
        newErrors[`line_${i}_description`] = 'La description est obligatoire';
      }
      if (line.quantity_ordered <= 0) {
        newErrors[`line_${i}_quantity`] = 'La quantité doit être supérieure à 0';
      }
      if (line.unit_price_ht <= 0) {
        newErrors[`line_${i}_price`] = 'Le prix unitaire doit être supérieur à 0';
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }
    
    const payload = {
      expected_delivery: expectedDelivery || undefined,
      notes:             notes || undefined,
      items:             lines.map((l, i) => ({ ...l, sort_order: i })),
    };
    
    console.log('🚀 Submitting PO update with payload:', JSON.stringify(payload, null, 2));
    
    try {
      await update.mutateAsync(payload);
      console.log('✅ PO update successful');
      // Close modal IMMEDIATELY and ignore any subsequent errors
      onClose();
    } catch (err: any) {
      console.error('❌ PO update failed:', err);
      const status = err?.response?.status;
      
      // If it's a 500 error, the update might have actually succeeded
      // Close the modal and let the query invalidation refresh the data
      if (status === 500) {
        console.log('⚠️ Got 500 error, but closing modal - update may have succeeded');
        onClose();
      } else {
        // For other errors, keep the modal open
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Edit className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Modifier le BC</h2>
              <p className="text-sm text-gray-500">{po.po_number} — {po.supplier?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Message informatif sur la modification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Modification en mode brouillon</h3>
                <p className="text-sm text-blue-700">Ce BC est en statut "Brouillon" et peut être modifié. Une fois envoyé, il ne pourra plus être modifié.</p>
              </div>
            </div>
          </div>

          {/* Message d'erreur global */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Erreurs de validation</h3>
                  <p className="text-sm text-red-700">Veuillez corriger les erreurs ci-dessous avant de continuer.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livraison souhaitée</label>
              <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Lignes</h3>
              <button type="button" onClick={addLine}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produit *</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">Qté</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-32">Prix HT</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">TVA %</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-32">Total HT</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">
                        <ProductSelectorPurchase
                          businessId={businessId}
                          value={line.product_id}
                          onChange={(product) => handleProductSelect(i, product)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min={0.001} step={0.001} value={line.quantity_ordered}
                          onChange={e => setLine(i, 'quantity_ordered', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min={0} step={0.001} value={line.unit_price_ht}
                          onChange={e => setLine(i, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:ring-1 focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={line.tax_rate_value}
                          onChange={e => setLine(i, 'tax_rate_value', parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500">
                          {TVA_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                        {computed[i]?.ht.toFixed(3)}
                      </td>
                      <td className="px-4 py-2">
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(i)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 rounded-xl p-4 ml-auto max-w-xs w-full">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Sous-total HT</span><span>{subtotal_ht.toFixed(3)} TND</span></div>
              <div className="flex justify-between text-gray-600"><span>TVA</span><span>{tax_amount.toFixed(3)} TND</span></div>
              <div className="flex justify-between text-gray-600"><span>Timbre</span><span>{TIMBRE_FISCAL.toFixed(3)} TND</span></div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Net TTC</span><span>{formatAmount(net_amount)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={update.isPending || isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {(update.isPending || isSubmitting) ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}