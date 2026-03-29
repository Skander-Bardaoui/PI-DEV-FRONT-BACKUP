// src/types/quote.ts

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: 'Brouillon',
  [QuoteStatus.SENT]: 'Envoyé',
  [QuoteStatus.ACCEPTED]: 'Accepté',
  [QuoteStatus.REJECTED]: 'Rejeté',
  [QuoteStatus.EXPIRED]: 'Expiré',
  [QuoteStatus.CONVERTED]: 'Converti',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [QuoteStatus.SENT]: 'bg-blue-100 text-blue-700',
  [QuoteStatus.ACCEPTED]: 'bg-green-100 text-green-700',
  [QuoteStatus.REJECTED]: 'bg-red-100 text-red-700',
  [QuoteStatus.EXPIRED]: 'bg-orange-100 text-orange-700',
  [QuoteStatus.CONVERTED]: 'bg-purple-100 text-purple-700',
};

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  businessId: string;
  clientId: string;
  client: any;
  quoteDate: string;
  validUntil: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  timbreFiscal: number;
  netAmount: number;
  notes: string | null;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
}

export interface CreateQuoteItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface CreateQuoteDto {
  clientId: string;
  quoteDate?: string;
  validUntil?: string;
  notes?: string;
  items: CreateQuoteItemDto[];
}

export interface UpdateQuoteDto extends Partial<CreateQuoteDto> {
  status?: QuoteStatus;
}

export interface QuotesQueryParams {
  client_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedQuotes {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
