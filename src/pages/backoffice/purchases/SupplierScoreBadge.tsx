// src/components/purchases/SupplierScoreBadge.tsx
// Badge de score à afficher dans SuppliersPage
// Usage : <SupplierScoreBadge businessId={businessId} supplierId={supplier.id} />

import { useSupplierScore, ScoreGrade } from '@/hooks/useSupplierScoring';

const GRADE_COLORS: Record<ScoreGrade, { bg: string; color: string }> = {
  A: { bg: '#DCFCE7', color: '#166534' },
  B: { bg: '#DBEAFE', color: '#1E40AF' },
  C: { bg: '#FEF9C3', color: '#854D0E' },
  D: { bg: '#FFEDD5', color: '#9A3412' },
  F: { bg: '#FEE2E2', color: '#991B1B' },
};

interface Props {
  businessId:  string;
  supplierId:  string;
  onClick?:    () => void;
}

export default function SupplierScoreBadge({ businessId, supplierId, onClick }: Props) {
  const { data: score, isLoading } = useSupplierScore(businessId, supplierId);

  if (isLoading) return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#F3F4F6', color: '#9CA3AF' }}>
      ...
    </span>
  );

  if (!score) return null;

  const cfg = GRADE_COLORS[score.grade];

  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: cfg.bg, color: cfg.color, border: 'none', cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}
      title={`Score : ${score.total_score}/100`}
    >
      {score.grade}
      <span style={{ fontWeight: 400, opacity: 0.8 }}>{score.total_score}</span>
    </button>
  );
}