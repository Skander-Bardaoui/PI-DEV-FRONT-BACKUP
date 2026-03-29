// src/pages/backoffice/purchases/SupplierIntelligencePage.tsx
// Intelligence Fournisseurs: Scoring + IA dans une expérience unifiée

import { useState } from 'react';
import { Award, TrendingUp, TrendingDown, Minus, RefreshCw, Sparkles, AlertTriangle, Target, Brain, Zap } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useSupplierRanking, ScoreGrade, SupplierRanking } from '@/hooks/useSupplierScoring';
import { useQueryClient } from '@tanstack/react-query';
import SupplierAIInsightsModal from '@/components/purchases/SupplierAIInsightsModal';

const GRADE_CONFIG: Record<ScoreGrade, { bg: string; color: string; border: string; label: string }> = {
  A: { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', label: 'Excellent' },
  B: { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', label: 'Bon' },
  C: { bg: '#FEFCE8', color: '#854D0E', border: '#FDE047', label: 'Moyen' },
  D: { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74', label: 'Insuffisant' },
  F: { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5', label: 'Mauvais' },
};

function ScoreRing({ score, grade }: { score: number; grade: ScoreGrade }) {
  const gcfg = GRADE_CONFIG[grade];
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E7EB" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={gcfg.color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: gcfg.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: gcfg.color, fontWeight: 600 }}>{grade}</span>
      </div>
    </div>
  );
}

function EnhancedRankingRow({
  item,
  onViewAI,
}: {
  item: SupplierRanking;
  onViewAI: (id: string, name: string) => void;
}) {
  const gcfg = GRADE_CONFIG[item.grade];
  const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
  const trendColor = item.trend === 'up' ? '#16A34A' : item.trend === 'down' ? '#DC2626' : '#9CA3AF';

  // Indicateurs visuels de risque basés sur le score
  const riskLevel = item.total_score >= 85 ? 'low' : item.total_score >= 70 ? 'medium' : item.total_score >= 55 ? 'high' : 'critical';
  const riskConfig = {
    low: { icon: Target, color: '#16A34A', bg: '#F0FDF4', label: 'Fiable' },
    medium: { icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB', label: 'À surveiller' },
    high: { icon: AlertTriangle, color: '#F97316', bg: '#FFF7ED', label: 'Risque' },
    critical: { icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2', label: 'Critique' },
  };
  const risk = riskConfig[riskLevel];
  const RiskIcon = risk.icon;

  return (
    <tr className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200 group">
      {/* Rang avec médaille */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            background: item.rank <= 3 ? ['linear-gradient(135deg, #FFD700, #FFA500)', 'linear-gradient(135deg, #C0C0C0, #808080)', 'linear-gradient(135deg, #CD7F32, #8B4513)'][item.rank - 1] : '#F3F4F6',
            color: item.rank <= 3 ? '#fff' : '#374151',
            boxShadow: item.rank <= 3 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
          }}>
            {item.rank}
          </span>
          <TrendIcon size={16} color={trendColor} strokeWidth={2.5} />
        </div>
      </td>

      {/* Fournisseur avec indicateur de risque */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{item.supplier_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                background: risk.bg, color: risk.color, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <RiskIcon size={10} />
                {risk.label}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Score ring */}
      <td className="px-4 py-4">
        <ScoreRing score={item.total_score} grade={item.grade} />
      </td>

      {/* Barre de score améliorée */}
      <td className="px-4 py-4" style={{ minWidth: 180 }}>
        <div className="flex items-center gap-3">
          <div style={{ flex: 1, height: 10, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              background: `linear-gradient(90deg, ${gcfg.color}, ${gcfg.color}dd)`,
              width: `${item.total_score}%`,
              boxShadow: `0 0 10px ${gcfg.color}40`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: gcfg.color, minWidth: 36 }}>
            {item.total_score}
          </span>
        </div>
      </td>

      {/* Grade badge amélioré */}
      <td className="px-4 py-4 text-center">
        <span style={{
          padding: '6px 16px', borderRadius: 24, fontSize: 12, fontWeight: 700,
          background: gcfg.bg, color: gcfg.color, border: `2px solid ${gcfg.border}`,
          boxShadow: `0 2px 8px ${gcfg.color}20`,
        }}>
          {item.grade} — {gcfg.label}
        </span>
      </td>

      {/* Actions - icône simple avec tooltip */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-center">
          <button
            onClick={e => { e.stopPropagation(); onViewAI(item.supplier_id, item.supplier_name); }}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Score IA"
          >
            <Sparkles size={18} />
          </button>
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

  const filtered = gradeFilter
    ? ranking.filter(r => r.grade === gradeFilter)
    : viewMode === 'top'
    ? ranking.slice(0, 5)
    : viewMode === 'risk'
    ? ranking.filter(r => r.total_score < 55)
    : ranking;

  const grades: Record<ScoreGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  ranking.forEach(r => grades[r.grade]++);

  const avgScore = ranking.length > 0
    ? Math.round(ranking.reduce((s, r) => s + r.total_score, 0) / ranking.length)
    : 0;

  const topPerformers = ranking.filter(r => r.total_score >= 85).length;
  const atRisk = ranking.filter(r => r.total_score < 55).length;

  return (
    <div className="space-y-6">

      {/* Header avec couleurs douces */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Intelligence Fournisseurs</h1>
            </div>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              {ranking.length} fournisseur(s) analysé(s) • Scoring + IA
            </p>
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-all border border-gray-200 text-gray-700 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Recalculer
          </button>
        </div>

        {/* KPIs dans le header - couleurs très douces */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
            <p className="text-xs text-gray-600 mb-1 font-medium">Score Moyen</p>
            <p className="text-3xl font-bold text-indigo-600">{avgScore}</p>
            <p className="text-xs text-gray-500 mt-1">Sur 100</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1 font-medium">
              <Award size={12} className="text-green-600" /> Top Performers
            </p>
            <p className="text-3xl font-bold text-green-600">{topPerformers}</p>
            <p className="text-xs text-gray-500 mt-1">Score ≥ 85</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm">
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1 font-medium">
              <AlertTriangle size={12} className="text-orange-600" /> À Risque
            </p>
            <p className="text-3xl font-bold text-orange-600">{atRisk}</p>
            <p className="text-xs text-gray-500 mt-1">Score &lt; 55</p>
          </div>
        </div>
      </div>

      {/* Filtres et vues */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filtres par grade */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Filtrer:</span>
          {(['A', 'B', 'C', 'D', 'F'] as ScoreGrade[]).map(g => {
            const gcfg = GRADE_CONFIG[g];
            return (
              <button
                key={g}
                onClick={() => setGradeFilter(f => f === g ? '' : g)}
                style={{
                  border: `2px solid ${gradeFilter === g ? gcfg.color : '#E5E7EB'}`,
                  background: gradeFilter === g ? gcfg.bg : '#fff',
                  color: gradeFilter === g ? gcfg.color : '#6B7280',
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
              >
                {g} ({grades[g]})
              </button>
            );
          })}
        </div>

        {/* Modes de vue */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'all', label: 'Tous', icon: Award },
            { value: 'top', label: 'Top 5', icon: Zap },
            { value: 'risk', label: 'À Risque', icon: AlertTriangle },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setViewMode(value as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1 ${
                viewMode === value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau amélioré */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
            <p className="text-gray-500 text-sm">Analyse en cours...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Award className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Aucun fournisseur à afficher</p>
            <p className="text-gray-300 text-sm mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  {['Rang', 'Fournisseur', 'Score', 'Performance', 'Grade', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
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
