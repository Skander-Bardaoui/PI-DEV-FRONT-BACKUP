// src/components/purchases/ThreeWayMatchModal.tsx
// Modal de rapport de contrôle de facture
// Usage : <ThreeWayMatchModal businessId={bId} invoiceId={inv.id} onClose={() => ...} />

import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Zap, FileText } from 'lucide-react';
import { useInvoiceMatch, useApplyMatch, MatchResult, MatchStatus, LineDiscrepancy } from '@/hooks/useThreeWayMatching';

// ─── Helpers visuels ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<MatchStatus, {
  label: string; icon: 'ok' | 'warn' | 'error'; bg: string; border: string; textColor: string;
}> = {
  MATCHED:        { label: 'Rapprochement validé',           icon: 'ok',    bg: '#F0FDF4', border: '#86EFAC', textColor: '#166534' },
  PARTIAL_MATCH:  { label: 'Rapprochement partiel',          icon: 'warn',  bg: '#FFFBEB', border: '#FCD34D', textColor: '#92400E' },
  MISMATCH:       { label: 'Écarts significatifs détectés',  icon: 'error', bg: '#FEF2F2', border: '#FCA5A5', textColor: '#991B1B' },
  MISSING_PO:     { label: 'Bon de commande manquant',       icon: 'warn',  bg: '#F9FAFB', border: '#D1D5DB', textColor: '#374151' },
  MISSING_GR:     { label: 'Bon de réception manquant',      icon: 'warn',  bg: '#FFFBEB', border: '#FCD34D', textColor: '#92400E' },
  OVER_INVOICED:  { label: 'Sur-facturation détectée',       icon: 'error', bg: '#FEF2F2', border: '#FCA5A5', textColor: '#991B1B' },
  UNDER_INVOICED: { label: 'Sous-facturation détectée',      icon: 'warn',  bg: '#FFFBEB', border: '#FCD34D', textColor: '#92400E' },
};

const LINE_STATUS_CONFIG: Record<LineDiscrepancy['status'], { label: string; color: string }> = {
  OK:            { label: 'Conforme',       color: '#166534' },
  PRICE_MISMATCH:{ label: 'Prix différent', color: '#991B1B' },
  QTY_MISMATCH:  { label: 'Qté différente', color: '#92400E' },
  NOT_RECEIVED:  { label: 'Non reçu',       color: '#991B1B' },
  OVER_INVOICED: { label: 'Sur-facturé',    color: '#991B1B' },
};

const fmt  = (n: number) => `${n.toFixed(3)} TND`;
const pct  = (n: number) => `${n.toFixed(2)}%`;

function StatusIcon({ type, size = 20 }: { type: 'ok' | 'warn' | 'error'; size?: number }) {
  const props = { size, className: 'flex-shrink-0' };
  if (type === 'ok')    return <CheckCircle  {...props} color="#16A34A" />;
  if (type === 'warn')  return <AlertTriangle {...props} color="#D97706" />;
  return <AlertCircle {...props} color="#DC2626" />;
}

