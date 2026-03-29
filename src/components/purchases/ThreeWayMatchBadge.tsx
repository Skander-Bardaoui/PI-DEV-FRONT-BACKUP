// src/components/purchases/ThreeWayMatchBadge.tsx
// Badge de statut rapprochement — à afficher dans PurchaseInvoicesPage
// Usage : <ThreeWayMatchBadge status="MATCHED" />

import { MatchStatus } from '@/hooks/useThreeWayMatching';

const CONFIG: Record<MatchStatus, { label: string; bg: string; color: string; dot: string }> = {
  MATCHED:        { label: 'Rapproché',        bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  PARTIAL_MATCH:  { label: 'Partiel',           bg: '#FAEEDA', color: '#854F0B', dot: '#EF9F27' },
  MISMATCH:       { label: 'Écart détecté',     bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A' },
  MISSING_PO:     { label: 'Sans BC',           bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  MISSING_GR:     { label: 'Sans réception',    bg: '#FAEEDA', color: '#854F0B', dot: '#EF9F27' },
  OVER_INVOICED:  { label: 'Sur-facturé',       bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A' },
  UNDER_INVOICED: { label: 'Sous-facturé',      bg: '#FAEEDA', color: '#854F0B', dot: '#EF9F27' },
};

export default function ThreeWayMatchBadge({ status }: { status: MatchStatus }) {
  const cfg = CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}