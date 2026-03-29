// src/types/delivery-note.ts

export enum DeliveryNoteStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export const DELIVERY_NOTE_STATUS_LABELS: Record<DeliveryNoteStatus, string> = {
  [DeliveryNoteStatus.PENDING]: 'En attente',
  [DeliveryNoteStatus.DELIVERED]: 'Livré',
  [DeliveryNoteStatus.CANCELLED]: 'Annulé',
};

export const DELIVERY_NOTE_STATUS_COLORS: Record<DeliveryNoteStatus, string> = {
  [DeliveryNoteStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [DeliveryNoteStatus.DELIVERED]: 'bg-green-100 text-green-700',
  [DeliveryNoteStatus.CANCELLED]: 'bg-red-100 text-red-700',
};

export interface DeliveryNoteItem {
  id: string;
  deliveryNoteId: string;
  productId: string | null;
  description: string;
  quantity: number;
  deliveredQuantity: number;
  salesOrderItemId?: string;
  salesOrderItem?: any;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  status: DeliveryNoteStatus;
  businessId: string;
  clientId: string;
  client: any;
  salesOrderId: string | null;
  salesOrder?: any;
  deliveryDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: DeliveryNoteItem[];
}

export interface CreateDeliveryNoteItemDto {
  productId?: string;
  description: string;
  quantity: number;
  deliveredQuantity: number;
  salesOrderItemId?: string;
}

export interface CreateDeliveryNoteDto {
  clientId: string;
  salesOrderId?: string;
  deliveryDate?: string;
  notes?: string;
  items: CreateDeliveryNoteItemDto[];
}

export interface UpdateDeliveryNoteDto extends Partial<CreateDeliveryNoteDto> {
  status?: DeliveryNoteStatus;
}

export interface DeliveryNotesQueryParams {
  client_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDeliveryNotes {
  data: DeliveryNote[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
