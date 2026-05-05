// src/pages/frontoffice/SubscriptionManagePage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/api.config';

const RECURRING_FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  YEARLY: 'Annuel',
};

interface SubscriptionData {
  recurring: {
    id: string;
    description: string;
    frequency: string;
    amount: number;
    next_invoice_date: string;
    status: string;
    client: {
      name: string;
      email: string;
    };
    business: {
      name: string;
      email: string;
      phone: string;
    };
  };
  invoice: {
    invoice_number: string;
    date: string;
    total_ttc: number;
  };
  action: 'continue' | 'cancel';
  token: string;
}

export default function SubscriptionManagePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const action = searchParams.get('action') as 'continue' | 'cancel' | null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'continue' | 'cancel' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token manquant');
      setLoading(false);
      return;
    }

    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription-manage/data`, {
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

  const handleContinue = async () => {
    if (!token) return;

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/subscription-manage/continue`, { token });
      setActionSuccess('continue');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/subscription-manage/cancel`, {
        token,
        reason: cancelReason,
      });
      setActionSuccess('cancel');
      setShowCancelModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
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
          {actionSuccess === 'continue' ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement confirmé !</h1>
              <p className="text-gray-600 mb-6">
                Merci d'avoir confirmé votre abonnement. Vous continuerez à recevoir vos factures selon la fréquence choisie.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Prochaine facture :</strong><br />
                  {new Date(data.recurring.next_invoice_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Abonnement annulé</h1>
              <p className="text-gray-600 mb-6">
                Votre abonnement a été annulé avec succès. Vous ne recevrez plus de factures automatiques.
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

  const recurring = data.recurring;
  const invoice = data.invoice;
  const business = data.recurring.business;

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
            <span className="text-sm text-gray-500">Gestion d'abonnement</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <RefreshCw className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gérer votre abonnement
          </h1>
          <p className="text-gray-600">
            {action === 'continue' 
              ? 'Confirmez la poursuite de votre abonnement'
              : 'Annulez votre abonnement si vous le souhaitez'}
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Détails de l'abonnement</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Description</p>
              <p className="font-semibold text-gray-900">{recurring.description}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Fréquence</p>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                <RefreshCw className="h-4 w-4" />
                {RECURRING_FREQUENCY_LABELS[recurring.frequency]}
              </span>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Montant par période</span>
              <span className="text-2xl font-bold text-indigo-600">
                {Number(recurring.amount).toFixed(3)} TND
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Dernière facture générée</h3>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                <p className="text-sm text-gray-500">
                  {new Date(invoice.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {Number(invoice.total_ttc).toFixed(3)} TND
              </span>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📅 Prochaine facture :</strong>{' '}
              {new Date(recurring.next_invoice_date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {action === 'continue' ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Continuer votre abonnement ?
              </h3>
              <p className="text-gray-600 mb-6">
                En confirmant, vous continuerez à recevoir vos factures automatiquement selon la fréquence choisie.
              </p>
              <button
                onClick={handleContinue}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Oui, continuer l'abonnement
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Annuler votre abonnement ?
              </h3>
              <p className="text-gray-600 mb-6">
                Si vous annulez, vous ne recevrez plus de factures automatiques. Cette action est définitive.
              </p>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <XCircle className="h-5 w-5" />
                Annuler l'abonnement
              </button>
            </>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-gray-600 mb-4">
            Pour toute question concernant votre abonnement, contactez-nous :
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

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmer l'annulation</h2>
            <p className="text-gray-600 mb-4">
              Pouvez-vous nous dire pourquoi vous annulez votre abonnement ? (optionnel)
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Ex: Trop cher, je n'en ai plus besoin..."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Retour
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Confirmer l\'annulation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
