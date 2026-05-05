// src/components/purchases/InvoiceProcessGuide.tsx
import { X, FileText, FileSearch, Check, AlertTriangle, CreditCard, CheckCircle, MessageSquare } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function InvoiceProcessGuide({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Guide de Gestion des Factures</h2>
            <p className="text-sm text-gray-600 mt-1">Comprendre le processus étape par étape</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Processus principal */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">1</div>
              Réception de la facture
            </h3>
            <div className="ml-10 space-y-3">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  Vous recevez une facture fournisseur. Deux cas possibles :
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-300">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-sm text-gray-900">Avec Commande</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Badge <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 rounded text-green-800 font-semibold"><FileText className="h-3 w-3" />Liée à la commande</span> visible
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-300">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-sm text-gray-900">Sans Commande</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Pas de badge commande - Vérification manuelle requise
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cas 1: Avec BC */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">2A</div>
              Facture avec Commande - Vérification Automatique
            </h3>
            <div className="ml-10 space-y-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <FileSearch className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">Cliquez sur le bouton "Contrôler"</p>
                    <p className="text-xs text-gray-600">
                      Le système compare automatiquement 3 documents :
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white rounded p-2 text-center border border-green-300">
                    <div className="text-xs font-semibold text-gray-900">Commande</div>
                    <div className="text-xs text-gray-600">Ce que vous avez commandé</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-green-300">
                    <div className="text-xs font-semibold text-gray-900">Réception</div>
                    <div className="text-xs text-gray-600">Ce que vous avez reçu</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center border border-green-300">
                    <div className="text-xs font-semibold text-gray-900">Facture</div>
                    <div className="text-xs text-gray-600">Ce qu'on vous facture</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700"><span className="font-semibold">Tout correspond</span> → Facture approuvée automatiquement</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-700"><span className="font-semibold">Différences détectées</span> → Facture marquée avec un problème automatiquement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cas 2: Sans BC */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">2B</div>
              Facture sans Commande - Vérification Manuelle
            </h3>
            <div className="ml-10 space-y-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">Vérifiez manuellement puis approuvez</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Vérifiez que la facture correspond à ce que vous attendez, puis cliquez sur "Approuver"
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-300">
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">Conseil :</span> Vérifiez les montants, les quantités et les prix avant d'approuver
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestion des problèmes */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">3</div>
              Si la vérification détecte un problème
            </h3>
            <div className="ml-10 space-y-3">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-orange-300">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-sm text-gray-900">Problème détecté automatiquement</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Si la vérification automatique détecte des différences (prix, quantité, etc.), la facture est automatiquement marquée avec un problème
                    </p>
                    <div className="text-xs text-gray-700 bg-orange-50 p-2 rounded">
                      → La facture passe au statut "PROBLÈME" avec la raison affichée
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-orange-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-sm text-gray-900">Option 1 : Approuver malgré le problème</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Si la différence est acceptable ou justifiée, cliquez simplement sur "Approuver" dans la liste des factures
                    </p>
                    <div className="text-xs text-gray-700 bg-green-50 p-2 rounded">
                      → Le problème sera marqué comme résolu et la facture sera approuvée (1 clic)
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-orange-300">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-sm text-gray-900">Option 2 : Contacter le fournisseur</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Si vous avez besoin de clarifications, retournez sur la page de vérification et cliquez sur "Contacter fournisseur"
                    </p>
                    <div className="text-xs text-gray-700 bg-blue-50 p-2 rounded">
                      → Un email sera envoyé au fournisseur. Il répondra par email et vous pourrez ensuite approuver la facture
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paiement */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">4</div>
              Paiement de la facture
            </h3>
            <div className="ml-10 space-y-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">Une fois approuvée, payez la facture</p>
                    <p className="text-xs text-gray-600 mb-2">
                      Cliquez sur "Payer" pour enregistrer un paiement (total ou partiel)
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Note :</span> Vous pouvez effectuer plusieurs paiements partiels jusqu'au paiement complet
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé visuel */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-indigo-900 mb-3 text-center">Résumé du Processus</h3>
            <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
              <div className="bg-white rounded-lg px-3 py-2 border border-indigo-300 font-semibold text-gray-900">
                Réception
              </div>
              <span className="text-indigo-600">→</span>
              <div className="bg-white rounded-lg px-3 py-2 border border-indigo-300 font-semibold text-gray-900">
                Contrôle / Vérification
              </div>
              <span className="text-indigo-600">→</span>
              <div className="bg-white rounded-lg px-3 py-2 border border-indigo-300 font-semibold text-gray-900">
                Approbation
              </div>
              <span className="text-indigo-600">→</span>
              <div className="bg-white rounded-lg px-3 py-2 border border-indigo-300 font-semibold text-gray-900">
                Paiement
              </div>
            </div>
            <p className="text-xs text-center text-indigo-700 mt-3 italic">
              Si problème détecté : Approuver directement (1 clic) OU Contacter le fournisseur depuis la page de vérification
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
