// src/components/purchases/AiPOGeneratorModal.tsx
//
// Modal de génération de BC par IA à partir de texte naturel
// Exemple: "Commander 500 kg de farine chez Ali Boulangerie pour le 15 avril"

import { useState } from 'react';
import { X, Sparkles, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';

interface GeneratedPO {
  supplier_id: string;
  supplier_name: string;
  delivery_date: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate_value: number;
  }>;
  notes: string;
  confidence: number;
}

interface Props {
  businessId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AiPOGeneratorModal({ businessId, onClose, onSuccess }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<GeneratedPO | null>(null);
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const queryClient = useQueryClient();

  const examples = [
    "Commander 500 kg de farine chez Ali Boulangerie pour le 15 avril",
    "Acheter 100 unités de sucre chez Fournisseur Alimentaire",
    "Prendre 50 litres d'huile d'olive chez Olive & Co pour demain",
  ];

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Veuillez saisir une commande');
      return;
    }

    setLoading(true);
    setError('');
    setGenerated(null);

    try {
      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/supplier-pos/generate-from-text`,
        { text: text.trim() },
      );
      setGenerated(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!generated) return;

    setCreating(true);
    setError('');

    try {
      await axiosInstance.post(`/businesses/${businessId}/supplier-pos`, {
        supplier_id: generated.supplier_id,
        delivery_date: generated.delivery_date,
        notes: generated.notes,
        items: generated.items.map(item => ({
          description: item.description,
          quantity_ordered: item.quantity,
          unit_price_ht: item.unit_price_ht,
          tax_rate_value: item.tax_rate_value,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ['supplier-pos', businessId] });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création du BC');
    } finally {
      setCreating(false);
    }
  };

  const totalHT = generated?.items.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price_ht), 0
  ) || 0;

  const totalTVA = generated?.items.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price_ht * item.tax_rate_value / 100), 0
  ) || 0;

  const totalTTC = totalHT + totalTVA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] animate-gradient text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Génération de BC par IA</h2>
              <p className="text-xs text-purple-100">Décrivez votre commande en langage naturel</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          
          {/* Exemples */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-600 mb-2">💡 Exemples de commandes :</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setText(ex)}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Champ texte */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Décrivez votre commande
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Commander 500 kg de farine chez Ali Boulangerie pour le 15 avril"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mentionnez : le produit, la quantité, le fournisseur (et optionnellement la date)
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Bouton générer */}
          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white rounded-xl transition-all duration-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span className="animate-pulse">Génération en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Générer le BC avec l'IA
                </>
              )}
            </button>
          )}

          {/* Résultat généré */}
          {generated && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
              
              {/* Score de confiance */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-top duration-700">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg animate-in zoom-in duration-500 delay-200">
                  {generated.confidence}%
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 animate-in zoom-in duration-300 delay-300" />
                    BC généré avec succès !
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Vérifiez les informations avant de créer le bon de commande
                  </p>
                </div>
              </div>

              {/* Détails du BC */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                
                {/* Fournisseur */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fournisseur</span>
                  <span className="font-semibold text-gray-900">{generated.supplier_name}</span>
                </div>

                {/* Date de livraison */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date de livraison</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(generated.delivery_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Articles */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Articles commandés</p>
                  {generated.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {item.unit_price_ht.toFixed(3)} TND HT
                          {item.tax_rate_value > 0 && ` (TVA ${item.tax_rate_value}%)`}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {(item.quantity * item.unit_price_ht * (1 + item.tax_rate_value / 100)).toFixed(3)} TND
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-semibold">{totalHT.toFixed(3)} TND</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total TVA</span>
                    <span className="font-semibold">{totalTVA.toFixed(3)} TND</span>
                  </div>
                  <div className="flex items-center justify-between text-base pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total TTC</span>
                    <span className="font-bold text-purple-600 text-lg">{totalTTC.toFixed(3)} TND</span>
                  </div>
                </div>

                {/* Notes */}
                {generated.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 italic">{generated.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setGenerated(null)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Modifier
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-2 py-3 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white rounded-xl transition-all duration-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {creating ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Créer le BC
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
