// src/components/purchases/SupplierAIInsightsModal.tsx
//
// Modal d'analyse IA avancée des fournisseurs
// Affiche prédictions, recommandations, patterns et benchmarks

import { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Target, BarChart3, Lightbulb, Loader } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

interface RiskPrediction {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_factors: string[];
  predicted_issues: string[];
  confidence: number;
}

interface ActionRecommendation {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_type: string;
  title: string;
  description: string;
  expected_impact: string;
  estimated_savings?: number;
}

interface PatternInsight {
  pattern_type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  data_points: string[];
}

interface BenchmarkComparison {
  metric: string;
  supplier_value: number;
  industry_average: number;
  top_quartile: number;
  performance: string;
  gap_analysis: string;
}

interface AIInsights {
  supplier_name: string;
  analysis_date: string;
  risk_prediction: RiskPrediction;
  recommendations: ActionRecommendation[];
  patterns: PatternInsight[];
  benchmarks: BenchmarkComparison[];
  ai_summary: string;
  analysis_confidence: number;
}

interface Props {
  businessId: string;
  supplierId: string;
  supplierName: string;
  onClose: () => void;
}

export default function SupplierAIInsightsModal({ businessId, supplierId, supplierName, onClose }: Props) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/businesses/${businessId}/supplier-scoring/${supplierId}/ai-insights`
      );
      setInsights(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des insights');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceColor = (perf: string) => {
    switch (perf) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'below_average': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Analyse IA Avancée</h2>
              <p className="text-sm text-purple-100">{supplierName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Analyse en cours...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {insights && (
            <div className="space-y-6">
              
              {/* Résumé IA */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-900 mb-1">Résumé de l'analyse IA</p>
                    <p className="text-sm text-purple-800">{insights.ai_summary}</p>
                    <p className="text-xs text-purple-600 mt-2">
                      Confiance: {insights.analysis_confidence}% • 
                      Analysé le {new Date(insights.analysis_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prédiction de risques */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-bold text-gray-900">Prédiction de Risques</h3>
                </div>
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 mb-4 ${getRiskColor(insights.risk_prediction.risk_level)}`}>
                  <span className="font-bold text-lg">{insights.risk_prediction.risk_score}/100</span>
                  <span className="text-sm font-semibold uppercase">{insights.risk_prediction.risk_level}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Facteurs de risque:</p>
                    <div className="flex flex-wrap gap-2">
                      {insights.risk_prediction.risk_factors?.map((factor, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Problèmes prédits:</p>
                    <ul className="space-y-1">
                      {insights.risk_prediction.predicted_issues?.map((issue, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommandations */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-bold text-gray-900">Recommandations d'Actions</h3>
                </div>
                
                <div className="space-y-3">
                  {insights.recommendations?.map((rec, i) => (
                    <div key={i} className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded border font-semibold uppercase ${getPriorityColor(rec.priority)}`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-300">
                              {rec.action_type}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">{rec.title}</p>
                        </div>
                        {rec.estimated_savings && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Économies estimées</p>
                            <p className="font-bold text-green-600">{rec.estimated_savings.toFixed(3)} TND</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <p className="text-xs text-gray-600 italic">Impact: {rec.expected_impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patterns détectés */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Patterns Détectés</h3>
                </div>
                
                <div className="space-y-3">
                  {insights.patterns?.map((pattern, i) => (
                    <div key={i} className="border-l-4 border-blue-400 bg-blue-50 p-3 rounded-r-lg">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="font-semibold text-gray-900">{pattern.title}</p>
                        <span className={`text-xs font-semibold uppercase ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pattern.data_points?.map((point, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 bg-white text-gray-600 rounded border border-gray-300">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmarks */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Comparaison Benchmarks</h3>
                </div>
                
                <div className="space-y-3">
                  {insights.benchmarks?.map((bench, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">{bench.metric}</p>
                        <span className={`text-sm font-semibold ${getPerformanceColor(bench.performance)}`}>
                          {bench.performance}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Fournisseur</p>
                          <p className="font-bold text-gray-900">{bench.supplier_value}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Moyenne industrie</p>
                          <p className="font-semibold text-gray-700">{bench.industry_average}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Top quartile</p>
                          <p className="font-semibold text-gray-700">{bench.top_quartile}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 italic">{bench.gap_analysis}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
