// src/utils/supplier-po-print.ts
// Template HTML professionnel pour le Bon de Commande


import { PO_STATUS_LABELS, POStatus, SupplierPO } from '@/types';
import { printDocument, fmtAmt, fmtDate, r3 }    from './print-pdf.utils';

const STATUS_CLASS: Record<POStatus, string> = {
  [POStatus.DRAFT]:              'status-draft',
  [POStatus.SENT]:               'status-sent',
  [POStatus.CONFIRMED]:          'status-confirmed',
  [POStatus.PARTIALLY_RECEIVED]: 'status-partial',
  [POStatus.FULLY_RECEIVED]:     'status-received',
  [POStatus.CANCELLED]:          'status-cancelled',
};

export const printSupplierPO = (po: SupplierPO, businessName: string, businessMF?: string) => {
  const items    = po.items ?? [];
  const supplier = po.supplier;
  const now      = new Date().toLocaleDateString('fr-FR');

  // ── Lignes tableau ────────────────────────────────────────────────────────
  const itemRows = items.map((item, i) => {
    const ht  = r3(Number(item.quantity_ordered) * Number(item.unit_price_ht));
    const tax = r3(ht * Number(item.tax_rate_value) / 100);
    const ttc = r3(ht + tax);
    const receivedPct = Number(item.quantity_ordered) > 0
      ? Math.round((Number(item.quantity_received) / Number(item.quantity_ordered)) * 100)
      : 0;

    return `
      <tr>
        <td class="center" style="color:#94a3b8;">${i + 1}</td>
        <td class="bold">${item.description}</td>
        <td class="center">${Number(item.quantity_ordered).toFixed(3)}</td>
        <td class="right">${fmtAmt(item.unit_price_ht)}</td>
        <td class="center">${item.tax_rate_value}%</td>
        <td class="right">${fmtAmt(ht)}</td>
        <td class="right bold">${fmtAmt(ttc)}</td>
        <td class="center">
          <span style="font-size:7.5pt; color:${receivedPct >= 100 ? '#16a34a' : receivedPct > 0 ? '#d97706' : '#94a3b8'}; font-weight:600;">
            ${Number(item.quantity_received).toFixed(3)} / ${Number(item.quantity_ordered).toFixed(3)}
            ${receivedPct >= 100 ? '✓' : ''}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!-- EN-TÊTE -->
    <div class="doc-header">
      <div style="display:flex; align-items:center; gap:12pt;">
        <img src="/logo.png" alt="Logo" style="width:40pt; height:40pt; border-radius:8pt; flex-shrink:0; display:block;" />
        <div>
          <div class="company-name">${businessName.toUpperCase()}</div>
          ${businessMF ? `<div class="company-sub">MF : ${businessMF}</div>` : ''}
        </div>
      </div>
      <div class="doc-info">
        <div class="doc-type">Bon de commande</div>
        <div class="doc-number">${po.po_number}</div>
        <div class="doc-date">Émis le ${fmtDate(po.created_at)}</div>
        ${po.expected_delivery ? `<div class="doc-date">Livraison prévue : ${fmtDate(po.expected_delivery)}</div>` : ''}
      </div>
    </div>
    <div class="header-accent"></div>

    <!-- STATUT -->
    <span class="status-badge ${STATUS_CLASS[po.status]}">${PO_STATUS_LABELS[po.status]}</span>

    <!-- PARTIES -->
    <div class="parties-grid">
      <div class="party-block">
        <div class="party-label">Fournisseur</div>
        <div class="party-name">${supplier?.name ?? '—'}</div>
        ${supplier?.matricule_fiscal ? `<div class="party-line"><strong>MF :</strong> ${supplier.matricule_fiscal}</div>` : ''}
        ${supplier?.address?.street  ? `<div class="party-line">${supplier.address.street}</div>` : ''}
        ${supplier?.address?.city    ? `<div class="party-line">${[supplier.address.postal_code, supplier.address.city, supplier.address.country].filter(Boolean).join(' — ')}</div>` : ''}
        ${supplier?.email  ? `<div class="party-line"><strong>Email :</strong> ${supplier.email}</div>` : ''}
        ${supplier?.phone  ? `<div class="party-line"><strong>Tél :</strong> ${supplier.phone}</div>` : ''}
        ${supplier?.rib    ? `<div class="party-line"><strong>RIB :</strong> ${supplier.rib}${supplier.bank_name ? ` (${supplier.bank_name})` : ''}</div>` : ''}
      </div>
      <div class="party-block">
        <div class="party-label">Commandé par</div>
        <div class="party-name">${businessName}</div>
        ${businessMF ? `<div class="party-line"><strong>MF :</strong> ${businessMF}</div>` : ''}
        <div class="party-line"><strong>N° BC :</strong> ${po.po_number}</div>
        <div class="party-line"><strong>Date :</strong> ${fmtDate(po.created_at)}</div>
        ${po.expected_delivery ? `<div class="party-line"><strong>Livraison :</strong> ${fmtDate(po.expected_delivery)}</div>` : ''}
        <div class="party-line"><strong>Délai paiement :</strong> ${supplier?.payment_terms ?? 30} jours</div>
      </div>
    </div>

    <!-- LIGNES DE COMMANDE -->
    <div class="section-title"><span>Détail de la commande</span></div>
    <table>
      <thead>
        <tr>
          <th class="center" style="width:24pt;">#</th>
          <th>Description</th>
          <th class="center" style="width:50pt;">Qté</th>
          <th class="right"  style="width:65pt;">Prix unitaire HT</th>
          <th class="center" style="width:32pt;">TVA</th>
          <th class="right"  style="width:60pt;">Total HT</th>
          <th class="right"  style="width:65pt;">Total TTC</th>
          <th class="center" style="width:60pt;">Reçu</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="5"></td>
          <td class="right">${fmtAmt(po.subtotal_ht)}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>

    <!-- TOTAUX -->
    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Sous-total HT</span>
          <span class="amount">${fmtAmt(po.subtotal_ht)}</span>
        </div>
        <div class="totals-row">
          <span class="label">TVA</span>
          <span class="amount">${fmtAmt(po.tax_amount)}</span>
        </div>
        <div class="totals-row">
          <span class="label">Timbre fiscal</span>
          <span class="amount">${fmtAmt(po.timbre_fiscal)}</span>
        </div>
        <div class="totals-net">
          <span class="label">NET À PAYER TTC</span>
          <span class="amount">${fmtAmt(po.net_amount)}</span>
        </div>
      </div>
    </div>

    <!-- NOTES -->
    ${po.notes ? `
      <div class="info-box">
        <div class="info-title">Notes</div>
        ${po.notes}
      </div>
    ` : ''}

    <!-- SIGNATURES -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-label">Responsable achats</div>
        <div class="sig-name">${businessName}</div>
        <div class="sig-line"></div>
        <div style="font-size:7.5pt; color:#94a3b8; margin-top:3pt;">Signature et cachet</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Représentant fournisseur</div>
        <div class="sig-name">${supplier?.name ?? '—'}</div>
        <div class="sig-line"></div>
        <div style="font-size:7.5pt; color:#94a3b8; margin-top:3pt;">Signature et cachet</div>
      </div>
    </div>

    <!-- PIED DE PAGE -->
    <div class="doc-footer">
      <div class="footer-accent"></div>
      <span>NovaEntra — Gestion Fournisseurs & Achats</span>
      <span>${po.po_number}</span>
      <span>Imprimé le ${now}</span>
    </div>
  `;

  printDocument(html, `BC-${po.po_number}`);
};