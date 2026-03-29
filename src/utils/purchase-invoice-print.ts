import { INVOICE_STATUS_LABELS, InvoiceStatus, PurchaseInvoice } from '@/types';
import { fmtAmt, fmtDate, printDocument, r3 } from './print-pdf.utils';
 
const INV_STATUS_CLASS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]:        'status-pending',
  [InvoiceStatus.APPROVED]:       'status-approved',
  [InvoiceStatus.PARTIALLY_PAID]: 'status-partial',
  [InvoiceStatus.PAID]:           'status-received',
  [InvoiceStatus.OVERDUE]:        'status-overdue',
  [InvoiceStatus.DISPUTED]:       'status-disputed',
  [InvoiceStatus.CANCELLED]:       'status-disputed',

};
 
export const printPurchaseInvoice = (
  invoice:      PurchaseInvoice,
  businessName: string,
  businessMF?:  string,
) => {
  const supplier   = invoice.supplier;
  const now        = new Date().toLocaleDateString('fr-FR');
  const paidAmount = Number(invoice.paid_amount);
  const netAmount  = Number(invoice.net_amount);
  const remaining  = r3(netAmount - paidAmount);
  const paidPct    = netAmount > 0 ? Math.min(Math.round((paidAmount / netAmount) * 100), 100) : 0;
  const isOverdue  = invoice.status === InvoiceStatus.OVERDUE;
  const isDisputed = invoice.status === InvoiceStatus.DISPUTED;
  const taxRate    = Number(invoice.subtotal_ht) > 0
    ? Math.round((Number(invoice.tax_amount) / Number(invoice.subtotal_ht)) * 100)
    : 0;
 
  const html = `
    <div class="doc-header">
      <div>
        <div class="company-name">${businessName.toUpperCase()}</div>
        ${businessMF ? `<div class="company-sub">MF : ${businessMF}</div>` : ''}
      </div>
      <div class="doc-info">
        <div class="doc-type">Facture fournisseur</div>
        <div class="doc-number">${invoice.invoice_number_supplier}</div>
        <div class="doc-date">Émise le ${fmtDate(invoice.invoice_date)}</div>
        <div class="doc-date" style="${isOverdue ? 'color:#fca5a5;' : ''}">
          Échéance : ${fmtDate(invoice.due_date)}
          ${isOverdue ? ' ⚠ RETARD' : ''}
        </div>
      </div>
    </div>
    <div class="header-accent"></div>
 
    <span class="status-badge ${INV_STATUS_CLASS[invoice.status]}">${INVOICE_STATUS_LABELS[invoice.status]}</span>
 
    ${isOverdue ? `
      <div class="info-box danger" style="margin-bottom:10pt;">
        <div class="info-title">⚠ Facture en retard de paiement</div>
        L'échéance du ${fmtDate(invoice.due_date)} est dépassée. Reste à payer : ${fmtAmt(remaining)}.
      </div>
    ` : ''}
    ${isDisputed ? `
      <div class="info-box warning" style="margin-bottom:10pt;">
        <div class="info-title">⚠ Facture en litige</div>
        ${invoice.dispute_reason ?? 'Motif non précisé'}
      </div>
    ` : ''}
 
    <div class="parties-grid">
      <div class="party-block">
        <div class="party-label">Fournisseur</div>
        <div class="party-name">${supplier?.name ?? '—'}</div>
        ${supplier?.matricule_fiscal ? `<div class="party-line"><strong>MF :</strong> ${supplier.matricule_fiscal}</div>` : ''}
        ${supplier?.address?.street  ? `<div class="party-line">${supplier.address.street}</div>` : ''}
        ${supplier?.address?.city    ? `<div class="party-line">${[supplier.address.postal_code, supplier.address.city].filter(Boolean).join(' ')}</div>` : ''}
        ${supplier?.email ? `<div class="party-line"><strong>Email :</strong> ${supplier.email}</div>` : ''}
        ${supplier?.phone ? `<div class="party-line"><strong>Tél :</strong> ${supplier.phone}</div>` : ''}
        ${supplier?.rib   ? `<div class="party-line"><strong>RIB :</strong> ${supplier.rib}${supplier.bank_name ? ` — ${supplier.bank_name}` : ''}</div>` : ''}
      </div>
      <div class="party-block">
        <div class="party-label">Facturé à</div>
        <div class="party-name">${businessName}</div>
        ${businessMF ? `<div class="party-line"><strong>MF :</strong> ${businessMF}</div>` : ''}
        <div class="party-line"><strong>N° facture :</strong> ${invoice.invoice_number_supplier}</div>
        <div class="party-line"><strong>Date facture :</strong> ${fmtDate(invoice.invoice_date)}</div>
        <div class="party-line"><strong>Échéance :</strong> ${fmtDate(invoice.due_date)}</div>
        ${invoice.supplier_po?.po_number ? `<div class="party-line"><strong>BC associé :</strong> ${invoice.supplier_po.po_number}</div>` : ''}
        <div class="party-line"><strong>Délai paiement :</strong> ${supplier?.payment_terms ?? 30} jours</div>
      </div>
    </div>
 
    <div class="section-title"><span>Détail des montants</span></div>
    <table>
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="right" style="width:80pt;">Base HT</th>
          <th class="center" style="width:50pt;">Taux TVA</th>
          <th class="right" style="width:80pt;">Montant TVA</th>
          <th class="right" style="width:80pt;">Total TTC</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="bold">Marchandises / Prestations de services</td>
          <td class="right">${fmtAmt(invoice.subtotal_ht)}</td>
          <td class="center">${taxRate}%</td>
          <td class="right">${fmtAmt(invoice.tax_amount)}</td>
          <td class="right bold">${fmtAmt(r3(Number(invoice.subtotal_ht) + Number(invoice.tax_amount)))}</td>
        </tr>
        <tr>
          <td style="color:#64748b;">Timbre fiscal (droit de timbre)</td>
          <td class="right" style="color:#94a3b8;">—</td>
          <td class="center" style="color:#94a3b8;">—</td>
          <td class="right" style="color:#94a3b8;">—</td>
          <td class="right bold">${fmtAmt(invoice.timbre_fiscal)}</td>
        </tr>
      </tbody>
    </table>
 
    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Sous-total HT</span>
          <span class="amount">${fmtAmt(invoice.subtotal_ht)}</span>
        </div>
        <div class="totals-row">
          <span class="label">TVA (${taxRate}%)</span>
          <span class="amount">${fmtAmt(invoice.tax_amount)}</span>
        </div>
        <div class="totals-row">
          <span class="label">Timbre fiscal</span>
          <span class="amount">${fmtAmt(invoice.timbre_fiscal)}</span>
        </div>
        <div class="totals-net">
          <span class="label">NET À PAYER TTC</span>
          <span class="amount">${fmtAmt(invoice.net_amount)}</span>
        </div>
        ${paidAmount > 0 ? `
          <div class="totals-paid">
            <span class="label">Montant payé</span>
            <span class="amount">${fmtAmt(paidAmount)}</span>
          </div>
          ${remaining > 0 ? `
            <div class="totals-remain">
              <span class="label">Reste à payer</span>
              <span class="amount">${fmtAmt(remaining)}</span>
            </div>
          ` : ''}
        ` : ''}
      </div>
    </div>
 
    ${paidAmount > 0 ? `
      <div class="progress-wrap">
        <div class="progress-label">
          <span>Avancement du paiement</span>
          <span>${paidPct}% payé</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${paidPct >= 100 ? 'paid' : ''}" style="width:${paidPct}%;"></div>
        </div>
      </div>
    ` : ''}
 
    <div class="info-box" style="margin-top:14pt;">
      <div class="info-title">Conditions de paiement</div>
      Paiement à effectuer dans un délai de <strong>${supplier?.payment_terms ?? 30} jours</strong> à compter de la date de réception de la facture.
      ${supplier?.rib ? `<br>RIB : <strong>${supplier.rib}</strong>${supplier.bank_name ? ` — ${supplier.bank_name}` : ''}` : ''}
    </div>
 
    <div class="doc-footer">
      <div class="footer-accent"></div>
      <span>NovaEntra — Gestion Fournisseurs & Achats</span>
      <span>${invoice.invoice_number_supplier}</span>
      <span>Imprimé le ${now}</span>
    </div>
  `;
 
  printDocument(html, `FACT-${invoice.invoice_number_supplier}`);
};
 