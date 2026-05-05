// src/components/purchases/DisputeResolutionModal.tsx
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Clock, TrendingUp, XCircle, AlertTriangle } from 'lucide-react';
import {
  useDisputeInfo,
  useResolveDispute,
  ResolutionAction,
  ACTION_LABELS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PRIORITY_COLORS,
  PRIORITY_ICONS,
  type DisputeResolutionDto,
} from '@/hooks/useDisputeResolution';
import { ActionButton, ActionSection } from '@/components/ui/ActionButton';

interface DisputeResolutionModalProps {
  businessId: string;
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({
  businessId,
  invoiceId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedAction, setSelectedAction] = useState<ResolutionAction | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [notifySupplier, setNotifySupplier] = useState(true);
  const [correctedAmounts, setCorrectedAmounts] = useState({
    subtotal_ht: '',
    tax_amount: '',
    timbre_fiscal: '',
  });

  const { data: disputeInfo, isLoading } = useDisputeInfo(businessId, invoiceId);
  const resolveDispute = useResolveDispute(businessId);

  if (!isOpen) return null;

  const handleResolve = async () => {
    if (!selectedAction) return;

    const dto: DisputeResolutionDto = {
      action: selectedAction,
      resolution_notes: resolutionNotes || undefined,
      notify_supplier: notifySupplier,
    };

    // Ajouter les montants corrigés si l'action est CORRECT_AMOUNTS
    if (selectedAction === ResolutionAction.CORRECT_AMOUNTS) {
      dto.corrected_amounts = {
        subtotal_ht: correctedAmounts.subtotal_ht ? Number(correctedAmounts.subtotal_ht) : undefined,
        tax_amount: correctedAmounts.tax_amount ? Number(correctedAmounts.tax_amount) : undefined,
        timbre_fiscal: correctedAmounts.timbre_fiscal ? Number(correctedAmounts.timbre_fiscal) : undefined,
      };
    }

    try {
      await resolveDispute.mutateAsync({ invoiceId, dto });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la résolution du litige:', error);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Résolution de Litige
            </h2>
            {disputeInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Facture {disputeInfo.invoice_number} - {disputeInfo.supplier_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : disputeInfo ? (
            <div className="space-y-6">
              {/* Informations du litige */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Informations du Litige
                    </h3>
                    {disputeInfo.dispute_category && (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                          CATEGORY_COLORS[disputeInfo.dispute_category]
                        }`}
                      >
                        {CATEGORY_LABELS[disputeInfo.dispute_category]}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600 font-medium">En litige depuis</div>
                    <div className="text-2xl font-bold text-red-900">
                      {disputeInfo.days_in_dispute} jour{disputeInfo.days_in_dispute > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {disputeInfo.dispute_reason && (
                  <div className="bg-white rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">{disputeInfo.dispute_reason}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Montant Facturé</div>
                    <div className="text-lg font-bold text-purple-600">
                      {formatAmount(disputeInfo.invoiced_amount)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Montant Attendu</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatAmount(disputeInfo.expected_amount)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Écart</div>
                    <div
                      className={`text-lg font-bold ${
                        disputeInfo.discrepancy > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {disputeInfo.discrepancy > 0 ? '+' : ''}
                      {formatAmount(disputeInfo.discrepancy)}
                      <span className="text-sm ml-1">
                        ({disputeInfo.discrepancy_pct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions suggérées */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Actions Suggérées (par priorité)
                </h3>
                <div className="space-y-3">
                  {disputeInfo.suggested_actions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAction(suggestion.action)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAction === suggestion.action
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {PRIORITY_ICONS[suggestion.priority]}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {suggestion.label}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                PRIORITY_COLORS[suggestion.priority]
                              }`}
                            >
                              {suggestion.priority === 'high'
                                ? 'Priorité Haute'
                                : suggestion.priority === 'medium'
                                ? 'Priorité Moyenne'
                                : 'Priorité Basse'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Délai estimé: {suggestion.estimated_time}</span>
                          </div>
                        </div>
                        {selectedAction === suggestion.action && (
                          <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulaire de résolution */}
              {selectedAction && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Détails de la résolution
                  </h3>

                  {/* Montants corrigés (si CORRECT_AMOUNTS) */}
                  {selectedAction === ResolutionAction.CORRECT_AMOUNTS && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Entrez les montants corrigés (laissez vide pour conserver la valeur actuelle)
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sous-total HT
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            value={correctedAmounts.subtotal_ht}
                            onChange={(e) =>
                              setCorrectedAmounts((prev) => ({
                                ...prev,
                                subtotal_ht: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder={disputeInfo.invoiced_amount.toFixed(3)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            TVA
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            value={correctedAmounts.tax_amount}
                            onChange={(e) =>
                              setCorrectedAmounts((prev) => ({
                                ...prev,
                                tax_amount: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Timbre Fiscal
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            value={correctedAmounts.timbre_fiscal}
                            onChange={(e) =>
                              setCorrectedAmounts((prev) => ({
                                ...prev,
                                timbre_fiscal: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="1.000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes de résolution */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ajoutez des notes explicatives sur la résolution..."
                    />
                  </div>

                  {/* Notification fournisseur */}
                  {disputeInfo.supplier_email && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="notify-supplier"
                        checked={notifySupplier}
                        onChange={(e) => setNotifySupplier(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="notify-supplier" className="text-sm text-gray-700">
                        Envoyer un email au fournisseur ({disputeInfo.supplier_email})
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune information de litige disponible
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <ActionSection title="Résolution du litige">
              <ActionButton
                icon={CheckCircle}
                label="Confirmer la résolution"
                description={selectedAction ? ACTION_LABELS[selectedAction] : 'Sélectionnez une action'}
                onClick={handleResolve}
                variant="success"
                disabled={!selectedAction}
                loading={resolveDispute.isPending}
              />
              <ActionButton
                icon={XCircle}
                label="Annuler"
                description="Fermer sans résoudre"
                onClick={onClose}
                variant="secondary"
              />
            </ActionSection>
          </div>
        </div>
      </div>
    </div>
  );
};
