
import { GoodsReceipt } from '@/types';
import { printDocument, fmtAmt, fmtDate, r3 } from './print-pdf.utils';
 
export const printGoodsReceipt = (gr: GoodsReceipt, businessName: string, businessMF?: string) => {
  const items    = gr.items ?? [];
  const supplier = gr.supplier_po?.supplier;
  const po       = gr.supplier_po;
  const now      = new Date().toLocaleDateString('fr-FR');
 
  const totalHT = r3(items.reduce(
    (s, i) => s + Number(i.quantity_received) * Number(i.unit_price_ht), 0,
  ));
 
  const itemRows = items.map((item, i) => {
    const lineTotal = r3(Number(item.quantity_received) * Number(item.unit_price_ht));
    const desc = item.supplier_po_item?.description ?? '—';
    return `
      <tr>
        <td class="center" style="color:#94a3b8;">${i + 1}</td>
        <td class="bold">${desc}</td>
        <td class="center green">${Number(item.quantity_received).toFixed(3)}</td>
        <td class="right">${fmtAmt(item.unit_price_ht)}</td>
        <td class="right bold">${fmtAmt(lineTotal)}</td>
      </tr>
    `;
  }).join('');
 
  // Récap vs commande (si items BC disponibles)
  const recapRows = (po?.items ?? []).map(poItem => {
    const received   = items.find(i => i.supplier_po_item_id === poItem.id);
    const receivedQty = Number(received?.quantity_received ?? 0);
    const cmd        = Number(poItem.quantity_ordered);
    const totalRec   = Number(poItem.quantity_received);
    const reliquat   = r3(cmd - totalRec);
    return `
      <tr>
        <td class="bold">${poItem.description}</td>
        <td class="center">${cmd.toFixed(3)}</td>
        <td class="center" style="color:${receivedQty > 0 ? '#16a34a' : '#94a3b8'}; font-weight:${receivedQty > 0 ? 600 : 400};">
          ${receivedQty > 0 ? receivedQty.toFixed(3) : '—'}
        </td>
        <td class="center">${totalRec.toFixed(3)}</td>
        <td class="center" style="color:${reliquat > 0 ? '#d97706' : '#16a34a'}; font-weight:600;">
          ${reliquat > 0 ? reliquat.toFixed(3) : '✓ Complet'}
        </td>
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
        <div class="doc-type">Bon de réception</div>
        <div class="doc-number">${gr.gr_number}</div>
        <div class="doc-date">Réceptionné le ${fmtDate(gr.receipt_date)}</div>
      </div>
    </div>
    <div class="header-accent"></div>
 
    <span class="status-badge status-received">Réceptionné</span>
 
    <div class="parties-grid">
      <div class="party-block">
        <div class="party-label">Fournisseur / Livreur</div>
        <div class="party-name">${supplier?.name ?? '—'}</div>
        ${supplier?.matricule_fiscal ? `<div class="party-line"><strong>MF :</strong> ${supplier.matricule_fiscal}</div>` : ''}
        ${supplier?.email ? `<div class="party-line"><strong>Email :</strong> ${supplier.email}</div>` : ''}
        ${supplier?.phone ? `<div class="party-line"><strong>Tél :</strong> ${supplier.phone}</div>` : ''}
      </div>
      <div class="party-block">
        <div class="party-label">Réceptionné par</div>
        <div class="party-name">${businessName}</div>
        ${businessMF ? `<div class="party-line"><strong>MF :</strong> ${businessMF}</div>` : ''}
        <div class="party-line"><strong>N° BR :</strong> ${gr.gr_number}</div>
        <div class="party-line"><strong>Date :</strong> ${fmtDate(gr.receipt_date)}</div>
        ${po?.po_number ? `<div class="party-line"><strong>BC source :</strong> ${po.po_number}</div>` : ''}
      </div>
    </div>
 
    <div class="section-title"><span>Articles réceptionnés</span></div>
    <table>
      <thead>
        <tr>
          <th class="center" style="width:24pt;">#</th>
          <th>Description</th>
          <th class="center" style="width:60pt;">Qté reçue</th>
          <th class="right"  style="width:70pt;">Prix unitaire HT</th>
          <th class="right"  style="width:70pt;">Total HT</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="right" style="font-weight:700; color:#3730a3;">Valeur totale reçue (HT)</td>
          <td class="right" style="font-weight:700; color:#3730a3;">${fmtAmt(totalHT)}</td>
        </tr>
      </tfoot>
    </table>
 
    ${recapRows ? `
      <div class="section-title" style="margin-top:16pt;"><span>Récapitulatif vs bon de commande</span></div>
      <table>
        <thead>
          <tr>
            <th>Article (BC)</th>
            <th class="center" style="width:55pt;">Commandé</th>
            <th class="center" style="width:60pt;">Reçu ce BR</th>
            <th class="center" style="width:60pt;">Total reçu</th>
            <th class="center" style="width:65pt;">Reliquat</th>
          </tr>
        </thead>
        <tbody>${recapRows}</tbody>
      </table>
    ` : ''}
 
    <div class="info-box" style="margin-top:14pt;">
      Ce bon de réception atteste de la conformité des marchandises reçues. Toute réclamation doit être signalée dans les 48h suivant la réception.
    </div>
 
    ${gr.notes ? `<div class="info-box"><div class="info-title">Observations</div>${gr.notes}</div>` : ''}
 
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-label">Responsable réception</div>
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
 
    <div class="doc-footer">
      <div class="footer-accent"></div>
      <span>NovaEntra — Gestion Fournisseurs & Achats</span>
      <span>${gr.gr_number}</span>
      <span>Imprimé le ${now}</span>
    </div>
  `;
 
  printDocument(html, `BR-${gr.gr_number}`);
};
 
 