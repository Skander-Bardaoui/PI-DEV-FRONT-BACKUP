// src/utils/sales-order-print.ts
// Template HTML professionnel pour les Commandes Client (Sales Orders)

import { SalesOrder, SalesOrderStatus } from '@/types/sales-order';
import { printDocument, fmtAmt, fmtDate } from './print-pdf.utils';

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

const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.CONFIRMED]: 'Confirmée',
  [SalesOrderStatus.IN_PROGRESS]: 'En cours',
  [SalesOrderStatus.DELIVERED]: 'Livrée',
  [SalesOrderStatus.INVOICED]: 'Facturée',
  [SalesOrderStatus.CANCELLED]: 'Annulée',
};

const STATUS_CLASS: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.CONFIRMED]: 'status-confirmed',
  [SalesOrderStatus.IN_PROGRESS]: 'status-partial',
  [SalesOrderStatus.DELIVERED]: 'status-received',
  [SalesOrderStatus.INVOICED]: 'status-paid',
  [SalesOrderStatus.CANCELLED]: 'status-cancelled',
};

export const printSalesOrder = (
  order: SalesOrder,
  businessName: string,
  businessMF?: string,
  businessAddress?: string,
) => {
  const items = order.items ?? [];
  const client = order.client;
  const now = new Date().toLocaleDateString('fr-FR');

  // ── Lignes tableau ────────────────────────────────────────────────────────
  const itemRows = items.map((item, i) => {
    const ht = Number(item.quantity) * Number(item.unitPrice);
    const tax = ht * (Number(item.taxRate) / 100);
    const total = ht + tax;

    return `
      <tr>
        <td class="center" style="color:#94a3b8;">${i + 1}</td>
        <td class="bold">${item.description}</td>
        <td class="center">${Number(item.quantity).toFixed(3)}</td>
        <td class="right">${fmtAmt(item.unitPrice)}</td>
        <td class="center">${item.taxRate}%</td>
        <td class="right bold">${fmtAmt(ht)}</td>
        <td class="right bold">${fmtAmt(tax)}</td>
        <td class="right bold">${fmtAmt(total)}</td>
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
        <div class="doc-type">Commande Client</div>
        <div class="doc-number">${order.orderNumber}</div>
        <div class="doc-date">Émis le ${fmtDate(order.orderDate)}</div>
        ${order.expectedDelivery ? `<div class="doc-date">Livraison prévue : ${fmtDate(order.expectedDelivery)}</div>` : ''}
      </div>
    </div>
    <div class="header-accent"></div>

    <!-- STATUT -->
    <span class="status-badge ${STATUS_CLASS[order.status]}">${SALES_ORDER_STATUS_LABELS[order.status]}</span>

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
        <div class="party-label">Fournisseur</div>
        <div class="party-name">${businessName}</div>
        ${businessMF ? `<div class="party-line"><strong>MF :</strong> ${businessMF}</div>` : ''}
        ${businessAddress ? `<div class="party-line">${businessAddress}</div>` : ''}
        <div class="party-line"><strong>N° Commande :</strong> ${order.orderNumber}</div>
        <div class="party-line"><strong>Date :</strong> ${fmtDate(order.orderDate)}</div>
        ${order.expectedDelivery ? `<div class="party-line"><strong>Livraison :</strong> ${fmtDate(order.expectedDelivery)}</div>` : ''}
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
          <th class="right" style="width:65pt;">Prix unitaire</th>
          <th class="center" style="width:40pt;">TVA</th>
          <th class="right" style="width:60pt;">Total HT</th>
          <th class="right" style="width:60pt;">TVA</th>
          <th class="right" style="width:70pt;">Total TTC</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- TOTAUX -->
    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Sous-total HT</span>
          <span class="amount">${fmtAmt(order.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span class="label">TVA</span>
          <span class="amount">${fmtAmt(order.taxAmount)}</span>
        </div>
        <div class="totals-row">
          <span class="label">Timbre fiscal</span>
          <span class="amount">${fmtAmt(order.timbreFiscal || 1.000)}</span>
        </div>
        <div class="totals-net">
          <span class="label">NET À PAYER TTC</span>
          <span class="amount">${fmtAmt(order.netAmount)}</span>
        </div>
      </div>
    </div>

    <!-- NOTES -->
    ${order.notes ? `
      <div class="info-box">
        <div class="info-title">Notes</div>
        ${order.notes}
      </div>
    ` : ''}

    <!-- SIGNATURES -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-label">Pour l'entreprise</div>
        <div class="sig-name">${businessName}</div>
        <div class="sig-line"></div>
        <div style="font-size:7.5pt; color:#94a3b8; margin-top:3pt;">Signature et cachet</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Acceptation client</div>
        <div class="sig-name">${client?.name ?? '—'}</div>
        <div class="sig-line"></div>
        <div style="font-size:7.5pt; color:#94a3b8; margin-top:3pt;">Signature et cachet</div>
      </div>
    </div>

    <!-- PIED DE PAGE -->
    <div class="doc-footer">
      <div class="footer-accent"></div>
      <span>NovaEntra — Gestion Commerciale</span>
      <span>${order.orderNumber}</span>
      <span>Imprimé le ${now}</span>
    </div>
  `;

  printDocument(html, `Commande-${order.orderNumber}`);
};
