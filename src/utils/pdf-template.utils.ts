// src/utils/pdf-template.utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Template PDF professionnel — Module 3 NovaEntra
// Inspiré des standards comptables tunisiens (MF, TVA, timbre fiscal)
// ─────────────────────────────────────────────────────────────────────────────
// npm install jspdf jspdf-autotable

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Palette de couleurs ───────────────────────────────────────────────────────
export const C = {
  // Couleurs principales
  navy:      [15,  23,  42]  as RGB,   // slate-900  — titres, textes forts
  dark:      [30,  41,  59]  as RGB,   // slate-800  — corps
  mid:       [71,  85, 105]  as RGB,   // slate-600  — labels
  muted:     [148, 163, 184] as RGB,   // slate-400  — hints
  light:     [241, 245, 249] as RGB,   // slate-100  — fonds
  veryLight: [248, 250, 252] as RGB,   // slate-50
  white:     [255, 255, 255] as RGB,

  // Accent indigo (couleur marque)
  accent:    [79,  70, 229]  as RGB,   // indigo-600
  accentL:   [199, 210, 254] as RGB,   // indigo-200
  accentVL:  [238, 242, 255] as RGB,   // indigo-50

  // Sémantique
  success:   [22,  163,  74] as RGB,   // green-600
  successL:  [220, 252, 231] as RGB,   // green-100
  warning:   [180, 83,    9] as RGB,   // amber-700
  warningL:  [254, 243, 199] as RGB,   // amber-100
  danger:    [185,  28,  28] as RGB,   // red-700
  dangerL:   [254, 226, 226] as RGB,   // red-100
  info:      [29, 120, 116]  as RGB,   // teal-700
  infoL:     [204, 251, 241] as RGB,   // teal-100

  // Bordures
  border:    [226, 232, 240] as RGB,   // slate-200
  borderM:   [203, 213, 225] as RGB,   // slate-300
};

type RGB = [number, number, number];

// ── Dimensions page A4 ────────────────────────────────────────────────────────
export const P = {
  W:  210,   // largeur mm
  H:  297,   // hauteur mm
  ML: 16,    // marge gauche
  MR: 16,    // marge droite
  MT: 16,    // marge haut
  MB: 20,    // marge bas
  CW: 178,   // content width = W - ML - MR
};

// ── Helpers de formatage ──────────────────────────────────────────────────────
export const fmt = {
  amount: (v: number | string): string => {
    const n = typeof v === 'string' ? parseFloat(v) || 0 : v;
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(n) + ' TND';
  },
  date: (d: string): string => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  },
  dateL: (d: string): string => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  },
  n3: (v: number | string): string => {
    const n = typeof v === 'string' ? parseFloat(v) || 0 : v;
    return (Math.round(n * 1000) / 1000).toFixed(3);
  },
};

// ── Créer le doc de base ──────────────────────────────────────────────────────
export const newDoc = (): jsPDF =>
  new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : En-tête premium
