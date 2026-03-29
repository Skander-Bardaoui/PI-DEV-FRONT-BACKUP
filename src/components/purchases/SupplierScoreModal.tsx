// src/components/purchases/SupplierScoreModal.tsx
import { X, TrendingUp, Award } from 'lucide-react';
import { useSupplierScore, ScoreGrade, ScoreCriteria } from '@/hooks/useSupplierScoring';

// ─── Config grade ─────────────────────────────────────────────────────────────
const GRADE_CONFIG: Record<ScoreGrade, { bg: string; color: string; label: string }> = {
  A: { bg: '#DCFCE7', color: '#166534', label: 'Excellent'    },
  B: { bg: '#DBEAFE', color: '#1E40AF', label: 'Bon'          },
  C: { bg: '#FEF9C3', color: '#854D0E', label: 'Moyen'        },
  D: { bg: '#FFEDD5', color: '#9A3412', label: 'Insuffisant'  },
  F: { bg: '#FEE2E2', color: '#991B1B', label: 'Mauvais'      },
};

// ─── Barre de score ───────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: color,
          width: `${Math.min(100, score)}%`, transition: 'width .6s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  );
}

// ─── Carte critère ────────────────────────────────────────────────────────────
function CriteriaCard({ c }: { c: ScoreCriteria }) {
  const color = c.score >= 80 ? '#16A34A' : c.score >= 60 ? '#D97706' : '#DC2626';
  return (
    <div style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{c.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>{c.detail}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Poids {c.weight}%</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color }}>{c.label}</p>
        </div>
      </div>
      <ScoreBar score={c.score} color={color} />
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
interface Props {
  businessId:  string;
  supplierId:  string;
  supplierName?: string;
  onClose:     () => void;
}

export default function SupplierScoreModal({ businessId, supplierId, supplierName, onClose }: Props) {
  const { data: score, isLoading } = useSupplierScore(businessId, supplierId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, background: '#fff' }}>
          <Award size={20} color="#4F46E5" />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Score fournisseur</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>{supplierName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ color: '#6B7280', fontSize: 14 }}>Calcul du score...</p>
            </div>
          ) : score ? (
            <>
              {/* Score global */}
              {(() => {
                const gcfg = GRADE_CONFIG[score.grade];
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px', background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)', borderRadius: 12, marginBottom: 20, border: '1px solid #E5E7EB' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: gcfg.bg, border: `3px solid ${gcfg.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: gcfg.color, lineHeight: 1 }}>{score.grade}</span>
                      <span style={{ fontSize: 10, color: gcfg.color, fontWeight: 500 }}>{gcfg.label}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 36, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{score.total_score}</span>
                        <span style={{ fontSize: 16, color: '#6B7280' }}>/100</span>
                      </div>
                      <div style={{ height: 10, background: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 5,
                          background: score.total_score >= 85 ? '#16A34A' : score.total_score >= 70 ? '#2563EB' : score.total_score >= 55 ? '#D97706' : '#DC2626',
                          width: `${score.total_score}%`,
                        }} />
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6B7280' }}>
                        Calculé le {new Date(score.computed_at).toLocaleDateString('fr-TN')}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Critères détaillés */}
              <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Détail par critère
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {score.criteria.map((c, i) => <CriteriaCard key={i} c={c} />)}
              </div>

              {/* Stats clés */}
              <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Statistiques
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'BCs total',         value: score.stats.total_pos ?? 0,             unit: ''    },
                  { label: 'Taux livraison',     value: score.stats.delivery_rate_pct ?? 0,     unit: '%'   },
                  { label: 'Livraisons à temps', value: score.stats.on_time_rate_pct ?? 0,      unit: '%'   },
                  { label: 'Litiges',            value: score.stats.disputed_invoices ?? 0,     unit: ''    },
                  { label: 'Total facturé',      value: (score.stats.total_invoiced ?? 0).toFixed(0), unit: ' TND' },
                  { label: 'Délai paiement',     value: score.stats.avg_payment_days ?? 0,      unit: 'j'   },
                ].map(s => (
                  <div key={s.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{s.label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      {s.value}{s.unit}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}