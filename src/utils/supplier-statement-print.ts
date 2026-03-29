// src/utils/supplier-statement-print.ts
import { INVOICE_STATUS_LABELS, InvoiceStatus, PO_STATUS_LABELS, PurchaseInvoice, Supplier, SupplierPO } from '@/types';
import { printDocument, fmtAmt, fmtDateShort, r3 } from './print-pdf.utils';

export const printSupplierStatement = (
  supplier:     Supplier,
  pos:          SupplierPO[],
  invoices:     PurchaseInvoice[],
  businessName: string,
  businessMF?:  string,
) => {
  const now         = new Date().toLocaleDateString('fr-FR');
  const totalAchats = r3(invoices.reduce((s, i) => s + Number(i.net_amount), 0));
  const totalPaye   = r3(invoices.reduce((s, i) => s + Number(i.paid_amount), 0));
  const totalDu     = r3(totalAchats - totalPaye);
  const overdueAmt  = r3(invoices
    .filter(i => i.status === InvoiceStatus.OVERDUE)
    .reduce((s, i) => s + r3(Number(i.net_amount) - Number(i.paid_amount)), 0));

  const poRows = pos.map(po => `
    <tr>
      <td class="mono bold">${po.po_number}</td>
      <td class="center">${fmtDateShort(po.created_at)}</td>
      <td>${PO_STATUS_LABELS[po.status]}</td>
      <td class="right bold">${fmtAmt(po.net_amount)}</td>
    </tr>
  `).join('');

  const invRows = invoices.map(inv => {
    const rem     = r3(Number(inv.net_amount) - Number(inv.paid_amount));
    const isODue  = inv.status === InvoiceStatus.OVERDUE;
    const isPaid  = inv.status === InvoiceStatus.PAID;
    return `
      <tr>
        <td class="mono bold">${inv.invoice_number_supplier}</td>
        <td class="center">${fmtDateShort(inv.invoice_date)}</td>
        <td class="center" style="${isODue ? 'color:#dc2626;font-weight:600;' : ''}">${fmtDateShort(inv.due_date)}</td>
        <td>${INVOICE_STATUS_LABELS[inv.status]}</td>
        <td class="right">${fmtAmt(inv.net_amount)}</td>
        <td class="right green">${fmtAmt(inv.paid_amount)}</td>
        <td class="right ${isPaid ? 'green' : isODue ? 'red' : 'orange'}">${fmtAmt(rem)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div class="doc-header">
      <div>
        <div class="company-name">${businessName.toUpperCase()}</div>
        ${businessMF ? `<div class="company-sub">MF : ${businessMF}</div>` : ''}
      </div>
      <div class="doc-info">
        <div class="doc-type">Relevé de compte fournisseur</div>
        <div class="doc-number">${supplier.name}</div>
        <div class="doc-date">Au ${now}</div>
      </div>
    </div>
    <div class="header-accent"></div>

    <!-- FICHE FOURNISSEUR -->
    <div class="party-block" style="margin-bottom:14pt;">
      <div class="party-label">Fournisseur</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8pt;">
        <div>
          <div class="party-name">${supplier.name}</div>
          ${supplier.matricule_fiscal ? `<div class="party-line"><strong>MF :</strong> ${supplier.matricule_fiscal}</div>` : ''}
          ${supplier.email ? `<div class="party-line"><strong>Email :</strong> ${supplier.email}</div>` : ''}
          ${supplier.phone ? `<div class="party-line"><strong>Tél :</strong> ${supplier.phone}</div>` : ''}
        </div>
        <div>
          ${supplier.rib ? `<div class="party-line"><strong>RIB :</strong> ${supplier.rib}</div>` : ''}
          ${supplier.bank_name ? `<div class="party-line"><strong>Banque :</strong> ${supplier.bank_name}</div>` : ''}
          <div class="party-line"><strong>Délai paiement :</strong> ${supplier.payment_terms} jours</div>
          <div class="party-line"><strong>${pos.length} BC(s)</strong> · <strong>${invoices.length} facture(s)</strong></div>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8pt; margin-bottom:14pt;">
      <div style="background:#eef2ff; border:0.5pt solid #c7d2fe; border-radius:6pt; padding:8pt; text-align:center;">
        <div style="font-size:7.5pt; color:#4338ca; font-weight:600; margin-bottom:4pt;">Total achats</div>
        <div style="font-size:10pt; font-weight:700; color:#1e1b4b;">${fmtAmt(totalAchats)}</div>
      </div>
      <div style="background:#dcfce7; border:0.5pt solid #86efac; border-radius:6pt; padding:8pt; text-align:center;">
        <div style="font-size:7.5pt; color:#166534; font-weight:600; margin-bottom:4pt;">Total payé</div>
        <div style="font-size:10pt; font-weight:700; color:#14532d;">${fmtAmt(totalPaye)}</div>
      </div>
      <div style="background:${totalDu > 0 ? '#fef9c3' : '#dcfce7'}; border:0.5pt solid ${totalDu > 0 ? '#fde047' : '#86efac'}; border-radius:6pt; padding:8pt; text-align:center;">
        <div style="font-size:7.5pt; color:${totalDu > 0 ? '#854d0e' : '#166534'}; font-weight:600; margin-bottom:4pt;">Solde dû</div>
        <div style="font-size:10pt; font-weight:700; color:${totalDu > 0 ? '#713f12' : '#14532d'};">${fmtAmt(totalDu)}</div>
      </div>
      <div style="background:${overdueAmt > 0 ? '#fee2e2' : '#dcfce7'}; border:0.5pt solid ${overdueAmt > 0 ? '#fca5a5' : '#86efac'}; border-radius:6pt; padding:8pt; text-align:center;">
        <div style="font-size:7.5pt; color:${overdueAmt > 0 ? '#991b1b' : '#166534'}; font-weight:600; margin-bottom:4pt;">En retard</div>
        <div style="font-size:10pt; font-weight:700; color:${overdueAmt > 0 ? '#7f1d1d' : '#14532d'};">${fmtAmt(overdueAmt)}</div>
      </div>
    </div>

    <!-- TABLEAU BCs -->
    ${pos.length > 0 ? `
      <div class="section-title"><span>Bons de commande (${pos.length})</span></div>
      <table>
        <thead><tr>
          <th style="width:90pt;">N° BC</th>
          <th class="center" style="width:65pt;">Date</th>
          <th>Statut</th>
          <th class="right" style="width:80pt;">Net TTC</th>
        </tr></thead>
        <tbody>${poRows}</tbody>
        <tfoot><tr>
          <td colspan="3" class="right">Total BCs</td>
          <td class="right">${fmtAmt(pos.reduce((s, p) => s + Number(p.net_amount), 0))}</td>
        </tr></tfoot>
      </table>
    ` : ''}

    <!-- TABLEAU FACTURES -->
    ${invoices.length > 0 ? `
      <div class="section-title" style="margin-top:14pt;"><span>Factures fournisseur (${invoices.length})</span></div>
      <table>
        <thead><tr>
          <th>N° Facture</th>
          <th class="center" style="width:55pt;">Date</th>
          <th class="center" style="width:55pt;">Échéance</th>
          <th>Statut</th>
          <th class="right" style="width:65pt;">Net TTC</th>
          <th class="right" style="width:55pt;">Payé</th>
          <th class="right" style="width:60pt;">Solde dû</th>
        </tr></thead>
        <tbody>${invRows}</tbody>
        <tfoot><tr>
          <td colspan="4" class="right">SOLDE TOTAL</td>
          <td class="right">${fmtAmt(totalAchats)}</td>
          <td class="right" style="color:#16a34a;">${fmtAmt(totalPaye)}</td>
          <td class="right" style="color:${totalDu > 0 ? '#d97706' : '#16a34a'};">${fmtAmt(totalDu)}</td>
        </tr></tfoot>
      </table>
    ` : ''}

    ${totalDu <= 0 ? `
      <div class="info-box" style="margin-top:12pt;">
        Compte soldé — Aucun montant en attente pour ce fournisseur.
      </div>
    ` : overdueAmt > 0 ? `
      <div class="info-box danger" style="margin-top:12pt;">
        <div class="info-title">⚠ Attention</div>
        Solde dû : ${fmtAmt(totalDu)} dont ${fmtAmt(overdueAmt)} en retard de paiement.
      </div>
    ` : `
      <div class="info-box warning" style="margin-top:12pt;">
        Solde restant dû : <strong>${fmtAmt(totalDu)}</strong>. Aucune facture en retard.
      </div>
    `}

    <div class="doc-footer">
      <div class="footer-accent"></div>
      <span>NovaEntra — Relevé de compte fournisseur</span>
      <span>${supplier.name}</span>
      <span>Imprimé le ${now}</span>
    </div>
  `;

  printDocument(html, `RELEVE-${supplier.name.replace(/\s+/g, '-')}`);
};


