// src/components/purchases/SupplierAIInsightsModal.tsx
//
// Modal d'analyse IA avancée des fournisseurs
// Affiche prédictions, recommandations, patterns et benchmarks

import { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Target, BarChart3, Lightbulb } from 'lucide-react';
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
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header cohérent avec le style du site */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Analyse IA du Fournisseur</h2>
              <p className="text-sm text-gray-500">{supplierName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Analyse en cours...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {insights && (
            <div className="space-y-5">
              
              {/* Résumé IA - Style cohérent */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-indigo-900 uppercase mb-1">Résumé de l'analyse</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{insights.ai_summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-indigo-600">
                      <span>Confiance: {insights.analysis_confidence}%</span>
                      <span>•</span>
                      <span>{new Date(insights.analysis_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Niveau de risque - Style cohérent */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">Niveau de Risque</h3>
                </div>
                
                {/* Score visuel */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center border-2 ${getRiskColor(insights.risk_prediction.risk_level)}`}>
                    <span className="text-2xl font-bold">{insights.risk_prediction.risk_score}</span>
                    <span className="text-xs font-semibold opacity-70">/100</span>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold ${getRiskColor(insights.risk_prediction.risk_level)}`}>
                      {insights.risk_prediction.risk_level === 'low' && 'Faible'}
                      {insights.risk_prediction.risk_level === 'medium' && 'Moyen'}
                      {insights.risk_prediction.risk_level === 'high' && 'Élevé'}
                      {insights.risk_prediction.risk_level === 'critical' && 'Critique'}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {insights.risk_prediction.risk_level === 'low' && 'Ce fournisseur est fiable'}
                      {insights.risk_prediction.risk_level === 'medium' && 'Surveillance recommandée'}
                      {insights.risk_prediction.risk_level === 'high' && 'Action corrective nécessaire'}
                      {insights.risk_prediction.risk_level === 'critical' && 'Intervention urgente requise'}
                    </p>
                  </div>
                </div>

                {/* Points d'attention */}
                {insights.risk_prediction.risk_factors?.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-3">
                    <p className="text-xs font-semibold text-orange-900 mb-2">Points d'attention:</p>
                    <div className="flex flex-wrap gap-2">
                      {insights.risk_prediction.risk_factors.map((factor, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-white text-orange-700 rounded border border-orange-300">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Problèmes potentiels */}
                {insights.risk_prediction.predicted_issues?.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs font-semibold text-red-900 mb-2">Problèmes possibles:</p>
                    <ul className="space-y-1">
                      {insights.risk_prediction.predicted_issues.map((issue, i) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommandations - Style cohérent */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-bold text-gray-900">Actions Recommandées</h3>
                </div>
                
                <div className="space-y-3">
                  {insights.recommendations?.map((rec, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${getPriorityColor(rec.priority)}`}>
                              {rec.priority === 'urgent' && 'Urgent'}
                              {rec.priority === 'high' && 'Prioritaire'}
                              {rec.priority === 'medium' && 'Important'}
                              {rec.priority === 'low' && 'À considérer'}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">{rec.title}</p>
                        </div>
                        {rec.estimated_savings && rec.estimated_savings > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Économies</p>
                            <p className="font-bold text-green-600">{rec.estimated_savings.toFixed(0)} TND</p>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <p className="text-xs text-gray-600 italic">Impact: {rec.expected_impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tendances observées - Style cohérent */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Tendances Observées</h3>
                </div>
                
                <div className="space-y-3">
                  {insights.patterns?.map((pattern, i) => (
                    <div key={i} className={`border-l-4 rounded-r-lg p-3 ${
                      pattern.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      pattern.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <p className="font-semibold text-gray-900 mb-1">{pattern.title}</p>
                      <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                      {pattern.data_points?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pattern.data_points.map((point, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 bg-white text-gray-600 rounded border border-gray-300">
                              {point}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparaison marché - Style cohérent */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Comparaison avec le Marché</h3>
                </div>
                
                <div className="space-y-3">
                  {insights.benchmarks?.map((bench, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-gray-900">{bench.metric}</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          bench.performance === 'excellent' ? 'bg-green-100 text-green-700' :
                          bench.performance === 'good' ? 'bg-blue-100 text-blue-700' :
                          bench.performance === 'average' ? 'bg-yellow-100 text-yellow-700' :
                          bench.performance === 'below_average' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {bench.performance === 'excellent' && 'Excellent'}
                          {bench.performance === 'good' && 'Bon'}
                          {bench.performance === 'average' && 'Moyen'}
                          {bench.performance === 'below_average' && 'Faible'}
                          {bench.performance === 'poor' && 'Mauvais'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div className="bg-indigo-50 rounded p-2 border border-indigo-200">
                          <p className="text-xs text-indigo-700 font-semibold">Fournisseur</p>
                          <p className="font-bold text-indigo-900">{bench.supplier_value}</p>
                        </div>
                        <div className="bg-gray-100 rounded p-2 border border-gray-300">
                          <p className="text-xs text-gray-600 font-semibold">Moyenne</p>
                          <p className="font-semibold text-gray-700">{bench.industry_average}</p>
                        </div>
                        <div className="bg-green-50 rounded p-2 border border-green-200">
                          <p className="text-xs text-green-700 font-semibold">Top 25%</p>
                          <p className="font-semibold text-green-700">{bench.top_quartile}</p>
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
