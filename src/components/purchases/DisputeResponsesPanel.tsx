// src/components/purchases/DisputeResponsesPanel.tsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import {
  usePendingDisputeResponses,
  useProcessDisputeResponse,
  type DisputeResponseItem,
} from '@/hooks/useDisputeResponses';

interface DisputeResponsesPanelProps {
  businessId: string;
}

export const DisputeResponsesPanel: React.FC<DisputeResponsesPanelProps> = ({
  businessId,
}) => {
  const { data: responses, isLoading } = usePendingDisputeResponses(businessId);
  const processResponse = useProcessDisputeResponse(businessId);

  const [selectedResponse, setSelectedResponse] = useState<DisputeResponseItem | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject'>('accept');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleProcess = async () => {
    if (!selectedResponse) return;

    await processResponse.mutateAsync({
      responseId: selectedResponse.id,
      action,
      admin_notes: adminNotes || undefined,
    });

    setShowModal(false);
    setSelectedResponse(null);
    setAdminNotes('');
  };

  const openModal = (response: DisputeResponseItem, actionType: 'accept' | 'reject') => {
    setSelectedResponse(response);
    setAction(actionType);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Aucune réponse de fournisseur en attente</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {responses.map((response) => {
          const discrepancy = response.invoice_amount - response.expected_amount;
          const hasProposal = response.proposed_amount !== null;

          return (
            <div
              key={response.id}
              className="bg-white border-2 border-green-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-300">
                      ✅ Nouvelle Réponse
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(response.created_at)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Facture {response.invoice_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Fournisseur: <span className="font-medium">{response.supplier_name}</span>
                  </p>
                </div>
              </div>

              {/* Montants */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">Montant Facturé</div>
                  <div className="text-sm font-bold text-purple-700">
                    {formatAmount(response.invoice_amount)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">Montant Attendu</div>
                  <div className="text-sm font-bold text-green-700">
                    {formatAmount(response.expected_amount)}
                  </div>
                </div>
                <div className={`rounded-lg p-3 ${discrepancy > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className={`text-xs mb-1 ${discrepancy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Écart
                  </div>
                  <div className={`text-sm font-bold ${discrepancy > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {discrepancy > 0 ? '+' : ''}
                    {formatAmount(discrepancy)}
                  </div>
                </div>
              </div>

              {/* Message du fournisseur */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message du Fournisseur
                </h4>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                  {response.response_message}
                </p>
              </div>

              {/* Solution proposée */}
              {response.proposed_solution && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Solution Proposée
                  </h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap mb-2">
                    {response.proposed_solution}
                  </p>
                  {hasProposal && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="text-sm text-blue-700">
                        Montant proposé:{' '}
                        <span className="font-bold text-blue-900">
                          {formatAmount(response.proposed_amount!)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => openModal(response, 'accept')}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accepter et Résoudre
                </button>
                <button
                  onClick={() => openModal(response, 'reject')}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Rejeter
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmation */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div
              className={`p-6 rounded-t-xl ${
                action === 'accept'
                  ? 'bg-gradient-to-r from-green-600 to-green-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700'
              } text-white`}
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                {action === 'accept' ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Accepter la Réponse
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6" />
                    Rejeter la Réponse
                  </>
                )}
              </h2>
              <p className="text-sm mt-1 opacity-90">
                Facture {selectedResponse.invoice_number}
              </p>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                {action === 'accept'
                  ? 'En acceptant cette réponse, le litige sera résolu et la facture sera approuvée.'
                  : 'En rejetant cette réponse, le litige restera actif et vous devrez prendre d\'autres mesures.'}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes administratives (optionnel)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ajoutez des notes pour votre suivi interne..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedResponse(null);
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processResponse.isPending}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    action === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processResponse.isPending ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
