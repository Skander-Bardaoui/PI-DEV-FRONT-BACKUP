// src/pages/backoffice/purchases/SupplierRankingPage.tsx
// Route : /app/documents/purchases/supplier-ranking
// Ajouter dans votre router : <Route path="supplier-ranking" element={<SupplierRankingPage />} />

import { useState } from 'react';
import { Award, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useAuth }               from '../../../hooks/useAuth';
import { useSupplierRanking, ScoreGrade, SupplierRanking } from '@/hooks/useSupplierScoring';
import { useQueryClient }        from '@tanstack/react-query';
import SupplierScoreModal        from '@/components/purchases/SupplierScoreModal';

// ─── Config grade ─────────────────────────────────────────────────────────────
const GRADE_CONFIG: Record<ScoreGrade, { bg: string; color: string; border: string; label: string }> = {
  A: { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', label: 'Excellent'   },
  B: { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', label: 'Bon'         },
  C: { bg: '#FEFCE8', color: '#854D0E', border: '#FDE047', label: 'Moyen'       },
  D: { bg: '#FFF7ED', color: '#9A3412', border: '#FDBA74', label: 'Insuffisant' },
  F: { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5', label: 'Mauvais'     },
};

// ─── Score ring SVG ───────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: ScoreGrade }) {
  const gcfg = GRADE_CONFIG[grade];
  const r    = 20;
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

// ─── Ligne classement ─────────────────────────────────────────────────────────
function RankingRow({
  item, onViewScore,
}: {
  item: SupplierRanking;
  onViewScore: (id: string, name: string) => void;
}) {
  const gcfg = GRADE_CONFIG[item.grade];

  const TrendIcon = item.trend === 'up'   ? TrendingUp
                  : item.trend === 'down' ? TrendingDown
                  : Minus;
  const trendColor = item.trend === 'up' ? '#16A34A' : item.trend === 'down' ? '#DC2626' : '#9CA3AF';

  return (
    <tr
      onClick={() => onViewScore(item.supplier_id, item.supplier_name)}
      style={{ cursor: 'pointer' }}
      className="hover:bg-gray-50 transition-colors"
    >
      {/* Rang */}
      <td className="px-4 py-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: item.rank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][item.rank - 1] : '#F3F4F6',
            color: item.rank <= 3 ? '#fff' : '#374151',
          }}>
            {item.rank}
          </span>
          <TrendIcon size={14} color={trendColor} />
        </div>
      </td>

      {/* Fournisseur */}
      <td className="px-4 py-4">
        <p className="font-medium text-gray-900 text-sm">{item.supplier_name}</p>
      </td>

      {/* Score ring */}
      <td className="px-4 py-4">
        <ScoreRing score={item.total_score} grade={item.grade} />
      </td>

      {/* Barre de score */}
      <td className="px-4 py-4" style={{ minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, background: gcfg.color,
              width: `${item.total_score}%`,
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: gcfg.color, minWidth: 32 }}>
            {item.total_score}
          </span>
        </div>
      </td>

      {/* Grade badge */}
      <td className="px-4 py-4 text-center">
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: gcfg.bg, color: gcfg.color, border: `1px solid ${gcfg.border}`,
        }}>
          {item.grade} — {gcfg.label}
        </span>
      </td>

      {/* Action */}
      <td className="px-4 py-4 text-center">
        <button
          onClick={e => { e.stopPropagation(); onViewScore(item.supplier_id, item.supplier_name); }}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Voir détail →
        </button>
      </td>
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SupplierRankingPage() {
  const { user }   = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const qc         = useQueryClient();

  const { data: ranking = [], isLoading } = useSupplierRanking(businessId);

  const [scoreModal, setScoreModal] = useState<{ id: string; name: string } | null>(null);
  const [gradeFilter, setGradeFilter] = useState<ScoreGrade | ''>('');

  const filtered = gradeFilter
    ? ranking.filter(r => r.grade === gradeFilter)
    : ranking;

  const grades: Record<ScoreGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  ranking.forEach(r => grades[r.grade]++);

  const avgScore = ranking.length > 0
    ? Math.round(ranking.reduce((s, r) => s + r.total_score, 0) / ranking.length)
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scoring Fournisseurs</h1>
          <p className="text-gray-500 text-sm">{ranking.length} fournisseur(s) évalué(s)</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] })}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Recalculer
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Score moyen</p>
          <p className="text-2xl font-bold text-indigo-600">{avgScore}</p>
        </div>
        {(['A','B','C','D','F'] as ScoreGrade[]).map(g => {
          const gcfg = GRADE_CONFIG[g];
          return (
            <div key={g}
              onClick={() => setGradeFilter(f => f === g ? '' : g)}
              style={{ cursor: 'pointer', border: `1px solid ${gradeFilter === g ? gcfg.color : '#E5E7EB'}`, background: gradeFilter === g ? gcfg.bg : '#fff' }}
              className="rounded-xl p-4 transition-all"
            >
              <p style={{ color: gcfg.color }} className="text-xs mb-1 font-medium">{gcfg.label}</p>
              <p style={{ color: gcfg.color }} className="text-2xl font-bold">{grades[g]}</p>
              <p className="text-xs text-gray-400">Grade {g}</p>
            </div>
          );
        })}
      </div>

      {/* Tableau classement */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Award className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Aucun fournisseur à afficher</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Rang', 'Fournisseur', 'Score', 'Performance', 'Grade', 'Détail'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-sm font-semibold text-gray-900">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <RankingRow
                    key={item.supplier_id}
                    item={item}
                    onViewScore={(id, name) => setScoreModal({ id, name })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal score détaillé */}
      {scoreModal && (
        <SupplierScoreModal
          businessId={businessId}
          supplierId={scoreModal.id}
          supplierName={scoreModal.name}
          onClose={() => setScoreModal(null)}
        />
      )}
    </div>
  );
}