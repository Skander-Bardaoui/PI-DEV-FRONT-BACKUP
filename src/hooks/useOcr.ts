// src/hooks/useOcr.ts
import { useMutation } from '@tanstack/react-query';
import axiosInstance   from '@/api/axiosInstance';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

export interface ExtractedField<T> {
  value:      T | null;
  confidence: ConfidenceLevel;
  raw:        string | null;
}

export interface OcrResult {
  invoice_number_supplier: ExtractedField<string>;
  invoice_date:            ExtractedField<string>;
  supplier_name:           ExtractedField<string>;
  subtotal_ht:             ExtractedField<number>;
  tax_amount:              ExtractedField<number>;
  timbre_fiscal:           ExtractedField<number>;
  net_amount:              ExtractedField<number>;
  raw_text:                string;
  ocr_confidence:          number;
  processing_time_ms:      number;
  file_url:                string;
  file_name:               string;
  file_size:               number;
  ai_validation?: {
    isValid:        boolean;
    errors:         string[];
    warnings:       string[];
    confidence:     number;
    hasCorrections: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToConfidence(score: number | undefined | null): ConfidenceLevel {
  if (score == null) return 'not_found';
  if (score >= 75)   return 'high';
  if (score >= 50)   return 'medium';
  if (score >= 1)    return 'low';
  return 'not_found';
}

function makeField<T>(value: T | null | undefined, confidence?: ConfidenceLevel, raw?: string | null): ExtractedField<T> {
  return {
    value:      value ?? null,
    confidence: confidence ?? (value != null ? 'medium' : 'not_found'),
    raw:        raw ?? (value != null ? String(value) : null),
  };
}

/**
 * Normalise n'importe quelle forme de réponse backend vers OcrResult.
 * Gère 3 cas :
 *   1. Réponse déjà au bon format (ExtractedField)
 *   2. Réponse plate du service OCR NestJS (invoice_number, invoice_date, ...)
 *   3. Réponse enrichie AI (suggested_dto + ai_enrichment)
 */
function normalizeOcrResponse(raw: any): OcrResult {
  // ── Cas 1 : déjà au bon format ───────────────────────────────────────────
  if (raw?.invoice_number_supplier && typeof raw.invoice_number_supplier === 'object' && 'value' in raw.invoice_number_supplier) {
    return raw as OcrResult;
  }

  // ── Cas 2 & 3 : réponse plate du backend NestJS ──────────────────────────
  // Priorité : données AI (suggested_dto / ai_enrichment / vision_enrichment)
  // puis fallback sur les données OCR Tesseract brutes

  const ai = raw?.ai_enrichment?.mappedFields ?? raw?.vision_enrichment?.mappedFields ?? null;
  const dto = raw?.suggested_dto ?? null;
  const confidence = raw?.analysis_confidence ?? raw?.ai_enrichment?.confidence ?? raw?.confidence ?? 50;

  // Numéro de facture
  const invoiceNumber =
    dto?.invoiceNumberSupplier ??
    ai?.invoiceNumber ??
    raw?.invoice_number ??
    null;

  // Date de facture
  const invoiceDate =
    dto?.invoiceDate ??
    ai?.invoiceDate ??
    raw?.invoice_date ??
    null;

  // Nom du fournisseur
  const supplierName =
    ai?.supplierName ??
    raw?.supplier_name ??
    null;

  // Montants
  const subtotalHt =
    dto?.subtotalHt ??
    ai?.subtotalHt ??
    raw?.subtotal_ht ??
    null;

  const taxAmount =
    dto?.taxAmount ??
    ai?.taxAmount ??
    raw?.tax_amount ??
    null;

  const timbreFiscal =
    dto?.timbreFiscal ??
    ai?.timbreFiscal ??
    raw?.timbre_fiscal ??
    1.000;

  const netAmount =
    dto?.netAmount ??
    ai?.totalTtc ??
    raw?.total_ttc ??
    raw?.net_amount ??
    null;

  // Score de confiance global → ConfidenceLevel par champ
  const globalConf = scoreToConfidence(confidence);

  return {
    invoice_number_supplier: makeField<string>(invoiceNumber, invoiceNumber ? globalConf : 'not_found'),
    invoice_date:            makeField<string>(invoiceDate,   invoiceDate   ? globalConf : 'not_found'),
    supplier_name:           makeField<string>(supplierName,  supplierName  ? globalConf : 'not_found'),
    subtotal_ht:             makeField<number>(subtotalHt != null ? Number(subtotalHt) : null, subtotalHt != null ? globalConf : 'not_found'),
    tax_amount:              makeField<number>(taxAmount   != null ? Number(taxAmount)  : null, taxAmount  != null ? globalConf : 'not_found'),
    timbre_fiscal:           makeField<number>(timbreFiscal  != null ? Number(timbreFiscal) : 1, timbreFiscal != null ? globalConf : 'medium'),
    net_amount:              makeField<number>(netAmount   != null ? Number(netAmount)  : null, netAmount  != null ? globalConf : 'not_found'),

    raw_text:           raw?.raw_text            ?? '',
    ocr_confidence:     raw?.confidence          ?? confidence ?? 0,
    processing_time_ms: raw?.processing_time_ms  ?? 0,
    file_url:           raw?.file_url            ?? '',
    file_name:          raw?.file_name           ?? '',
    file_size:          raw?.file_size           ?? 0,

    ai_validation: raw?.ai_validation ?? (ai ? {
      isValid:        confidence >= 50,
      errors:         [],
      warnings:       confidence < 60 ? ['Confiance IA faible — vérifiez les données extraites'] : [],
      confidence:     confidence,
      hasCorrections: !!ai,
    } : undefined),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOcrExtract(businessId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<OcrResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/ocr/extract`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      // Normaliser quelle que soit la forme retournée par le backend
      return normalizeOcrResponse(data);
    },
  });
}