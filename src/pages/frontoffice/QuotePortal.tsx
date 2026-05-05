// src/pages/frontoffice/QuotePortal.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, FileText, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';

// Create axios instance without auth interceptors
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

export default function QuotePortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/quote-portal/data', {
        params: { token },
      });
      setData(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await apiClient.post('/quote-portal/accept', { token });
      setSuccess(true);
      setAction('accept');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await apiClient.post('/quote-portal/reject', {
        token,
        reason: rejectionReason,
      });
      setSuccess(true);
      setAction('reject');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className={`h-16 w-16 ${action === 'accept' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {action === 'accept' ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {action === 'accept' ? 'Devis accepté !' : 'Devis refusé'}
          </h1>
          <p className="text-gray-600 mb-6">
            {action === 'accept'
              ? `Merci ! Votre commande a été créée automatiquement. ${data.business.name} vous contactera prochainement.`
              : `Votre refus a été enregistré. ${data.business.name} en a été informé.`}
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Devis: <strong>{data.quote.quoteNumber}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const quote = data.quote;
  const business = data.business;
  const client = data.client;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Devis {quote.quoteNumber}
          </h1>
          <p className="text-lg text-gray-600">
            De <strong className="text-indigo-600">{business.name}</strong>
          </p>
        </div>

        {/* Quote Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Date du devis</p>
                <p className="font-semibold text-gray-900">
                  {new Date(quote.quoteDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            {quote.validUntil && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Valable jusqu'au</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="font-bold text-2xl text-green-600">
                  {Number(quote.netAmount).toFixed(3)} DT
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Qté</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Prix Unit.</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-sm text-gray-900">{item.description}</td>
                    <td className="py-3 px-2 text-sm text-center text-gray-700">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-right text-gray-700">
                      {Number(item.unitPrice).toFixed(3)} DT
                    </td>
                    <td className="py-3 px-2 text-sm text-right font-semibold text-gray-900">
                      {(Number(item.quantity) * Number(item.unitPrice)).toFixed(3)} DT
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="py-3 px-2 text-right font-semibold text-gray-700">
                    Sous-total HT:
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-900">
                    {Number(quote.subtotal).toFixed(3)} DT
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-2 text-right text-sm text-gray-600">
                    TVA:
                  </td>
                  <td className="py-2 px-2 text-right text-sm text-gray-700">
                    {Number(quote.taxAmount).toFixed(3)} DT
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-2 text-right text-sm text-gray-600">
                    Timbre fiscal:
                  </td>
                  <td className="py-2 px-2 text-right text-sm text-gray-700">
                    {Number(quote.timbreFiscal).toFixed(3)} DT
                  </td>
                </tr>
                <tr className="border-t-2 border-indigo-200 bg-indigo-50">
                  <td colSpan={3} className="py-3 px-2 text-right font-bold text-gray-900">
                    NET À PAYER:
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-2xl text-indigo-600">
                    {Number(quote.netAmount).toFixed(3)} DT
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {quote.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> {quote.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!action && quote.status === 'SENT' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-lg font-semibold text-blue-900 mb-2">
                  Confirmez-vous ce devis ?
                </p>
                <p className="text-sm text-blue-700">
                  Veuillez vérifier les détails de votre devis et confirmer votre accord.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="flex-1 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Confirmer le devis
                    </>
                  )}
                </button>
                <button
                  onClick={() => setAction('reject')}
                  disabled={processing}
                  className="flex-1 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  Refuser le devis
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {action === 'reject' && !success && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du refus (optionnel)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Expliquez pourquoi vous refusez ce devis..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setAction(null)}
                  disabled={processing}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Confirmer le refus'
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