// ─── Résumé totaux ────────────────────────────────────────────────────────────
function TotalsRow({ result }: { result: MatchResult }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
      {[
        { label: 'Montant BC',        value: fmt(result.po_total),        color: '#1E40AF' },
        { label: 'Montant reçu',      value: fmt(result.received_total),  color: '#166534' },
        { label: 'Montant facturé',   value: fmt(result.invoiced_total),  color: Math.abs(result.total_discrepancy) > 0.005 ? '#991B1B' : '#166534' },
      ].map(item => (
        <div key={item.label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', border: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 4px' }}>{item.label}</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: item.color, margin: 0, fontFamily: 'monospace' }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
interface Props {
  businessId: string;
  invoiceId:  string;
  onClose:    () => void;
}

export default function ThreeWayMatchModal({ businessId, invoiceId, onClose }: Props) {
  const { data: result, isLoading } = useInvoiceMatch(businessId, invoiceId);
  const applyMatch = useApplyMatch(businessId);
  const [applied,  setApplied]  = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  const handleApply = async () => {
    try {
      const res = await applyMatch.mutateAsync(invoiceId);
      setApplied(true);
      if (res.can_auto_approve) {
        setApplyMsg('Facture approuvée automatiquement — rapprochement validé.');
      } else if (res.should_auto_dispute) {
        setApplyMsg('Facture mise en litige automatiquement — écarts significatifs détectés.');
      }
    } catch (err: any) {
      setApplyMsg(err?.response?.data?.message ?? 'Erreur lors de l\'application.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <FileText size={20} color="#4F46E5" />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Contrôle de Facture</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Vérification automatique : BC ↔ Réception ↔ Facture</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Explication du processus */}
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0369A1', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} />
              Qu'est-ce que le contrôle de facture ?
            </p>
            <p style={{ fontSize: 12, color: '#075985', margin: '0 0 8px', lineHeight: 1.5 }}>
              Le système compare automatiquement 3 documents pour détecter les écarts :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#075985' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#0EA5E9', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>1</span>
                <span><strong>Bon de commande (BC)</strong> : Ce que vous avez commandé</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#0EA5E9', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>2</span>
                <span><strong>Bon de réception (BR)</strong> : Ce que vous avez reçu</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#0EA5E9', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>3</span>
                <span><strong>Facture fournisseur</strong> : Ce que le fournisseur vous facture</span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#0C4A6E', margin: '8px 0 0', fontStyle: 'italic' }}>
              ✓ Si tout correspond : approbation automatique possible<br/>
              ⚠ Si des écarts sont détectés : vérification manuelle recommandée
            </p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: '#6B7280', fontSize: 14 }}>Analyse en cours...</p>
            </div>
          ) : !result ? null : (
            <>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

              {/* Statut global */}
              {(() => {
                const cfg = STATUS_CONFIG[result.status];
                return (
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusIcon type={cfg.icon} size={22} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: cfg.textColor }}>{cfg.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: cfg.textColor, opacity: 0.8 }}>
                        Écart : {pct(result.discrepancy_pct)} ({fmt(Math.abs(result.total_discrepancy))})
                      </p>
                    </div>
                    {result.can_auto_approve && (
                      <span style={{ marginLeft: 'auto', padding: '3px 10px', background: '#DCFCE7', color: '#166534', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        Approbation auto possible
                      </span>
                    )}
                    {result.should_auto_dispute && (
                      <span style={{ marginLeft: 'auto', padding: '3px 10px', background: '#FEE2E2', color: '#991B1B', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        Litige auto recommandé
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Références */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Facture',    value: result.invoice_number },
                  { label: 'BC',         value: result.po_number ?? '—' },
                  { label: 'Fournisseur',value: result.supplier_name },
                  ...(result.gr_numbers.length > 0
                    ? [{ label: 'BRs', value: result.gr_numbers.join(', ') }]
                    : [{ label: 'BRs', value: 'Aucun bon de réception' }]),
                ].map(item => (
                  <div key={item.label} style={{ background: '#F3F4F6', padding: '5px 10px', borderRadius: 8 }}>
                    <span style={{ fontSize: 10, color: '#6B7280' }}>{item.label} </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <TotalsRow result={result} />

              {/* Détail par ligne */}
              {result.line_discrepancies.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Détail par ligne
                  </p>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#F9FAFB' }}>
                          {['Description', 'Qté BC', 'Qté reçue', 'P.U. HT', 'Total BC', 'Total reçu', 'Écart', 'Statut'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: 11, color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.line_discrepancies.map((line, i) => {
                          const lCfg = LINE_STATUS_CONFIG[line.status];
                          return (
                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6', background: line.status !== 'OK' ? '#FFFBF0' : '#fff' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 500 }}>{line.description}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{line.po_quantity.toFixed(3)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: line.received_quantity < line.po_quantity ? '#D97706' : '#111' }}>{line.received_quantity.toFixed(3)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{line.po_unit_price.toFixed(3)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{line.po_line_total.toFixed(3)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{line.received_total.toFixed(3)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: Math.abs(line.discrepancy_amount) > 0.005 ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
                                {line.discrepancy_amount > 0 ? '+' : ''}{line.discrepancy_amount.toFixed(3)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: line.status === 'OK' ? '#DCFCE7' : '#FEF9C3', color: lCfg.color }}>
                                  {lCfg.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Problèmes détectés */}
              {result.issues.length > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', margin: '0 0 8px' }}>Problèmes détectés</p>
                  {result.issues.map((issue, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: '#7F1D1D' }}>
                      <span style={{ flexShrink: 0 }}>•</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommandations */}
              {result.recommendations.length > 0 && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1E40AF', margin: '0 0 8px' }}>Recommandations</p>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: '#1E3A8A' }}>
                      <span style={{ flexShrink: 0 }}>→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message après action */}
              {applyMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: applied ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${applied ? '#86EFAC' : '#FCA5A5'}`, marginBottom: 12, fontSize: 13, color: applied ? '#166534' : '#991B1B' }}>
                  {applyMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose}
                  style={{ flex: 1, padding: '11px', border: '1px solid #D1D5DB', borderRadius: 10, cursor: 'pointer', background: '#fff', fontSize: 14 }}>
                  Fermer
                </button>
                {!applied && (result.can_auto_approve || result.should_auto_dispute) && (
                  <button
                    onClick={handleApply}
                    disabled={applyMatch.isPending}
                    style={{
                      flex: 2, padding: '11px', border: 'none', borderRadius: 10, cursor: 'pointer',
                      background: result.can_auto_approve ? '#16A34A' : '#EF4444',
                      color: '#fff', fontWeight: 600, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: applyMatch.isPending ? 0.6 : 1,
                    }}
                  >
                    <Zap size={16} />
                    {applyMatch.isPending
                      ? 'En cours...'
                      : result.can_auto_approve
                        ? 'Approuver automatiquement'
                        : 'Mettre en litige automatiquement'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}