// Bandeau supérieur avec dégradé simulé + infos document
// ─────────────────────────────────────────────────────────────────────────────
export const drawPageHeader = (
  doc:          jsPDF,
  opts: {
    businessName: string;
    businessMF?:  string;
    businessAddr?: string;
    docType:      string;   // 'BON DE COMMANDE' | 'BON DE RÉCEPTION' | 'FACTURE FOURNISSEUR'
    docNumber:    string;
    docDate:      string;
    dueDate?:     string;
    statusLabel?: string;
    statusColor?: RGB;
  },
): number /* retourne Y après header */ => {
  const { ML, MR, W, MT } = P;

  // ── Fond supérieur navy ───────────────────────────────────────────────────
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, 42, 'F');

  // Accent bar (fine ligne colorée en bas du bandeau)
  doc.setFillColor(...C.accent);
  doc.rect(0, 42, W, 1.5, 'F');

  // ── Nom entreprise ────────────────────────────────────────────────────────
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(opts.businessName.toUpperCase(), ML, 16);

  // Sous-infos entreprise
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.accentL);
  const subLines: string[] = [];
  if (opts.businessMF)   subLines.push(`MF : ${opts.businessMF}`);
  if (opts.businessAddr) subLines.push(opts.businessAddr);
  if (subLines.length)   doc.text(subLines.join('   ·   '), ML, 22);

  // ── Type de document (droite) ─────────────────────────────────────────────
  doc.setTextColor(...C.accentL);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.docType, W - MR, 12, { align: 'right' });

  // N° document
  doc.setTextColor(...C.white);
  doc.setFontSize(14);
  doc.text(`N° ${opts.docNumber}`, W - MR, 22, { align: 'right' });

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.accentL);
  doc.text(`Émis le ${fmt.dateL(opts.docDate)}`, W - MR, 30, { align: 'right' });

  if (opts.dueDate) {
    doc.text(`Échéance : ${fmt.dateL(opts.dueDate)}`, W - MR, 36, { align: 'right' });
  }

  // ── Badge statut ──────────────────────────────────────────────────────────
  if (opts.statusLabel && opts.statusColor) {
    const badgeW = opts.statusLabel.length * 1.8 + 10;
    doc.setFillColor(...opts.statusColor);
    doc.roundedRect(ML, 30, badgeW, 8, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(opts.statusLabel.toUpperCase(), ML + badgeW / 2, 35.2, { align: 'center' });
  }

  doc.setTextColor(...C.dark);
  return 52; // Y de départ après le header
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Bloc parties (fournisseur ↔ acheteur)
// ─────────────────────────────────────────────────────────────────────────────
export const drawParties = (
  doc:   jsPDF,
  startY: number,
  left: {
    title:   string;
    name:    string;
    mf?:     string | null;
    address?: { street?: string; city?: string; postal_code?: string; country?: string } | null;
    email?:  string | null;
    phone?:  string | null;
    rib?:    string | null;
    bank?:   string | null;
  },
  right?: {
    title:    string;
    name:     string;
    mf?:      string | null;
    address?: string | null;
    extra?:   string | null;
  },
): number => {
  const { ML, W, MR, CW } = P;
  const colW   = right ? (CW / 2 - 4) : CW;
  const rightX = ML + CW / 2 + 4;
  let maxY     = startY;

  // ── Colonne gauche ────────────────────────────────────────────────────────
  const drawBlock = (
    x: number, y: number, w: number,
    title: string,
    lines: { label?: string; value: string; mono?: boolean }[],
  ): number => {
    // Titre bloc
    doc.setFillColor(...C.accentVL);
    doc.rect(x, y, w, 6.5, 'F');
    doc.setDrawColor(...C.accentL);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, 6.5, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.accent);
    doc.text(title.toUpperCase(), x + 3, y + 4.6);

    let ly = y + 10;
    lines.forEach(({ label, value, mono }) => {
      if (!value || value === '—') return;
      if (label) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        doc.text(label, x + 3, ly);
        doc.setTextColor(...C.dark);
        doc.setFont(mono ? 'courier' : 'helvetica', mono ? 'normal' : 'bold');
        doc.setFontSize(8);
        doc.text(value, x + 3 + 28, ly);
      } else {
        doc.setFont(mono ? 'courier' : 'helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...C.mid);
        doc.text(value, x + 3, ly);
      }
      ly += 4.8;
    });
    doc.setTextColor(...C.dark);
    return ly + 2;
  };

  const leftLines: { label?: string; value: string; mono?: boolean }[] = [
    { label: undefined, value: left.name },
  ];
  if (left.mf)              leftLines.push({ label: 'M. Fiscal :', value: left.mf, mono: true });
  if (left.address?.street) leftLines.push({ label: undefined, value: left.address.street });
  if (left.address?.city) {
    const city = [left.address.postal_code, left.address.city, left.address.country].filter(Boolean).join(' ');
    leftLines.push({ label: undefined, value: city });
  }
  if (left.email) leftLines.push({ label: 'Email :', value: left.email });
  if (left.phone) leftLines.push({ label: 'Tél :',   value: left.phone });
  if (left.rib)   leftLines.push({ label: 'RIB :',   value: left.rib, mono: true });
  if (left.bank)  leftLines.push({ label: 'Banque :', value: left.bank });

  const leftEndY = drawBlock(ML, startY, colW, left.title, leftLines);
  maxY = Math.max(maxY, leftEndY);

  // ── Colonne droite ────────────────────────────────────────────────────────
  if (right) {
    const rightLines: { label?: string; value: string; mono?: boolean }[] = [
      { label: undefined, value: right.name },
    ];
    if (right.mf)      rightLines.push({ label: 'M. Fiscal :', value: right.mf ?? '', mono: true });
    if (right.address) rightLines.push({ label: undefined, value: right.address });
    if (right.extra)   rightLines.push({ label: undefined, value: right.extra });

    const rightEndY = drawBlock(rightX, startY, colW, right.title, rightLines);
    maxY = Math.max(maxY, rightEndY);

    // Ligne verticale séparatrice
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(W / 2, startY, W / 2, maxY - 2);
  }

  return maxY + 4;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Tableau professionnel (wrapper autoTable)
// ─────────────────────────────────────────────────────────────────────────────
export const drawTable = (
  doc:     jsPDF,
  startY:  number,
  head:    string[][],
  body:    (string | { content: string; styles?: object }  )[][],
  colWidths?: number[],
  accentColor: RGB = C.accent,
): number => {
  autoTable(doc, {
    startY,
    head,
    body,
    styles: {
      fontSize:    8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor:   C.dark,
      lineColor:   C.border,
      lineWidth:   0.15,
      font:        'helvetica',
    },
    headStyles: {
      fillColor:       accentColor,
      textColor:       C.white,
      fontStyle:       'bold',
      fontSize:        8,
      cellPadding:     { top: 4, right: 4, bottom: 4, left: 4 },
    },
    alternateRowStyles: {
      fillColor: C.veryLight,
    },
    columnStyles: colWidths
      ? Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }]))
      : {},
    margin: { left: P.ML, right: P.MR },
    tableLineColor: C.border,
    tableLineWidth: 0.15,
  });
  return (doc as any).lastAutoTable.finalY;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Bloc totaux premium
