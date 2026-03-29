import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

interface AiForecastResult {
  predictedRevenue: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  churnRisks: Array<{
    clientId: string;
    clientName: string;
    lastOrderDate: string;
    orderFrequencyDrop: number;
    riskLevel: string;
  }>;
  summary: string;
  recommendations: string[];
}

const CONFIDENCE_COLORS = {
  HIGH: 'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-red-100 text-red-800 border-red-200',
};

const CONFIDENCE_LABELS = {
  HIGH: 'Haute confiance',
  MEDIUM: 'Confiance moyenne',
  LOW: 'Faible confiance',
};

export function AiForecastPanel({ businessId }: { businessId: string }) {
  const { data, isLoading, isError } = useQuery<AiForecastResult>({
    queryKey: ['ai-forecast', businessId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/businesses/${businessId}/sales/dashboard/ai-forecast`
      );
      return data;
    },
    staleTime: 1000 * 60 * 30, // re-fetch toutes les 30 min
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Prévisions IA</h3>
        </div>
        <div className="text-center text-gray-400 py-8">
          <p>Prévisions IA non disponibles</p>
          <p className="text-sm mt-2">Vérifiez la configuration GEMINI_API_KEY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Prévisions IA</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${CONFIDENCE_COLORS[data.confidence]}`}
        >
          {CONFIDENCE_LABELS[data.confidence]}
        </span>
      </div>

      {/* Revenue prediction */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-600 font-medium">CA prévu mois prochain</p>
        </div>
        <p className="text-3xl font-bold text-blue-800">
          {data.predictedRevenue.toFixed(3)} DT
        </p>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 italic">{data.summary}</p>
        </div>
      )}

      {/* Churn risks */}
      {data.churnRisks && data.churnRisks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="font-semibold text-red-600">Clients à risque</p>
          </div>
          <div className="space-y-2">
            {data.churnRisks.map((risk) => (
              <div
                key={risk.clientId}
                className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{risk.clientName}</p>
                  <p className="text-xs text-gray-500">
                    Dernier achat: {new Date(risk.lastOrderDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-red-600 font-bold text-sm">
                    -{risk.orderFrequencyDrop}%
                  </span>
                  <p className="text-xs text-gray-500">{risk.riskLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            <p className="font-semibold text-gray-700">Recommandations</p>
          </div>
          <ul className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2 items-start">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
