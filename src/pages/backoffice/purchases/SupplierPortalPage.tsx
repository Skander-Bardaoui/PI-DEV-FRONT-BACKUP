// ══════════════════════════════════════════════════════════════════════════════
// FIX 5 — SupplierPortalPage.tsx SIMPLIFIÉ
// SUPPRIMÉ : upload facture par le fournisseur (illogique)
// GARDÉ    : confirmation/refus BC, historique lecture seule
// LOGIQUE  : le fournisseur envoie sa facture papier → business_owner l'uploade
// ══════════════════════════════════════════════════════════════════════════════

// src/pages/SupplierPortalPage.tsx — VERSION CORRIGÉE

import { useState, useEffect } from 'react';
import { useSearchParams }     from 'react-router-dom';
import {
  CheckCircle, XCircle, Package, FileText, CreditCard, AlertTriangle,
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

interface PortalData {
  supplier:   { id: string; name: string; email: string; phone?: string };
  current_po: any | null;
  pos:        any[];
  invoices:   any[];
  payments:   any[];
  stats:      { total_facture: number; total_paye: number; total_du: number; nb_pos: number; nb_invoices: number };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', SENT: 'Envoyé', CONFIRMED: 'Confirmé',
  PARTIALLY_RECEIVED: 'Partiellement reçu', FULLY_RECEIVED: 'Reçu',
  CANCELLED: 'Annulé', PENDING: 'En attente', APPROVED: 'Approuvée',
  PARTIALLY_PAID: 'Part. payée', PAID: 'Payée', OVERDUE: 'En retard', DISPUTED: 'En litige',
};

const fmt     = (n: any) => `${(+n || 0).toFixed(3)} TND`;
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('fr-TN') : '—';

function RefuseModal({ onConfirm, onCancel }: { onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 420, width: '100%' }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Motif du refus</h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Expliquez pourquoi vous refusez ce bon de commande..."
          rows={4}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
            Annuler
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()}
            style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: reason.trim() ? 1 : 0.5 }}>
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupplierPortalPage() {
  const [params]         = useSearchParams();
  const token            = params.get('token') ?? '';
  const [data,     setData]     = useState<PortalData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState<'bc' | 'invoices' | 'payments' | 'disputes'>('bc');
  const [refusing, setRefusing] = useState(false);
  const [actionMsg,setActionMsg]= useState('');
  const [actionOk, setActionOk] = useState(false);

  useEffect(() => {
    if (!token) { setError('Lien invalide ou manquant.'); setLoading(false); return; }
    axiosInstance.get(`/supplier-portal/data?token=${token}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e?.response?.data?.message ?? 'Lien expiré ou invalide.'); setLoading(false); });
  }, [token]);

  const handleConfirm = async () => {
    if (!data?.current_po) return;
    try {
      await axiosInstance.post(`/supplier-portal/confirm?token=${token}`, { po_id: data.current_po.id });
      setActionOk(true);
      // FIX : message amélioré mentionnant l'email envoyé au business_owner
      setActionMsg(
        `✓ Le bon de commande ${data.current_po.po_number} a été confirmé. ` +
        `Votre client a été notifié par email. Préparez votre livraison.`
      );
      setData(d => d ? { ...d, current_po: { ...d.current_po, status: 'CONFIRMED' } } : d);
    } catch (e: any) {
      setActionMsg(e?.response?.data?.message ?? 'Erreur lors de la confirmation.');
      setActionOk(false);
    }
  };

  const handleRefuse = async (reason: string) => {
    if (!data?.current_po) return;
    try {
      await axiosInstance.post(`/supplier-portal/refuse?token=${token}`, { po_id: data.current_po.id, reason });
      setRefusing(false);
      setActionOk(false);
      setActionMsg(
        `Le bon de commande ${data.current_po.po_number} a été refusé. ` +
        `Votre client a été notifié et sera contacté pour trouver une solution.`
      );
      setData(d => d ? { ...d, current_po: { ...d.current_po, status: 'CANCELLED' } } : d);
    } catch (e: any) {
      setActionMsg(e?.response?.data?.message ?? 'Erreur lors du refus.');
      setActionOk(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7FF' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Chargement de votre portail...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7FF' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 400, textAlign: 'center', border: '1px solid #FCA5A5' }}>
        <AlertTriangle size={40} color="#EF4444" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Lien invalide</h2>
        <p style={{ color: '#6B7280', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const po     = data.current_po;
  const canAct = po && po.status === 'SENT';

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FF', fontFamily: 'Arial, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background: '#4F46E5', padding: '16px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: '#C7D2FE' }}>Portail fournisseur</p>
            <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 700 }}>{data.supplier.name}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#C7D2FE' }}>{data.supplier.email}</p>
            {data.supplier.phone && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#C7D2FE' }}>{data.supplier.phone}</p>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {/* Message action */}
        {actionMsg && (
          <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 16, background: actionOk ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${actionOk ? '#86EFAC' : '#FCA5A5'}`, color: actionOk ? '#166534' : '#991B1B', fontSize: 14 }}>
            {actionMsg}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total facturé',  value: fmt(data.stats.total_facture), color: '#3730A3' },
            { label: 'Total payé',     value: fmt(data.stats.total_paye),    color: '#166534' },
            { label: 'Reste à payer',  value: fmt(data.stats.total_du),      color: data.stats.total_du > 0 ? '#9A3412' : '#166534' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{s.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* BC courant */}
        {po && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#F8F9FF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} color="#4F46E5" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>{po.po_number}</span>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: po.status === 'CONFIRMED' ? '#EEF2FF' : po.status === 'CANCELLED' ? '#FEF2F2' : '#DBEAFE',
                color:      po.status === 'CONFIRMED' ? '#3730A3' : po.status === 'CANCELLED' ? '#991B1B'  : '#1E40AF',
              }}>
                {STATUS_LABELS[po.status] ?? po.status}
              </span>
            </div>

            <div style={{ padding: '16px' }}>
              {/* Lignes BC */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Description','Qté','P.U. HT','TVA','Total HT'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(po.items ?? []).map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '7px 10px' }}>{item.description}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{(+item.quantity_ordered).toFixed(3)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{(+item.unit_price_ht).toFixed(3)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{item.tax_rate_value}%</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{(+item.line_total_ht).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totaux */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: canAct ? 16 : 0 }}>
                <div style={{ background: '#EEF2FF', padding: '10px 16px', borderRadius: 8, minWidth: 220 }}>
                  {[
                    ['Sous-total HT', (+po.subtotal_ht).toFixed(3)],
                    ['TVA',           (+po.tax_amount).toFixed(3)],
                    ['Timbre fiscal', '1,000'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 3 }}>
                      <span>{l}</span><span>{v} TND</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#3730A3', borderTop: '1px solid #C7D2FE', paddingTop: 6, marginTop: 4 }}>
                    <span>Net TTC</span><span>{(+po.net_amount).toFixed(3)} TND</span>
                  </div>
                </div>
              </div>

              {/* Boutons confirmation/refus */}
              {canAct && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setRefusing(true)}
                    style={{ flex: 1, padding: '11px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <XCircle size={16} /> Refuser
                  </button>
                  <button onClick={handleConfirm}
                    style={{ flex: 2, padding: '11px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle size={16} /> Confirmer le bon de commande
                  </button>
                </div>
              )}

              {/* Message instructions pour la facture (FIX : remplace le bouton upload) */}
              {po.status === 'CONFIRMED' && (
                <div style={{ marginTop: 12, padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                  <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>📄 Envoi de votre facture</p>
                  <p style={{ margin: 0 }}>
                    Veuillez envoyer votre facture directement à votre client par email ou courrier.
                    Votre client l'enregistrera dans son système après réception des marchandises.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historique — tabs */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
            {([
              ['bc',       'Bons de commande', data.stats.nb_pos],
              ['invoices', 'Factures',         data.stats.nb_invoices],
              ['payments', 'Paiements',        data.payments.length],
            ] as [typeof tab, string, number][]).map(([k, l, count]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === k ? 600 : 400, color: tab === k ? '#4F46E5' : '#6B7280', background: tab === k ? '#F0F4FF' : '#fff', borderBottom: tab === k ? '2px solid #4F46E5' : '2px solid transparent' }}>
                {l} ({count})
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px' }}>
            {tab === 'bc' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.pos.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aucun bon de commande</p>}
                {data.pos.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 13 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{p.po_number}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{fmtDate(p.created_at)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600 }}>{fmt(p.net_amount)}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#E5E7EB', color: '#374151' }}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'invoices' && (
              <div>
                <div style={{ padding: '10px 12px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, marginBottom: 10, fontSize: 12, color: '#3730A3' }}>
                  <strong>Note :</strong> Les factures ci-dessous ont été enregistrées par votre client.
                  Pour toute question, contactez votre client directement.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.invoices.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aucune facture enregistrée</p>}
                  {data.invoices.map((inv: any) => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 13 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{inv.invoice_number_supplier}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{fmtDate(inv.invoice_date)} — Éch. {fmtDate(inv.due_date)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{fmt(inv.net_amount)}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>payé {fmt(inv.paid_amount)}</p>
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: inv.status === 'PAID' ? '#DCFCE7' : inv.status === 'OVERDUE' ? '#FEE2E2' : '#EEF2FF', color: inv.status === 'PAID' ? '#166534' : inv.status === 'OVERDUE' ? '#991B1B' : '#3730A3' }}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.payments.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Aucun paiement reçu</p>}
                {data.payments.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 13 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{p.payment_number}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{fmtDate(p.payment_date)} — {p.payment_method}</p>
                      {p.reference && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#6B7280' }}>Réf: {p.reference}</p>}
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#166534', fontSize: 15 }}>{fmt(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {refusing && <RefuseModal onConfirm={handleRefuse} onCancel={() => setRefusing(false)} />}
    </div>
  );
}