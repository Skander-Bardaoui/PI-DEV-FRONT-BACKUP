/**
 * Page des prédictions ML - Recommandations d'achat intelligentes
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useMLRecommendations, useMLHealth } from '../../../hooks/useMLPredictions';
import { PredictionResponse } from '../../../types/ml-predictions';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../../components/common/ErrorMessage';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { safeArrayAccess, isNonEmptyArray } from '../../../utils/validators';
import { safeSum } from '../../../utils/safeOperations';
import { useAIAccess } from '../../../hooks/useAIAccess';
import toast from 'react-hot-toast';

const MLPredictionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [predictionDays, setPredictionDays] = useState(30);
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'soon' | 'planned' | 'processed'>('all');
  const { hasAIAccess, loading: aiLoading } = useAIAccess();
  
  // Redirect if user doesn't have AI access
  useEffect(() => {
    if (!aiLoading && !hasAIAccess) {
      toast.error('Cette fonctionnalité nécessite le plan Premium');
      navigate('/app/purchases/orders');
    }
  }, [hasAIAccess, aiLoading, navigate]);
  
  const { data: health, isLoading: healthLoading } = useMLHealth();
  const { data: recommendations, isLoading, error, refetch } = useMLRecommendations(predictionDays);

  // Show loading or access denied
  if (aiLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasAIAccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto mt-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border-2 border-purple-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <LockClosedIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Fonctionnalité Premium</h2>
              <p className="text-gray-600">Les recommandations IA nécessitent le plan Premium</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/purchases/orders')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  // Filtrer par urgence

  const filteredRecommendations = recommendations?.recommendations?.filter((rec) => {
    if (!rec) return false;
    if (urgencyFilter === 'all') return true;
    if (urgencyFilter === 'processed') return rec.is_processed;
    if (rec.is_processed) return false; // Ne pas afficher les traitées dans les autres filtres
    return rec.urgency_level === urgencyFilter;
  });

  // Trier: urgent > soon > planned > processed
  const sortedRecommendations = filteredRecommendations?.sort((a, b) => {
    // Les traitées en dernier
    if (a.is_processed && !b.is_processed) return 1;
    if (!a.is_processed && b.is_processed) return -1;
    
    // Sinon trier par urgence
    const urgencyOrder = { urgent: 0, soon: 1, planned: 2 };
    return (urgencyOrder[a.urgency_level] ?? 2) - (urgencyOrder[b.urgency_level] ?? 2);
  });

  // Icône de tendance
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ArrowRightIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Badge d'urgence
  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      soon: 'bg-orange-100 text-orange-800 border-orange-200',
      planned: 'bg-green-100 text-green-800 border-green-200',
    };

    const labels = {
      urgent: '🔴 À COMMANDER MAINTENANT',
      soon: '🟠 COMMANDER BIENTÔT',
      planned: '🟢 PRÉVOIR LA COMMANDE',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[urgency]}`}>
        {labels[urgency]}
      </span>
    );
  };

  // Barre de confiance
  const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
    const percentage = Math.round(confidence * 100);
    const color = confidence > 0.8 ? 'bg-green-500' : confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Confiance</span>
          <span className="font-semibold">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Fonction pour créer un BC à partir d'une prédiction
  const handleCreatePO = (prediction: PredictionResponse) => {
    try {
      // Stocker les données de la prédiction dans sessionStorage
      sessionStorage.setItem('mlPrediction', JSON.stringify({
        productId: prediction.product_id,
        productName: prediction.product_name,
        quantity: Math.ceil(prediction.predicted_quantity),
        estimatedValue: prediction.estimated_value,
        urgency: prediction.urgency_level,
        recommendation: prediction.recommendation,
      }));
      
      // Rediriger vers la page des bons de commande
      navigate('/app/purchases/orders');
    } catch (error) {
      console.error('Error saving ML prediction:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            Recommandations d'Achat Intelligentes
          </h1>
          <p className="text-gray-600 mt-2">
            L'IA analyse vos ventes et vous suggère quand et combien commander
          </p>
        </div>

        {/* Status du service ML */}
        <div className="flex items-center gap-3">
          {healthLoading ? (
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-lg" />
          ) : health?.model_loaded ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">IA Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">IA Inactive</span>
            </div>
          )}
        </div>
      </div>

      {/* Guide d'utilisation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900 mb-2">💡 Comment ça marche ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-indigo-800">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-900">1</span>
                <p>L'IA analyse vos ventes passées et prédit vos besoins futurs</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-900">2</span>
                <p>Consultez les recommandations avec leur niveau d'urgence</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-900">3</span>
                <p>Cliquez sur "Créer BC" pour commander en un clic</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      {recommendations && isNonEmptyArray(recommendations.recommendations) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recommandations Actives</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {recommendations.recommendations.filter(r => r && !r.is_processed).length}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">À Commander Maintenant</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {recommendations.recommendations.filter(r => r && !r.is_processed && r.urgency_level === 'urgent').length}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur Totale Estimée</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(
                    safeSum(
                      recommendations.recommendations
                        .filter(r => r && !r.is_processed)
                        .map(r => r.estimated_value || 0)
                    ),
                    'TND'
                  )}
                </p>
              </div>
              <CurrencyDollarIcon className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Période Analysée</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {predictionDays} jours
                </p>
              </div>
              <ClockIcon className="h-10 w-10 text-gray-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filtres et contrôles */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Filtre d'urgence */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Afficher:</span>
            <div className="flex gap-2">
              {['all', 'urgent', 'soon', 'planned', 'processed'].map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgencyFilter(level as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    urgencyFilter === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'all' ? 'Toutes' : level === 'urgent' ? 'Urgentes' : level === 'soon' ? 'Prochaines' : level === 'planned' ? 'À prévoir' : 'Commandées'}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon de prédiction */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Période:</label>
            <select
              value={predictionDays}
              onChange={(e) => setPredictionDays(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={7}>7 prochains jours</option>
              <option value={14}>14 prochains jours</option>
              <option value={30}>30 prochains jours</option>
              <option value={60}>60 prochains jours</option>
              <option value={90}>90 prochains jours</option>
            </select>
          </div>

          {/* Bouton rafraîchir */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? 'Chargement...' : 'Rafraîchir'}
          </button>
        </div>
      </div>

      {/* Liste des recommandations */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Chargement des prédictions..." />
      ) : error ? (
        <ErrorMessage
          title="Erreur lors du chargement des prédictions"
          message="Vérifiez que le service ML est démarré"
          onRetry={() => refetch()}
        />
      ) : !isNonEmptyArray(sortedRecommendations) ? (
        <EmptyState
          icon={<ChartBarIcon className="h-16 w-16 text-gray-400 mb-4" aria-hidden="true" />}
          title="Aucune recommandation disponible"
          message="Assurez-vous d'avoir un historique d'achat suffisant"
        />
      ) : (
        <div className="space-y-4">
          {sortedRecommendations.map((prediction: PredictionResponse) => {
            if (!prediction) return null;
            
            return (
              <div
                key={prediction.product_id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Informations produit */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {prediction.product_name || 'Produit inconnu'}
                      </h3>
                      {prediction.is_processed ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-800 border-green-200">
                          ✅ BC créé {prediction.supplier_po_number && `(${prediction.supplier_po_number})`}
                        </span>
                      ) : (
                        getUrgencyBadge(prediction.urgency_level)
                      )}
                      {getTrendIcon(prediction.trend)}
                    </div>

                    {/* Recommandation */}
                    <p className="text-gray-700 mb-4">{prediction.recommendation || 'Aucune recommandation'}</p>

                    {/* Métriques */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Quantité prédite</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {Math.ceil(prediction.predicted_quantity || 0)} unités
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date prédite</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(prediction.predicted_date, 'short')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Jours restants</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {prediction.days_until_order || 0} jours
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valeur estimée</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(prediction.estimated_value || 0, 'TND')}
                        </p>
                      </div>
                    </div>

                    {/* Barre de confiance */}
                    <ConfidenceBar confidence={prediction.confidence || 0} />
                  </div>

                  {/* Actions */}
                  <div className="ml-6">
                    {prediction.is_processed ? (
                      <div className="text-center">
                        <div className="text-green-600 text-sm font-medium mb-1">✓ Traité</div>
                        <div className="text-xs text-gray-500">
                          {prediction.processed_at ? formatDate(prediction.processed_at, 'short') : '—'}
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleCreatePO(prediction)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Créer BC
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MLPredictionsPage;