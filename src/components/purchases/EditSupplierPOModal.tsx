// src/components/purchases/EditSupplierPOModal.tsx
// Modal de modification d'un BC en statut DRAFT uniquement

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { useUpdateSupplierPO }  from '@/hooks/useSupplierPOs';
import { useToast }             from '@/components/ui/Toast';
import { CreateSupplierPOItemDto, formatAmount, round3, SupplierPO, TIMBRE_FISCAL, TVA_RATES } from '@/types';
import { useApiError } from '../ui/ConfirmModal';

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

  // Initialiser les lignes depuis le BC existant
  useEffect(() => {
    setLines((po.items ?? []).map(item => ({
      description:      item.description,
      quantity_ordered: Number(item.quantity_ordered),
      unit_price_ht:    Number(item.unit_price_ht),
      tax_rate_value:   Number(item.tax_rate_value),
      sort_order:       item.sort_order,
    })));
  }, [po]);

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

  const addLine    = () => setLines(ls => [...ls, { description: '', quantity_ordered: 1, unit_price_ht: 0, tax_rate_value: 19 }]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.some(l => !l.description.trim())) {
      toast.error('Validation', 'Toutes les lignes doivent avoir une description');
      return;
    }
    try {
      await update.mutateAsync({
        expected_delivery: expectedDelivery || undefined,
        notes:             notes || undefined,
        items:             lines.map((l, i) => ({ ...l, sort_order: i })),
      });
      toast.success('BC modifié', `${po.po_number} a été mis à jour`);
      onClose();
    } catch (err) { handleError(err, 'Impossible de modifier ce BC'); }
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Description *</th>
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
                        <input type="text" required value={line.description}
                          onChange={e => setLine(i, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500" />
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
            <button type="submit" disabled={update.isPending}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {update.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}