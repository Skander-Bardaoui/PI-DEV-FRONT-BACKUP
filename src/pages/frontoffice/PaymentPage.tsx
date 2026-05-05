// src/pages/frontoffice/PaymentPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, CreditCard, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface PaymentInfo {
  tenantName: string;
  planName: string;
  priceMonthly: number;
  priceAnnual: number;
  billingCycle: 'monthly' | 'annual';
  amount: number;
  currency: string;
}

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activating, setActivating] = useState(false);

  const [formData, setFormData] = useState({
    method: 'bank_transfer',
    payer_name: '',
    payer_phone: '',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchPaymentInfo();
  }, [token]);

  const fetchPaymentInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/subscriptions/pay/${token}`);
      setPaymentInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lien de paiement invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.payer_name.trim()) {
      setError('Le nom du payeur est requis');
      return;
    }

    if (!formData.payer_phone.trim()) {
      setError('Le téléphone du payeur est requis');
      return;
    }

    if ((formData.method === 'bank_transfer' || formData.method === 'check') && !formData.reference_number.trim()) {
      setError('Le numéro de référence est requis pour ce mode de paiement');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/subscriptions/pay/${token}/submit`, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle free plan activation
  const handleFreeActivation = async () => {
    setError('');
    setActivating(true);

    try {
      await axios.post(`${API_URL}/api/subscriptions/pay/${token}/confirm`, {
        freeActivation: true
      });
      
      // Redirect to success page
      navigate(`/pay/${token}/success`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'activation de votre essai gratuit');
    } finally {
      setActivating(false);
    }
  };

  // Check if this is a free plan
  const isFreePlan = paymentInfo?.amount === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !paymentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement soumis !</h2>
          <p className="text-gray-600 mb-6">
            Vos informations de paiement ont été soumises avec succès. Nous vérifierons votre paiement et activerons votre compte dans les 24 heures.
          </p>
          <p className="text-sm text-gray-500">
            Vous recevrez un email de confirmation une fois votre paiement vérifié.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            NovEntra
          </span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`p-8 text-white ${
            isFreePlan 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600'
          }`}>
            <h1 className="text-3xl font-bold mb-2">
              {isFreePlan ? 'Activez votre essai gratuit' : 'Complétez votre abonnement'}
            </h1>
            <p className={isFreePlan ? 'text-green-100' : 'text-indigo-100'}>
              {isFreePlan 
                ? 'Commencez votre essai gratuit de 7 jours dès maintenant' 
                : 'Soumettez vos informations de paiement pour activer votre compte'}
            </p>
          </div>

          {/* Summary Card */}
          <div className="p-8 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé de l'abonnement</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Organisation:</span>
                <span className="font-semibold text-gray-900">{paymentInfo?.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900">{paymentInfo?.planName}</span>
              </div>
              {isFreePlan && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée:</span>
                  <span className="font-semibold text-green-600">7 jours d'essai gratuit</span>
                </div>
              )}
              {!isFreePlan && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cycle de facturation:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentInfo?.billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-300">
                <span className="text-lg font-semibold text-gray-900">Montant total:</span>
                <span className={`text-2xl font-bold ${isFreePlan ? 'text-green-600' : 'text-indigo-600'}`}>
                  {isFreePlan ? 'Gratuit' : `${paymentInfo?.amount.toFixed(3)} ${paymentInfo?.currency}`}
                </span>
              </div>
            </div>
          </div>

          {/* Free Plan Activation OR Payment Form */}
          {isFreePlan ? (
            <div className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Free Plan Benefits */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Votre essai gratuit inclut:
                </h3>
                <ul className="space-y-2">
                  {[
                    'Accès complet à toutes les fonctionnalités',
                    'Gestion illimitée des factures et devis',
                    'Gestion des stocks et achats',
                    'Tableau de bord et statistiques',
                    '7 jours d\'accès gratuit',
                    'Aucune carte bancaire requise'
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Activation Button */}
              <button
                onClick={handleFreeActivation}
                disabled={activating}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {activating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Activation en cours...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Activer mon essai gratuit
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Aucune carte bancaire requise • Annulez à tout moment
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Méthode de paiement</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'bank_transfer', label: 'Virement bancaire' },
                  { value: 'check', label: 'Chèque' },
                  { value: 'cash', label: 'Espèces' },
                  { value: 'card', label: 'Carte bancaire' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, method: method.value })}
                    className={`p-4 border-2 rounded-xl font-medium transition-all ${
                      formData.method === method.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet du payeur *</label>
              <input
                type="text"
                value={formData.payer_name}
                onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Jean Dupont"
                required
              />
            </div>

            {/* Payer Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone du payeur *</label>
              <input
                type="tel"
                value={formData.payer_phone}
                onChange={(e) => setFormData({ ...formData, payer_phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="+216 12 345 678"
                required
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéro de référence {(formData.method === 'bank_transfer' || formData.method === 'check') && '*'}
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder={
                  formData.method === 'bank_transfer'
                    ? 'Référence du virement'
                    : formData.method === 'check'
                    ? 'Numéro du chèque'
                    : 'Référence (optionnel)'
                }
                required={formData.method === 'bank_transfer' || formData.method === 'check'}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optionnel)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Informations supplémentaires..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Soumission en cours...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Soumettre les informations de paiement
                </>
              )}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
