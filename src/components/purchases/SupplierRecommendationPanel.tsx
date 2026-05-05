// src/components/purchases/SupplierRecommendationPanel.tsx
import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { useAIAccess } from '@/hooks/useAIAccess';

interface SupplierRecommendation {
  supplier_id: string;
  supplier_name: string;
  score: number;
  rank: number;
  
  avg_price: number;
  price_competitiveness: number;
  delivery_reliability: number;
  quality_score: number;
  dispute_rate: number;
  
  total_orders: number;
  total_disputes: number;
  avg_delivery_days: number;
  last_order_date: string | null;
  
  recommendation_strength: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  explanation: string;
  pros: string[];
  cons: string[];
}

interface Props {
  businessId: string;
  selectedSupplierId?: string;
  onSelectSupplier: (supplierId: string) => void;
  productName?: string;
  category?: string;
}

export default function SupplierRecommendationPanel({
  businessId,
  selectedSupplierId,
  onSelectSupplier,
  productName,
  category,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { hasAIAccess, loading: aiLoading } = useAIAccess();

  const { data: recommendations, isLoading } = useQuery<SupplierRecommendation[]>({
    queryKey: ['supplier-recommendations', businessId, productName, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productName) params.append('product', productName);
      if (category) params.append('category', category);
      
      const response = await axiosInstance.get(
        `/businesses/${businessId}/suppliers/recommendations/ai?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasAIAccess && !aiLoading, // Only fetch if user has AI access
  });

  // Don't show anything if user doesn't have AI access
  if (aiLoading) {
    return null;
  }

  if (!hasAIAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-indigo-700 font-medium">
            {productName 
              ? `🤖 L'IA analyse les fournisseurs pour : ${productName}...`
              : '🤖 L\'IA analyse les fournisseurs...'
            }
          </span>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const topRecommendation = recommendations[0];
  const selectedRecommendation = recommendations.find(r => r.supplier_id === selectedSupplierId);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-indigo-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                🤖 Recommandation IA
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                  {recommendations.length} fournisseurs analysés
                </span>
              </h3>
              <p className="text-xs text-indigo-700 mt-0.5">
                {productName 
                  ? `Analyse basée sur l'historique pour : ${productName}`
                  : 'Basé sur le scoring, prix, délais et historique de litiges'
                }
              </p>
            </div>
          </div>
          <button className="text-indigo-600 hover:text-indigo-800">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Top Recommendation */}
          <div className="bg-white rounded-lg p-4 border-2 border-green-500 shadow-md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-gray-900">
                    {topRecommendation.supplier_name}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    #1 RECOMMANDÉ
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {topRecommendation.explanation}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="text-3xl font-bold text-green-600">
                  {topRecommendation.score}
                </div>
                <div className="text-xs text-gray-500">Score global</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <MetricCard
                icon={<DollarSign className="h-4 w-4" />}
                label="Prix"
                value={
                  topRecommendation.price_competitiveness < -10
                    ? '💰 Très compétitif'
                    : topRecommendation.price_competitiveness < 0
                    ? '✅ Compétitif'
                    : topRecommendation.price_competitiveness < 10
                    ? '➖ Moyen'
                    : '⚠️ Cher'
                }
                color={
                  topRecommendation.price_competitiveness < 0 ? 'green' : 
                  topRecommendation.price_competitiveness < 10 ? 'yellow' : 'red'
                }
              />
              <MetricCard
                icon={<Clock className="h-4 w-4" />}
                label="Livraison"
                value={`${topRecommendation.avg_delivery_days}j`}
                color={
                  topRecommendation.avg_delivery_days <= 3 ? 'green' :
                  topRecommendation.avg_delivery_days <= 7 ? 'yellow' : 'red'
                }
              />
              <MetricCard
                icon={<CheckCircle className="h-4 w-4" />}
                label="Fiabilité"
                value={`${topRecommendation.delivery_reliability}%`}
                color={
                  topRecommendation.delivery_reliability >= 90 ? 'green' :
                  topRecommendation.delivery_reliability >= 75 ? 'yellow' : 'red'
                }
              />
              <MetricCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Litiges"
                value={`${topRecommendation.dispute_rate.toFixed(1)}%`}
                color={
                  topRecommendation.dispute_rate <= 5 ? 'green' :
                  topRecommendation.dispute_rate <= 15 ? 'yellow' : 'red'
                }
              />
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {topRecommendation.pros.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-green-800 mb-2">✅ Points forts</div>
                  <ul className="space-y-1">
                    {topRecommendation.pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="text-xs text-green-700">• {pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {topRecommendation.cons.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-800 mb-2">⚠️ Points faibles</div>
                  <ul className="space-y-1">
                    {topRecommendation.cons.slice(0, 3).map((con, i) => (
                      <li key={i} className="text-xs text-red-700">• {con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Button */}
            {selectedSupplierId !== topRecommendation.supplier_id && (
              <button
                onClick={() => onSelectSupplier(topRecommendation.supplier_id)}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                ✨ Choisir ce fournisseur
              </button>
            )}
          </div>

          {/* Comparison with selected supplier */}
          {selectedRecommendation && selectedRecommendation.supplier_id !== topRecommendation.supplier_id && (
            <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-bold text-gray-900">
                  Comparaison avec votre choix : {selectedRecommendation.supplier_name}
                </span>
              </div>
              
              <ComparisonRow
                label="Score global"
                recommended={topRecommendation.score}
                selected={selectedRecommendation.score}
                unit=""
                higherIsBetter
              />
              <ComparisonRow
                label="Prix"
                recommended={topRecommendation.price_competitiveness}
                selected={selectedRecommendation.price_competitiveness}
                unit="%"
                higherIsBetter={false}
                formatter={(v) => v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`}
              />
              <ComparisonRow
                label="Taux de litiges"
                recommended={topRecommendation.dispute_rate}
                selected={selectedRecommendation.dispute_rate}
                unit="%"
                higherIsBetter={false}
              />
              <ComparisonRow
                label="Délai livraison"
                recommended={topRecommendation.avg_delivery_days}
                selected={selectedRecommendation.avg_delivery_days}
                unit="j"
                higherIsBetter={false}
              />

              <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>💡 Conseil IA :</strong> {generateComparison(topRecommendation, selectedRecommendation)}
                </p>
              </div>
            </div>
          )}

          {/* Other suppliers */}
          {recommendations.length > 1 && (
            <details className="bg-white rounded-lg border border-gray-200">
              <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium text-sm text-gray-700">
                Voir les {recommendations.length - 1} autres fournisseurs
              </summary>
              <div className="p-3 pt-0 space-y-2">
                {recommendations.slice(1).map((rec) => (
                  <div
                    key={rec.supplier_id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSupplierId === rec.supplier_id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onSelectSupplier(rec.supplier_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            #{rec.rank} {rec.supplier_name}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStrengthBadge(rec.recommendation_strength)}`}>
                            {getStrengthLabel(rec.recommendation_strength)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{rec.explanation}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900">{rec.score}</div>
                        <div className="text-xs text-gray-500">score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricCard({ icon, label, value, color }: any) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function ComparisonRow({ label, recommended, selected, unit, higherIsBetter, formatter }: any) {
  const diff = recommended - selected;
  const isBetter = higherIsBetter ? diff > 0 : diff < 0;
  
  const displayRecommended = formatter ? formatter(recommended) : `${recommended}${unit}`;
  const displaySelected = formatter ? formatter(selected) : `${selected}${unit}`;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-green-600">{displayRecommended}</span>
        <span className="text-gray-400">vs</span>
        <span className="text-sm font-medium text-orange-600">{displaySelected}</span>
        {isBetter ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
      </div>
    </div>
  );
}

// Helper Functions
function generateComparison(top: SupplierRecommendation, selected: SupplierRecommendation): string {
  const priceDiff = ((selected.price_competitiveness - top.price_competitiveness) / 100) * 100;
  const disputeDiff = selected.dispute_rate - top.dispute_rate;
  
  if (priceDiff > 20 && disputeDiff > 10) {
    return `${selected.supplier_name} est ${priceDiff.toFixed(0)}% plus cher et a ${disputeDiff.toFixed(0)}x plus de litiges que ${top.supplier_name}.`;
  } else if (priceDiff > 20) {
    return `${selected.supplier_name} est ${priceDiff.toFixed(0)}% plus cher que ${top.supplier_name}, mais avec un historique similaire.`;
  } else if (disputeDiff > 10) {
    return `${selected.supplier_name} a ${disputeDiff.toFixed(0)}x plus de litiges que ${top.supplier_name}, malgré des prix similaires.`;
  } else {
    return `${top.supplier_name} offre un meilleur équilibre prix/qualité/fiabilité selon notre analyse.`;
  }
}

function getStrengthBadge(strength: string): string {
  switch (strength) {
    case 'HIGHLY_RECOMMENDED':
      return 'bg-green-100 text-green-700 border border-green-300';
    case 'RECOMMENDED':
      return 'bg-blue-100 text-blue-700 border border-blue-300';
    case 'ACCEPTABLE':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    case 'NOT_RECOMMENDED':
      return 'bg-red-100 text-red-700 border border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300';
  }
}

function getStrengthLabel(strength: string): string {
  switch (strength) {
    case 'HIGHLY_RECOMMENDED':
      return '⭐ Fortement recommandé';
    case 'RECOMMENDED':
      return '✅ Recommandé';
    case 'ACCEPTABLE':
      return '➖ Acceptable';
    case 'NOT_RECOMMENDED':
      return '⚠️ Non recommandé';
    default:
      return 'Inconnu';
  }
}
