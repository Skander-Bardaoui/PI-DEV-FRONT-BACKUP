// src/types/goods-receipt.types.ts

import { SupplierPO, SupplierPOItem } from "./supplier-po";

// ── Ligne de BR ───────────────────────────────────────────────────────────
export interface GoodsReceiptItem {
  id:                  string;
  gr_id:               string;
  supplier_po_item_id: string;
  product_id:          string | null;
  quantity_received:   number;
  unit_price_ht:       number;
  supplier_po_item?:   SupplierPOItem;
}

// ── Bon de Réception ──────────────────────────────────────────────────────
export interface GoodsReceipt {
  id:             string;
  gr_number:      string;
  business_id:    string;
  supplier_po_id: string;
  supplier_po:    SupplierPO;
  receipt_date:   string;
  notes:          string | null;
  received_by:    string;
  created_at:     string;
  items:          GoodsReceiptItem[];
}

// ── DTOs ─────────────────────────────────────────────────────────────────
export interface CreateGoodsReceiptItemDto {
  supplier_po_item_id: string;
  quantity_received:   number;
}

export interface CreateGoodsReceiptDto {
  receipt_date?: string;
  notes?:        string;
  items:         CreateGoodsReceiptItemDto[];
}