// src/pages/backoffice/purchases/SupplierIntelligencePage.tsx
// Performance Fournisseurs: Scoring + IA dans une expérience unifiée

import { useState } from 'react';
import { Award, TrendingUp, TrendingDown, Minus, RefreshCw, Sparkles, AlertTriangle, Target, Brain, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSupplierRanking, ScoreGrade, SupplierRanking } from '@/hooks/useSupplierScoring';
import { useQueryClient } from '@tanstack/react-query';
import SupplierAIInsightsModal from '@/components/purchases/SupplierAIInsightsModal';

type SortField = 'rank' | 'supplier_name' | 'total_score' | 'grade';
type SortDir   = 'asc' | 'desc';

const GRADE_CONFIG: Record<ScoreGrade, { bg: string; color: string; border: string; label: string }> = {
  A: { bg: 'bg-green-50', color: 'text-green-700', border: 'border-green-200', label: 'Excellent' },
  B: { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200', label: 'Bon' },
  C: { bg: 'bg-yellow-50', color: 'text-yellow-700', border: 'border-yellow-200', label: 'Moyen' },
  D: { bg: 'bg-orange-50', color: 'text-orange-700', border: 'border-orange-200', label: 'Insuffisant' },
  F: { bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', label: 'Mauvais' },
};

function ScoreDisplay({ score, grade }: { score: number; grade: ScoreGrade }) {
  const gcfg = GRADE_CONFIG[grade];
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[100px]">
        <div
          className={`h-2 rounded-full transition-all ${
            grade === 'A' ? 'bg-green-500' : 
            grade === 'B' ? 'bg-blue-500' : 
            grade === 'C' ? 'bg-yellow-500' : 
            grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-900 min-w-[40px]">
        {score}
      </span>
    </div>
  );
}

function EnhancedRankingRow({
  item,
  onViewAI,
  hasAIAccess,
}: {
  item: SupplierRanking;
  onViewAI: (id: string, name: string) => void;
  hasAIAccess?: boolean;
}) {
  const gcfg = GRADE_CONFIG[item.grade];
  const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
  const trendColor = item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-400';

  // Indicateurs visuels de risque basés sur le score
  const riskLevel = item.total_score >= 85 ? 'low' : item.total_score >= 70 ? 'medium' : item.total_score >= 55 ? 'high' : 'critical';
  const riskConfig = {
    low: { icon: Target, color: 'text-green-600', bg: 'bg-green-50', label: 'Fiable', border: 'border-green-200' },
    medium: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'À surveiller', border: 'border-yellow-200' },
    high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Risque', border: 'border-orange-200' },
    critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Critique', border: 'border-red-200' },
  };
  const risk = riskConfig[riskLevel];
  const RiskIcon = risk.icon;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Rang avec médaille */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            item.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md' :
            item.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
            item.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
            'bg-gray-100 text-gray-700'
          }`}>
            {item.rank}
          </div>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
      </td>

      {/* Fournisseur avec indicateur de risque */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-900 text-sm">{item.supplier_name}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${risk.bg} ${risk.color} ${risk.border} border w-fit`}>
            <RiskIcon className="h-3 w-3" />
            {risk.label}
          </span>
        </div>
      </td>

      {/* Score avec barre de progression */}
      <td className="px-4 py-4">
        <ScoreDisplay score={item.total_score} grade={item.grade} />
      </td>

      {/* Grade badge */}
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full ${gcfg.bg} ${gcfg.color} ${gcfg.border} border`}>
          {item.grade} — {gcfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-center">
          {hasAIAccess && (
            <button
              onClick={() => onViewAI(item.supplier_id, item.supplier_name)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Analyse IA détaillée"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function SupplierIntelligencePage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const qc = useQueryClient();

  const { data: ranking = [], isLoading } = useSupplierRanking(businessId);

  const [aiModal, setAiModal] = useState<{ id: string; name: string } | null>(null);
  const [gradeFilter, setGradeFilter] = useState<ScoreGrade | ''>('');
  const [viewMode, setViewMode] = useState<'all' | 'top' | 'risk'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // ── Tri ───────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir,   setSortDir]   = useState<SortDir>('asc');

  const filtered = gradeFilter
    ? ranking.filter(r => r.grade === gradeFilter)
    : viewMode === 'top'
    ? ranking.slice(0, 5)
    : viewMode === 'risk'
    ? ranking.filter(r => r.total_score < 55)
    : ranking;

  // ── Tri local ─────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    let va: any, vb: any;
    if (sortField === 'grade') {
      // Ordre alphabétique pour les grades
      va = a.grade;
      vb = b.grade;
    } else {
      va = a[sortField];
      vb = b[sortField];
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedData = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1); // Reset à la page 1 lors du tri
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField === field) {
      return sortDir === 'asc' 
        ? <ChevronUp className="h-3 w-3 inline ml-1" /> 
        : <ChevronDown className="h-3 w-3 inline ml-1" />;
    }
    return <span className="h-3 w-3 inline ml-1 opacity-30">↕</span>;
  };

  const grades: Record<ScoreGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  ranking.forEach(r => grades[r.grade]++);

  const avgScore = ranking.length > 0
    ? Math.round(ranking.reduce((s, r) => s + r.total_score, 0) / ranking.length)
    : 0;

  const topPerformers = ranking.filter(r => r.total_score >= 85).length;
  const atRisk = ranking.filter(r => r.total_score < 55).length;

  return (
    <div className="space-y-6">

      {/* Header simplifié et cohérent */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Fournisseurs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {ranking.length} fournisseur(s) analysé(s) • Scoring automatique + IA
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Recalculer
        </button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Score Moyen</p>
              <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
              <p className="text-xs text-gray-400 mt-1">Sur 100</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Brain className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Top Performers</p>
              <p className="text-3xl font-bold text-green-600">{topPerformers}</p>
              <p className="text-xs text-gray-400 mt-1">Score ≥ 85</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">À Risque</p>
              <p className="text-3xl font-bold text-orange-600">{atRisk}</p>
              <p className="text-xs text-gray-400 mt-1">Score &lt; 55</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              gradeFilter || viewMode !== 'all'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres {(gradeFilter || viewMode !== 'all') && '(actifs)'}
          </button>
        </div>
      </div>

      {/* Filtres dépliables */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col gap-4">
            {/* Filtres par grade */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Filtrer par grade</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(['A', 'B', 'C', 'D', 'F'] as ScoreGrade[]).map(g => {
                  const gcfg = GRADE_CONFIG[g];
                  return (
                    <button
                      key={g}
                      onClick={() => { setGradeFilter(f => f === g ? '' : g); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        gradeFilter === g
                          ? `${gcfg.bg} ${gcfg.color} ${gcfg.border}`
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {g} ({grades[g]})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modes de vue */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Vue rapide</label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Tous les fournisseurs', icon: Brain },
                  { value: 'top', label: 'Top 5', icon: Award },
                  { value: 'risk', label: 'À Risque (< 55)', icon: AlertTriangle },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setViewMode(value as any); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border ${
                      viewMode === value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(gradeFilter || viewMode !== 'all') && (
            <button
              onClick={() => { setGradeFilter(''); setViewMode('all'); setPage(1); }}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-500 text-sm">Analyse en cours...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Award className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun fournisseur à afficher</p>
            <p className="text-gray-400 text-sm mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    { label: 'Rang',        field: 'rank'          as SortField },
                    { label: 'Fournisseur', field: 'supplier_name' as SortField },
                    { label: 'Score',       field: 'total_score'   as SortField },
                  ].map(col => (
                    <th key={col.field}
                      onClick={() => toggleSort(col.field)}
                      className="text-left px-4 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors">
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                  <th 
                    onClick={() => toggleSort('grade')}
                    className="text-left px-4 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors">
                    Grade<SortIcon field="grade" />
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map(item => (
                  <EnhancedRankingRow
                    key={item.supplier_id}
                    item={item}
                    onViewAI={(id, name) => setAiModal({ id, name })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {sorted.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-500">
              {sorted.length} fournisseur(s) — page {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {/* Bouton première page */}
              <button 
                onClick={() => setPage(1)} 
                disabled={page === 1}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                «
              </button>

              {/* Bouton précédent */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Précédent
              </button>

              {/* Numéros de pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1
                )
                .map((p, index, arr) => (
                  <span key={p} className="flex items-center">
                    {index > 0 && arr[index - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 border rounded-lg text-sm transition-colors ${
                        page === p
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}

              {/* Bouton suivant */}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Suivant
              </button>

              {/* Bouton dernière page */}
              <button 
                onClick={() => setPage(totalPages)} 
                disabled={page >= totalPages}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {aiModal && (
        <SupplierAIInsightsModal
          businessId={businessId}
          supplierId={aiModal.id}
          supplierName={aiModal.name}
          onClose={() => setAiModal(null)}
        />
      )}
    </div>
  );
}
