// src/types/sales-order.ts

export enum SalesOrderStatus {
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
}

export const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.CONFIRMED]: 'Confirmé',
  [SalesOrderStatus.IN_PROGRESS]: 'En cours',
  [SalesOrderStatus.DELIVERED]: 'Livré',
  [SalesOrderStatus.INVOICED]: 'Facturé',
  [SalesOrderStatus.CANCELLED]: 'Annulé',
};

export const SALES_ORDER_STATUS_COLORS: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
  [SalesOrderStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-700',
  [SalesOrderStatus.DELIVERED]: 'bg-green-100 text-green-700',
  [SalesOrderStatus.INVOICED]: 'bg-purple-100 text-purple-700',
  [SalesOrderStatus.CANCELLED]: 'bg-red-100 text-red-700',
};

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  businessId: string;
  clientId: string;
  client: any;
  orderDate: string;
  deliveryDate: string | null;
  expectedDelivery: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  timbreFiscal: number;
  netAmount: number;
  notes: string | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItem[];
}

export interface CreateSalesOrderItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface CreateSalesOrderDto {
  clientId: string;
  orderDate?: string;
  expectedDelivery?: string;
  notes?: string;
  quoteId?: string;
  items: CreateSalesOrderItemDto[];
}

export interface UpdateSalesOrderDto extends Partial<CreateSalesOrderDto> {
  status?: SalesOrderStatus;
}

export interface SalesOrdersQueryParams {
  client_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSalesOrders {
  data: SalesOrder[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
