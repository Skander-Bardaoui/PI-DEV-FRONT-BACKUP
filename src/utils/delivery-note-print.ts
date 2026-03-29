// src/utils/delivery-note-print.ts
// Template HTML professionnel pour les Bons de Livraison

import { DeliveryNote, DeliveryNoteStatus, DELIVERY_NOTE_STATUS_LABELS } from '@/types/delivery-note';
import { printDocument, fmtDate } from './print-pdf.utils';

// Logo SVG avec gradient purple-blue
const LOGO_SVG = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#38b2ac;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#logoGradient)"/>
  <text x="50" y="72" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="white" text-anchor="middle">N</text>
</svg>
`.trim();

const LOGO_BASE64 = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;

const STATUS_CLASS: Record<DeliveryNoteStatus, string> = {
  [DeliveryNoteStatus.PENDING]: 'status-pending',
  [DeliveryNoteStatus.DELIVERED]: 'status-received',
  [DeliveryNoteStatus.CANCELLED]: 'status-cancelled',
};

export const printDeliveryNote = (
  note: DeliveryNote,
  businessName: string,
  businessMF?: string,
  businessAddress?: string,
) => {
  const items = note.items ?? [];
  const client = note.client;
  const now = new Date().toLocaleDateString('fr-FR');

  // ── Lignes tableau ────────────────────────────────────────────────────────
  const itemRows = items.map((item, i) => {
    const deliveryStatus = Number(item.deliveredQuantity) >= Number(item.quantity) ? '✓' : 
                          Number(item.deliveredQuantity) > 0 ? '⚠' : '○';
    const statusColor = Number(item.deliveredQuantity) >= Number(item.quantity) ? '#16a34a' : 
                       Number(item.deliveredQuantity) > 0 ? '#d97706' : '#94a3b8';

    return `
      <tr>
        <td class="center" style="color:#94a3b8;">${i + 1}</td>
        <td class="bold">${item.description}</td>
        <td class="center">${Number(item.quantity).toFixed(3)}</td>
        <td class="center bold" style="color:${statusColor};">${Number(item.deliveredQuantity).toFixed(3)}</td>
        <td class="center" style="font-size:12pt; color:${statusColor};">${deliveryStatus}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!-- EN-TÊTE AVEC LOGO -->
    <div class="doc-header">
      <div style="display:flex; align-items:center; gap:12pt;">
        <img src="/logo.png" alt="Logo" style="width:40pt; height:40pt; border-radius:8pt; flex-shrink:0; display:block;" />
        <div>
          <div class="company-name">${businessName.toUpperCase()}</div>
          ${businessMF ? `<div class="company-sub">MF : ${businessMF}</div>` : ''}
          ${businessAddress ? `<div class="company-sub">${businessAddress}</div>` : ''}
        </div>
      </div>
      <div class="doc-info">
        <div class="doc-type">Bon de Livraison</div>
        <div class="doc-number">${note.deliveryNoteNumber}</div>
        <div class="doc-date">Date de livraison : ${fmtDate(note.deliveryDate)}</div>
      </div>
    </div>
    <div class="header-accent"></div>

    <!-- STATUT -->
    <span class="status-badge ${STATUS_CLASS[note.status]}">${DELIVERY_NOTE_STATUS_LABELS[note.status]}</span>

    <!-- PARTIES -->
    <div class="parties-grid">
      <div class="party-block">
        <div class="party-label">Client</div>
        <div class="party-name">${client?.name ?? '—'}</div>
        ${client?.matricule_fiscal ? `<div class="party-line"><strong>MF :</strong> ${client.matricule_fiscal}</div>` : ''}
        ${client?.address ? `<div class="party-line">${client.address}</div>` : ''}
        ${client?.email ? `<div class="party-line"><strong>Email :</strong> ${client.email}</div>` : ''}
        ${client?.phone ? `<div class="party-line"><strong>Tél :</strong> ${client.phone}</div>` : ''}
      </div>
      <div class="party-block">
        <div class="party-label">Expéditeur</div>
        <div class="party-name">${businessName}</div>
        ${businessMF ? `<div class="party-line"><strong>MF :</strong> ${businessMF}</div>` : ''}
        ${businessAddress ? `<div class="party-line">${businessAddress}</div>` : ''}
        <div class="party-line"><strong>N° BL :</strong> ${note.deliveryNoteNumber}</div>
        <div class="party-line"><strong>Date livraison :</strong> ${fmtDate(note.deliveryDate)}</div>
      </div>
    </div>

    <!-- ARTICLES LIVRÉS -->
    <div class="section-title"><span>Articles livrés</span></div>
    <table>
      <thead>
        <tr>
          <th class="center" style="width:24pt;">#</th>
          <th>Description</th>
          <th class="center" style="width:80pt;">Qté commandée</th>
          <th class="center" style="width:80pt;">Qté livrée</th>
          <th class="center" style="width:40pt;">Statut</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- NOTES -->
    ${note.notes ? `
      <div class="info-box">
        <div class="info-title">Notes</div>
        ${note.notes}
      </div>
    ` : ''}

    <!-- SIGNATURES -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-label">Livreur</div>
        <div class="sig-name">${businessName}</div>
        <div class="sig-line"></div>
        <div style="font-size:7.5pt; color:#94a3b8; margin-top:3pt;">Signature et cachet</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Réception client</div>
        <div class="sig-name">${client?.name ?? '—'}</div>
        <div class="sig-line"></div>
        <div style="font-size:7.5pt; color:#94a3b8; margin-top:3pt;">Signature et cachet</div>
      </div>
    </div>

    <!-- PIED DE PAGE -->
    <div class="doc-footer">
      <div class="footer-accent"></div>
<<<<<<< HEAD
      <span>BizManage — Gestion Commerciale</span>
=======
      <span>NovaEntra — Gestion Commerciale</span>
>>>>>>> 77bdaeb57fe17a0efb615d39e44f8dc8776a6748
      <span>${note.deliveryNoteNumber}</span>
      <span>Imprimé le ${now}</span>
    </div>
  `;

  printDocument(html, `BL-${note.deliveryNoteNumber}`);
};
