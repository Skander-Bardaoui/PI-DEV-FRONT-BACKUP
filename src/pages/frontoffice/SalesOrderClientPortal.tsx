// src/pages/frontoffice/SalesOrderClientPortal.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/api.config';

interface PortalData {
  business: {
    name: string;
    email: string;
    phone: string;
    tax_id: string;
  };
  client: {
    name: string;
    email: string;
    phone: string;
  };
  salesOrder: {
    id: string;
    orderNumber: string;
    orderDate: string;
    expectedDelivery: string;
    status: string;
    subtotal: number;
    taxAmount: number;
    timbreFiscal: number;
    netAmount: number;
    notes: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      total: number;
    }>;
  };
  token: string;
}

export default function SalesOrderClientPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'confirmed' | 'refused' | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [recurringLoading, setRecurringLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token manquant');
      setLoading(false);
      return;
    }

    fetchPortalData();
  }, [token]);

  const fetchPortalData = async () => {
    try {
      const response = await axios.get(`${API_URL}/client-portal/data`, {
        params: { token },
      });
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token) return;

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/client-portal/confirm`, { token });
      // Show recurring invoice modal after confirmation
      setShowRecurringModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRecurring = async () => {
    if (!token || !data) return;

    setRecurringLoading(true);
    try {
      await axios.post(`${API_URL}/client-portal/create-recurring`, {
        token,
        frequency: recurringFrequency,
      });
      setShowRecurringModal(false);
      setActionSuccess('confirmed');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création de l\'abonnement');
    } finally {
      setRecurringLoading(false);
    }
  };

  const handleSkipRecurring = () => {
    setShowRecurringModal(false);
    setActionSuccess('confirmed');
  };

  const handleRefuse = async () => {
    if (!token || !refuseReason.trim()) {
      alert('Veuillez indiquer un motif de refus');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/client-portal/refuse`, {
        token,
        reason: refuseReason,
      });
      setActionSuccess('refused');
      setShowRefuseModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center border border-red-200">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error || 'Données introuvables'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (actionSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          {actionSuccess === 'confirmed' ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande confirmée !</h1>
              <p className="text-gray-600 mb-6">
                Merci d'avoir confirmé votre commande <strong>{data.salesOrder.orderNumber}</strong>.
                Vous recevrez une notification dès l'expédition.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande refusée</h1>
              <p className="text-gray-600 mb-6">
                Votre refus a été enregistré. Le fournisseur sera notifié.
              </p>
            </>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const order = data.salesOrder;
  const business = data.business;
  const client = data.client;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">{business.name}</span>
            </div>
            <span className="text-sm text-gray-500">Portail Client</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Confirmation de commande
          </h1>
          <p className="text-gray-600">
            Veuillez vérifier les détails de votre commande et confirmer votre accord.
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <p className="text-sm text-gray-500">
                Date: {new Date(order.orderDate).toLocaleDateString('fr-FR')}
              </p>
              {order.expectedDelivery && (
                <p className="text-sm text-gray-500">
                  Livraison prévue: {new Date(order.expectedDelivery).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {order.status}
            </span>
          </div>

          {/* Business & Client Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Fournisseur</p>
              <p className="font-semibold text-gray-900">{business.name}</p>
              {business.email && <p className="text-sm text-gray-600">{business.email}</p>}
              {business.phone && <p className="text-sm text-gray-600">{business.phone}</p>}
              {business.tax_id && <p className="text-xs text-gray-500">MF: {business.tax_id}</p>}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Client</p>
              <p className="font-semibold text-gray-900">{client.name}</p>
              {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
              {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Description</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Qté</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">P.U. HT</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">TVA</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(item.quantity).toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(item.unitPrice).toFixed(3)} TND</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{Number(item.taxRate)}%</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {Number(item.total).toFixed(3)} TND
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Sous-total HT:</span>
                  <span className="font-medium">{Number(order.subtotal).toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">TVA:</span>
                  <span className="font-medium">{Number(order.taxAmount).toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Timbre fiscal:</span>
                  <span className="font-medium">{Number(order.timbreFiscal).toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between py-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Net TTC:</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {Number(order.netAmount).toFixed(3)} TND
                  </span>
                </div>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Notes:</strong> {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Confirmez-vous cette commande ?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              Confirmer la commande
            </button>
            <button
              onClick={() => setShowRefuseModal(true)}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="h-5 w-5" />
              Refuser la commande
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-gray-600 mb-4">
            Pour toute question concernant cette commande, contactez-nous :
          </p>
          <div className="flex flex-wrap gap-4">
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {business.email}
              </a>
            )}
            {business.phone && (
              <>
                <span className="text-gray-300">|</span>
                <a
                  href={`tel:${business.phone}`}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {business.phone}
                </a>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Refuse Modal */}
      {showRefuseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Refuser la commande</h2>
            <p className="text-gray-600 mb-4">
              Veuillez indiquer le motif de votre refus :
            </p>
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Ex: Prix trop élevé, délai de livraison trop long..."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRefuseModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRefuse}
                disabled={actionLoading || !refuseReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Confirmer le refus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Invoice Modal */}
      {showRecurringModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Transformer en abonnement ?
              </h2>
              <p className="text-gray-600">
                Souhaitez-vous recevoir cette commande de manière récurrente ?
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Avantages de l'abonnement</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Livraison automatique à intervalles réguliers</li>
                    <li>• Plus besoin de repasser commande</li>
                    <li>• Facturation automatique</li>
                    <li>• Possibilité de pause ou annulation à tout moment</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence de livraison
                </label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="MONTHLY">Mensuel (chaque mois)</option>
                  <option value="QUARTERLY">Trimestriel (tous les 3 mois)</option>
                  <option value="YEARLY">Annuel (chaque année)</option>
                </select>
              </div>

              <div className="mt-4 bg-white rounded-lg p-3 border border-indigo-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Montant {recurringFrequency === 'MONTHLY' ? 'mensuel' : recurringFrequency === 'QUARTERLY' ? 'trimestriel' : 'annuel'}</span>
                  <span className="font-bold text-indigo-600">{Number(data.salesOrder.netAmount).toFixed(3)} TND</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreateRecurring}
                disabled={recurringLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {recurringLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Oui, créer un abonnement
                  </>
                )}
              </button>
              <button
                onClick={handleSkipRecurring}
                disabled={recurringLoading}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Non merci, commande unique
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Vous pourrez modifier ou annuler votre abonnement à tout moment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
