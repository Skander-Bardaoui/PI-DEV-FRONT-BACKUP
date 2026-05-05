import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useSalesForecast } from '../../hooks/useSalesML';

interface SalesForecastWidgetProps {
  businessId: string;
  forecastDays?: number;
}

export function SalesForecastWidget({ businessId, forecastDays = 30 }: SalesForecastWidgetProps) {
  const { data: forecast, isLoading, error } = useSalesForecast(businessId, forecastDays);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Prévisions IA non disponibles</h3>
        </div>
        <p className="text-sm text-gray-600">
          Données insuffisantes ou service ML indisponible. Minimum 3 factures payées requises.
        </p>
      </div>
    );
  }

  if (!forecast) return null;

  const getTrendIcon = () => {
    switch (forecast.trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (forecast.trend) {
      case 'increasing':
        return 'text-green-600 bg-green-50';
      case 'decreasing':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendText = () => {
    switch (forecast.trend) {
      case 'increasing':
        return 'En hausse';
      case 'decreasing':
        return 'En baisse';
      default:
        return 'Stable';
    }
  };

  const confidencePercent = Math.round(forecast.confidence * 100);
  const confidenceColor = confidencePercent >= 70 ? 'text-green-600' : confidencePercent >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Prévisions IA - {forecastDays} jours
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">{getTrendText()}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">CA Prévu</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {forecast.predicted_sales.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} DT
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {forecast.predicted_daily_avg.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} DT/jour
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">CA Actuel</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {forecast.current_daily_avg.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} DT
          </p>
          <p className="text-xs text-purple-600 mt-1">Moyenne journalière</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Taux de croissance</span>
          <span className={`font-semibold ${forecast.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {forecast.growth_rate >= 0 ? '+' : ''}{forecast.growth_rate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Confiance de la prédiction</span>
          <span className={`font-semibold ${confidenceColor}`}>
            {confidencePercent}%
          </span>
        </div>

        {forecast.best_selling_days.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">Meilleurs jours: </span>
            <span className="font-medium text-gray-900">
              {forecast.best_selling_days.slice(0, 3).join(', ')}
            </span>
          </div>
        )}

        {forecast.seasonality_detected && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded px-3 py-2">
            <AlertCircle className="h-4 w-4" />
            <span>Saisonnalité détectée dans les ventes</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Recommandation: </span>
          {forecast.recommendation}
        </p>
      </div>
    </div>
  );
}
