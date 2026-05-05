/**
 * Widget ML - Affichage compact des prédictions sur le dashboard
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useMLRecommendations } from '../../hooks/useMLPredictions';

const MLPredictionWidget: React.FC = () => {
  const { data: recommendations, isLoading, error } = useMLRecommendations(30);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-bold text-gray-900">Prédictions ML</h3>
        </div>
        <p className="text-sm text-red-600">Service ML indisponible</p>
      </div>
    );
  }

  const urgentRecommendations = recommendations?.recommendations.filter(
    (rec) => rec.urgency_level === 'urgent'
  ) || [];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Prédictions ML</h3>
        </div>
        <Link
          to="/backoffice/purchases/ml-predictions"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          Voir tout
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-2xl font-bold text-indigo-600">
            {recommendations?.total_recommendations || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-red-200">
          <p className="text-xs text-gray-600">Urgent</p>
          <p className="text-2xl font-bold text-red-600">
            {recommendations?.urgent_count || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-green-200">
          <p className="text-xs text-gray-600">Valeur</p>
          <p className="text-lg font-bold text-green-600">
            {(recommendations?.total_estimated_value || 0).toFixed(0)} TND
          </p>
        </div>
      </div>

      {/* Recommandations urgentes */}
      {urgentRecommendations.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-sm font-semibold text-gray-900">
              Commandes urgentes ({urgentRecommendations.length})
            </p>
          </div>
          {urgentRecommendations.slice(0, 3).map((rec) => (
            <div
              key={rec.product_id}
              className="bg-white border border-red-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {rec.product_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Commander {rec.predicted_quantity.toFixed(0)} unités d'ici{' '}
                    {rec.days_until_order} jours
                  </p>
                </div>
                <span className="text-xs font-semibold text-red-600">
                  🔴 {rec.days_until_order}j
                </span>
              </div>
            </div>
          ))}
          {urgentRecommendations.length > 3 && (
            <Link
              to="/backoffice/purchases/ml-predictions"
              className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-2"
            >
              Voir {urgentRecommendations.length - 3} autres urgentes
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Aucune commande urgente</p>
        </div>
      )}
    </div>
  );
};

export default MLPredictionWidget;