// ─────────────────────────────────────────────────────────────────────────────
export const drawTotalsBlock = (
  doc: jsPDF,
  startY: number,
  totals: {
    subtotalHT:   number;
    taxAmount:    number;
    timbre:       number;
    netAmount:    number;
    paidAmount?:  number;
    taxRate?:     number;
  },
): number => {
  const { W, MR } = P;
  const boxW  = 80;
  const boxX  = W - MR - boxW;
  let y       = startY + 6;

  // Fond du bloc totaux
  doc.setFillColor(...C.veryLight);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.15);
  doc.roundedRect(boxX - 4, y - 4, boxW + 4, 52, 3, 3, 'FD');

  const row = (label: string, value: string, opts?: {
    bold?: boolean; separator?: boolean;
    bgColor?: RGB; textColor?: RGB; valueColor?: RGB; large?: boolean;
  }) => {
    if (opts?.separator) {
      doc.setDrawColor(...C.borderM);
      doc.setLineWidth(0.2);
      doc.line(boxX - 2, y - 1, W - MR + 2, y - 1);
      y += 1;
    }
    if (opts?.bgColor) {
      doc.setFillColor(...opts.bgColor);
      doc.rect(boxX - 4, y - 3, boxW + 4, opts.large ? 10 : 7, 'F');
    }
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(opts?.large ? 9.5 : 8.5);
    doc.setTextColor(...(opts?.textColor ?? C.mid));
    doc.text(label, boxX, y + (opts?.large ? 3.5 : 2));
    doc.setTextColor(...(opts?.valueColor ?? (opts?.bold ? C.navy : C.dark)));
    doc.text(value, W - MR, y + (opts?.large ? 3.5 : 2), { align: 'right' });
    y += opts?.large ? 11 : 7;
  };

  if (totals.taxRate !== undefined) {
    row('Base HT', fmt.amount(totals.subtotalHT));
    row(`TVA (${totals.taxRate}%)`, fmt.amount(totals.taxAmount));
  } else {
    row('Sous-total HT', fmt.amount(totals.subtotalHT));
    row('TVA', fmt.amount(totals.taxAmount));
  }
  row('Timbre fiscal', fmt.amount(totals.timbre));

  row('NET À PAYER TTC', fmt.amount(totals.netAmount), {
    bold:       true,
    separator:  true,
    bgColor:    C.accent,
    textColor:  C.accentL,
    valueColor: C.white,
    large:      true,
  });

  if (totals.paidAmount !== undefined) {
    const remaining = Math.round((totals.netAmount - totals.paidAmount) * 1000) / 1000;
    y += 2;
    row('Montant payé', fmt.amount(totals.paidAmount), {
      textColor:  C.success,
      valueColor: C.success,
    });
    row('Reste à payer', fmt.amount(remaining), {
      bold:       true,
      textColor:  remaining > 0 ? C.warning : C.success,
      valueColor: remaining > 0 ? C.warning : C.success,
    });
  }

  doc.setTextColor(...C.dark);
  return y + 4;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Section titre
