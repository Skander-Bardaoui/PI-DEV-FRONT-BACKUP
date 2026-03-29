// src/hooks/useSalesOcr.ts
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

export interface ExtractedField<T> {
  value: T | null;
  confidence: ConfidenceLevel;
  raw: string | null;
}

export interface SalesOcrResult {
  document_type: 'invoice' | 'quote' | 'delivery_note' | 'order' | 'unknown';
  document_number: ExtractedField<string>;
  document_date: ExtractedField<string>;
  client_name: ExtractedField<string>;
  client_address: ExtractedField<string>;
  client_tax_id: ExtractedField<string>;
  items: Array<{
    description: string;
    quantity: number | null;
    unit_price: number | null;
    total: number | null;
    confidence: ConfidenceLevel;
  }>;
  subtotal_ht: ExtractedField<number>;
  tax_amount: ExtractedField<number>;
  total_ttc: ExtractedField<number>;
  payment_terms: ExtractedField<string>;
  notes: ExtractedField<string>;
  raw_text: string;
  ocr_confidence: number;
  processing_time_ms: number;
  file_url: string;
  file_name: string;
  file_size: number;
  // AI enrichment data
  ai_enrichment?: {
    confidence: number;
    documentType: string;
  };
}

export function useSalesOcrExtract(businessId: string, documentType: 'invoice' | 'quote' | 'delivery_note' | 'order' = 'invoice') {
  return useMutation({
    mutationFn: async (file: File): Promise<SalesOcrResult> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = `/businesses/${businessId}/sales/ocr/scan-${documentType}`;
      const { data } = await axiosInstance.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Transform backend response to match expected structure with confidence levels
      const result = data.data || data;
      
      // Helper to determine confidence level based on value presence and OCR confidence
      const getConfidence = (value: any, baseConfidence: number): ConfidenceLevel => {
        if (!value) return 'not_found';
        if (baseConfidence >= 80) return 'high';
        if (baseConfidence >= 60) return 'medium';
        return 'low';
      };
      
      const confidence = result.confidence || 0;
      
      return {
        document_type: result.document_type || 'invoice',
        document_number: {
          value: result.document_number,
          confidence: getConfidence(result.document_number, confidence),
          raw: result.document_number,
        },
        document_date: {
          value: result.document_date,
          confidence: getConfidence(result.document_date, confidence),
          raw: result.document_date,
        },
        client_name: {
          value: result.client_name,
          confidence: getConfidence(result.client_name, confidence),
          raw: result.client_name,
        },
        client_address: {
          value: result.client_address,
          confidence: getConfidence(result.client_address, confidence * 0.8),
          raw: result.client_address,
        },
        client_tax_id: {
          value: result.client_tax_id,
          confidence: getConfidence(result.client_tax_id, confidence * 0.9),
          raw: result.client_tax_id,
        },
        items: (result.items || []).map((item: any) => ({
          ...item,
          confidence: getConfidence(item.description, confidence * 0.85) as ConfidenceLevel,
        })),
        subtotal_ht: {
          value: result.subtotal_ht,
          confidence: getConfidence(result.subtotal_ht, confidence),
          raw: result.subtotal_ht?.toString(),
        },
        tax_amount: {
          value: result.tax_amount,
          confidence: getConfidence(result.tax_amount, confidence),
          raw: result.tax_amount?.toString(),
        },
        total_ttc: {
          value: result.total_ttc,
          confidence: getConfidence(result.total_ttc, confidence),
          raw: result.total_ttc?.toString(),
        },
        payment_terms: {
          value: result.payment_terms,
          confidence: getConfidence(result.payment_terms, confidence * 0.7),
          raw: result.payment_terms,
        },
        notes: {
          value: result.notes,
          confidence: getConfidence(result.notes, confidence * 0.6),
          raw: result.notes,
        },
        raw_text: result.raw_text || '',
        ocr_confidence: confidence,
        processing_time_ms: result.processing_time_ms || 0,
        file_url: result.file_url || '',
        file_name: file.name,
        file_size: file.size,
        // Include AI enrichment data if available
        ai_enrichment: result.ai_enrichment ? {
          confidence: result.ai_enrichment.confidence || 0,
          documentType: result.ai_enrichment.documentType || 'UNKNOWN',
        } : undefined,
      };
    },
  });
}
