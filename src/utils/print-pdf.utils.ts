// src/utils/print-pdf.utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Génération PDF via impression HTML natif du navigateur
// Avantages vs jsPDF :
//   - Rendu identique au design React (Tailwind, couleurs, polices)
//   - Texte jamais tronqué — le navigateur gère le word-wrap
//   - Pas de lib externe lourde
//   - Compatible tous navigateurs
//
// Installation : AUCUNE — utilise window.print() natif
// ─────────────────────────────────────────────────────────────────────────────

export const printDocument = (
  htmlContent: string,
  filename:    string,
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour télécharger le PDF');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    /* ── Reset ────────────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page A4 ──────────────────────────────────────────────────────── */
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 16mm 14mm;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Couleurs marque ──────────────────────────────────────────────── */
    :root {
      --primary:      #4f46e5;
      --primary-dark: #3730a3;
      --primary-light:#eef2ff;
      --success:      #16a34a;
      --success-light:#dcfce7;
      --warning:      #d97706;
      --warning-light:#fef9c3;
      --danger:       #dc2626;
      --danger-light: #fee2e2;
      --gray-50:      #f8fafc;
      --gray-100:     #f1f5f9;
      --gray-200:     #e2e8f0;
      --gray-400:     #94a3b8;
      --gray-500:     #64748b;
      --gray-700:     #334155;
      --gray-900:     #0f172a;
      --navy:         #0f172a;
    }

    /* ── En-tête bandeau ─────────────────────────────────────────────── */
    .doc-header {
      background: var(--navy);
      color: #fff;
      padding: 16pt 18pt;
      margin: 0 0 16pt 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 60pt;
      border-radius: 6pt;
    }
    .doc-header img {
      width: 40pt;
      height: 40pt;
      border-radius: 8pt;
      flex-shrink: 0;
      display: block;
      object-fit: contain;
    }
    .doc-header .company-name {
      font-size: 16pt;
      font-weight: 700;
      letter-spacing: -0.3pt;
      color: #fff;
    }
    .doc-header .company-sub {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 2pt;
    }
    .doc-header .doc-info {
      text-align: right;
    }
    .doc-header .doc-type {
      font-size: 9pt;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .doc-header .doc-number {
      font-size: 14pt;
      font-weight: 700;
      color: #fff;
      margin-top: 2pt;
    }
    .doc-header .doc-date {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 3pt;
    }

    /* Barre accent sous le header */
    .header-accent {
      height: 3pt;
      background: var(--primary);
      margin: 0 0 16pt 0;
      border-radius: 2pt;
    }

    /* ── Badge statut ────────────────────────────────────────────────── */
    .status-badge {
      display: inline-block;
      padding: 2pt 8pt;
      border-radius: 20pt;
      font-size: 8pt;
      font-weight: 600;
      margin-bottom: 12pt;
    }
    .status-draft         { background: #f1f5f9; color: #475569; }
    .status-sent          { background: #dbeafe; color: #1d4ed8; }
    .status-confirmed     { background: #ede9fe; color: #5b21b6; }
    .status-partial       { background: #fef9c3; color: #854d0e; }
    .status-received      { background: var(--success-light); color: var(--success); }
    .status-cancelled     { background: var(--danger-light); color: var(--danger); }
    .status-pending       { background: #f1f5f9; color: #475569; }
    .status-approved      { background: #dbeafe; color: #1d4ed8; }
    .status-paid          { background: var(--success-light); color: var(--success); }
    .status-overdue       { background: var(--danger-light); color: var(--danger); }
    .status-disputed      { background: #ffedd5; color: #9a3412; }

    /* ── Alerte bandeau ──────────────────────────────────────────────── */
    .alert-banner {
      border-left: 3pt solid var(--danger);
      background: var(--danger-light);
      padding: 8pt 12pt;
      border-radius: 0 6pt 6pt 0;
      margin-bottom: 12pt;
      font-size: 9pt;
      color: var(--danger);
      font-weight: 500;
    }

    /* ── Grille parties (fournisseur / acheteur) ─────────────────────── */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14pt;
      margin-bottom: 16pt;
    }
    .party-block {
      background: var(--gray-50);
      border: 0.5pt solid var(--gray-200);
      border-radius: 6pt;
      padding: 10pt 12pt;
    }
    .party-block .party-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      color: var(--primary);
      margin-bottom: 6pt;
      padding-bottom: 4pt;
      border-bottom: 0.5pt solid var(--gray-200);
    }
    .party-block .party-name {
      font-size: 11pt;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 3pt;
    }
    .party-block .party-line {
      font-size: 8.5pt;
      color: var(--gray-500);
      margin-top: 2pt;
    }
    .party-block .party-line strong {
      color: var(--gray-700);
      font-weight: 500;
    }

    /* ── Titre de section ────────────────────────────────────────────── */
    .section-title {
      display: flex;
      align-items: center;
      gap: 6pt;
      margin-bottom: 8pt;
      margin-top: 14pt;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 3pt;
      height: 14pt;
      background: var(--primary);
      border-radius: 2pt;
      flex-shrink: 0;
    }
    .section-title span {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
      color: var(--primary);
    }

    /* ── Tableau lignes ──────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 4pt;
    }
    thead tr {
      background: var(--primary);
      color: #fff;
    }
    thead th {
      padding: 6pt 8pt;
      text-align: left;
      font-weight: 600;
      font-size: 8pt;
      letter-spacing: 0.2pt;
    }
    thead th.right { text-align: right; }
    thead th.center { text-align: center; }

    tbody tr:nth-child(even) { background: var(--gray-50); }
    tbody tr { border-bottom: 0.3pt solid var(--gray-200); }
    tbody td {
      padding: 5pt 8pt;
      color: var(--gray-700);
      vertical-align: top;
    }
    tbody td.right  { text-align: right; }
    tbody td.center { text-align: center; }
    tbody td.mono   { font-family: 'Courier New', monospace; font-size: 8pt; }
    tbody td.bold   { font-weight: 600; color: var(--gray-900); }
    tbody td.green  { color: var(--success); font-weight: 600; }
    tbody td.orange { color: var(--warning); font-weight: 600; }
    tbody td.red    { color: var(--danger);  font-weight: 600; }

    tfoot tr { background: var(--primary-light); }
    tfoot td {
      padding: 5pt 8pt;
      font-weight: 700;
      color: var(--primary-dark);
      font-size: 8.5pt;
    }
    tfoot td.right { text-align: right; }

    /* ── Bloc totaux ─────────────────────────────────────────────────── */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 10pt;
      margin-bottom: 14pt;
    }
    .totals-box {
      background: var(--gray-50);
      border: 0.5pt solid var(--gray-200);
      border-radius: 6pt;
      padding: 10pt 14pt;
      min-width: 200pt;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3pt 0;
      font-size: 9pt;
      border-bottom: 0.3pt solid var(--gray-200);
      gap: 20pt;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row .label  { color: var(--gray-500); white-space: nowrap; }
    .totals-row .amount { font-weight: 500; color: var(--gray-900); white-space: nowrap; }
    .totals-net {
      background: var(--primary);
      border-radius: 4pt;
      padding: 7pt 10pt;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6pt;
      gap: 20pt;
    }
    .totals-net .label  { color: #c7d2fe; font-size: 9pt; font-weight: 600; white-space: nowrap; }
    .totals-net .amount { color: #fff; font-size: 12pt; font-weight: 700; white-space: nowrap; }
    .totals-remain {
      display: flex;
      justify-content: space-between;
      margin-top: 6pt;
      padding: 5pt 10pt;
      background: var(--warning-light);
      border-radius: 4pt;
      font-size: 9pt;
      gap: 20pt;
    }
    .totals-remain .label  { color: var(--warning); font-weight: 500; white-space: nowrap; }
    .totals-remain .amount { color: var(--warning); font-weight: 700; white-space: nowrap; }
    .totals-paid {
      display: flex;
      justify-content: space-between;
      margin-top: 6pt;
      padding: 5pt 10pt;
      background: var(--success-light);
      border-radius: 4pt;
      font-size: 9pt;
      gap: 20pt;
    }
    .totals-paid .label  { color: var(--success); font-weight: 500; white-space: nowrap; }
    .totals-paid .amount { color: var(--success); font-weight: 700; white-space: nowrap; }

    /* ── Barre progression paiement ──────────────────────────────────── */
    .progress-wrap { margin: 8pt 0; }
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: var(--gray-500);
      margin-bottom: 3pt;
    }
    .progress-track {
      height: 6pt;
      background: var(--gray-200);
      border-radius: 3pt;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3pt;
      background: var(--primary);
    }
    .progress-fill.paid { background: var(--success); }

    /* ── Info box ────────────────────────────────────────────────────── */
    .info-box {
      border-left: 3pt solid var(--primary);
      background: var(--primary-light);
      padding: 7pt 10pt;
      border-radius: 0 6pt 6pt 0;
      font-size: 8.5pt;
      color: var(--primary-dark);
      margin: 10pt 0;
      line-height: 1.6;
    }
    .info-box.warning {
      border-color: var(--warning);
      background: var(--warning-light);
      color: #78350f;
    }
    .info-box.danger {
      border-color: var(--danger);
      background: var(--danger-light);
      color: #7f1d1d;
    }
    .info-box .info-title {
      font-weight: 700;
      margin-bottom: 3pt;
    }

    /* ── Zones signature ────────────────────────────────────────────── */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20pt;
      margin-top: 20pt;
    }
    .sig-box {
      border: 0.5pt solid var(--gray-200);
      border-radius: 6pt;
      padding: 8pt 10pt;
      min-height: 50pt;
    }
    .sig-label {
      font-size: 8pt;
      font-weight: 600;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.3pt;
      margin-bottom: 4pt;
    }
    .sig-name {
      font-size: 9pt;
      color: var(--gray-700);
      margin-bottom: 20pt;
    }
    .sig-line {
      border-bottom: 0.5pt solid var(--gray-300);
      margin-top: auto;
    }

    /* ── Pied de page ────────────────────────────────────────────────── */
    .doc-footer {
      position: fixed;
      bottom: 0;
      left: 14mm;
      right: 14mm;
      padding-top: 6pt;
      border-top: 0.5pt solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: var(--gray-400);
    }
    .doc-footer .footer-accent {
      position: absolute;
      top: 0;
      left: 0;
      width: 30pt;
      height: 1.5pt;
      background: var(--primary);
    }

    /* ── No print ────────────────────────────────────────────────────── */
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Laisser le navigateur charger les styles puis imprimer
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
};

// ── Helpers de formatage ──────────────────────────────────────────────────────
export const fmtAmt = (v: number | string): string => {
  const n = typeof v === 'string' ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n) + ' TND';
};

export const fmtDate = (d: string): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

export const fmtDateShort = (d: string): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export const r3 = (v: number | string): number => {
  const n = typeof v === 'string' ? parseFloat(v) || 0 : v;
  return Math.round(n * 1000) / 1000;
};