// ─────────────────────────────────────────────────────────────────────────────
export const drawSectionTitle = (
  doc: jsPDF, y: number, title: string, accentColor: RGB = C.accent,
): number => {
  const { ML, CW } = P;
  doc.setFillColor(...accentColor);
  doc.rect(ML, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...accentColor);
  doc.text(title.toUpperCase(), ML + 6, y + 4.5);

  // Ligne légère
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(ML + 6 + title.length * 3.2, y + 3, ML + CW, y + 3);

  doc.setTextColor(...C.dark);
  return y + 10;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Note / info box
// ─────────────────────────────────────────────────────────────────────────────
export const drawInfoBox = (
  doc:   jsPDF,
  y:     number,
  text:  string,
  color: RGB = C.info,
  lightColor: RGB = C.infoL,
): number => {
  const { ML, CW } = P;
  const lines = doc.splitTextToSize(text, CW - 10);
  const h     = lines.length * 4.5 + 8;

  doc.setFillColor(...lightColor);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, h, 2, 2, 'FD');
  doc.setFillColor(...color);
  doc.rect(ML, y, 2, h, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.navy);
  lines.forEach((line: string, i: number) => {
    doc.text(line, ML + 6, y + 6 + i * 4.5);
  });

  doc.setTextColor(...C.dark);
  return y + h + 4;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Pied de page numéroté
// ─────────────────────────────────────────────────────────────────────────────
export const drawPageFooter = (
  doc:       jsPDF,
  pageNum:   number,
  totalPages: number,
  notes?:    string | null,
) => {
  const { ML, W, MR, H, CW } = P;
  const footY = H - 18;

  // Note si présente
  if (notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    const noteLines = doc.splitTextToSize(`Notes : ${notes}`, CW);
    noteLines.slice(0, 2).forEach((line: string, i: number) => {
      doc.text(line, ML, footY - 8 + i * 4);
    });
  }

  // Ligne de pied
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(ML, footY, W - MR, footY);

  // Accent bar
  doc.setFillColor(...C.accent);
  doc.rect(ML, footY, 20, 0.8, 'F');

  // Texte pied gauche
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text('NovaEntra — Gestion Fournisseurs & Achats', ML, footY + 5);

  // Date impression (centre)
  doc.text(
    `Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    W / 2, footY + 5, { align: 'center' },
  );

  // Numéro de page (droite)
  doc.text(`Page ${pageNum} / ${totalPages}`, W - MR, footY + 5, { align: 'right' });
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Zones de signature
// ─────────────────────────────────────────────────────────────────────────────
export const drawSignatures = (
  doc:    jsPDF,
  y:      number,
  left:   string,
  right:  string,
): number => {
  const { ML, W, MR, CW } = P;
  const sigW = 70;
  const sigH = 20;

  // Gauche
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.setFillColor(...C.veryLight);
  doc.roundedRect(ML, y, sigW, sigH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.mid);
  doc.text(left, ML + sigW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text('Signature et cachet', ML + sigW / 2, y + sigH - 3, { align: 'center' });

  // Droite
  const rightX = W - MR - sigW;
  doc.roundedRect(rightX, y, sigW, sigH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.mid);
  doc.text(right, rightX + sigW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text('Signature et cachet', rightX + sigW / 2, y + sigH - 3, { align: 'center' });

  doc.setTextColor(...C.dark);
  return y + sigH + 6;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT FINAL
// ─────────────────────────────────────────────────────────────────────────────
export const savePDF = (doc: jsPDF, filename: string) => {
  doc.save(`${filename}.pdf`);
};