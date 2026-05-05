import { AlertTriangle, Users, Loader2, AlertCircle, TrendingDown } from 'lucide-react';
import { useHighRiskClients } from '../../hooks/useSalesML';

interface HighRiskClientsWidgetProps {
  businessId: string;
}

export function HighRiskClientsWidget({ businessId }: HighRiskClientsWidgetProps) {
  const { data: clients, isLoading, error } = useHighRiskClients(businessId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Analyse de churn non disponible</h3>
        </div>
        <p className="text-sm text-gray-600">
          Service ML indisponible ou données insuffisantes.
        </p>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Clients à Risque</h3>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-600">Aucun client à risque détecté</p>
          <p className="text-sm text-gray-500 mt-1">Tous vos clients sont actifs</p>
        </div>
      </div>
    );
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Risque élevé
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
            Risque moyen
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Risque faible
          </span>
        );
    }
  };

  const highRiskCount = clients.filter(c => c.risk_level === 'high').length;
  const mediumRiskCount = clients.filter(c => c.risk_level === 'medium').length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Clients à Risque (IA)
        </h3>
        <div className="flex items-center gap-2">
          {highRiskCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
              {highRiskCount} urgent{highRiskCount > 1 ? 's' : ''}
            </span>
          )}
          {mediumRiskCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
              {mediumRiskCount} moyen{mediumRiskCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {clients.slice(0, 10).map((client) => (
          <div
            key={client.client_id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">Client {client.client_id.slice(0, 8)}</span>
                  {getRiskBadge(client.risk_level)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingDown className="h-4 w-4" />
                  <span>Score: {(client.churn_risk_score * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>{client.days_since_last_purchase} jours d'inactivité</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
              {client.recommendation}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
              <div>
                <span className="font-medium">Intervalle moyen:</span> {client.average_purchase_interval.toFixed(0)} jours
              </div>
              <div>
                <span className="font-medium">Fréquence:</span> {client.purchase_frequency_per_month.toFixed(1)}/mois
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Affichage de 10 clients sur {clients.length}
        </div>
      )}
    </div>
  );
}
