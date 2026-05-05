import { describe, it, expect } from 'vitest';
import {
  createSupplierSchema,
  updateSupplierSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  createGoodsReceiptSchema,
  createInvoiceSchema,
  threeWayMatchingSchema,
} from './purchases.schemas';

describe('Purchases Schemas', () => {
  describe('createSupplierSchema', () => {
    it('should validate a valid supplier', () => {
      const validSupplier = {
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '+1234567890',
        address: '123 Test St',
        tax_id: 'TAX123',
        payment_terms: 'Net 30',
        is_active: true,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it('should reject supplier with invalid email', () => {
      const invalidSupplier = {
        name: 'Test Supplier',
        email: 'invalid-email',
        phone: '+1234567890',
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });

    it('should reject supplier without required name', () => {
      const invalidSupplier = {
        email: 'test@supplier.com',
        phone: '+1234567890',
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
    });
  });

  describe('updateSupplierSchema', () => {
    it('should validate partial supplier update', () => {
      const partialUpdate = {
        name: 'Updated Name',
      };

      const result = updateSupplierSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate full supplier update', () => {
      const fullUpdate = {
        name: 'Updated Supplier',
        email: 'updated@supplier.com',
        phone: '+9876543210',
        address: '456 New St',
        is_active: false,
      };

      const result = updateSupplierSchema.safeParse(fullUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('createPurchaseOrderSchema', () => {
    it('should validate a valid purchase order', () => {
      const validPO = {
        supplier_id: 'supplier-123',
        order_date: '2024-01-15',
        expected_delivery_date: '2024-02-15',
        items: [
          {
            product_id: 'product-1',
            quantity: 10,
            unit_price: 50.0,
            total_price: 500.0,
          },
        ],
        subtotal: 500.0,
        tax_amount: 50.0,
        total_amount: 550.0,
        status: 'draft',
      };

      const result = createPurchaseOrderSchema.safeParse(validPO);
      expect(result.success).toBe(true);
    });

    it('should reject PO without items', () => {
      const invalidPO = {
        supplier_id: 'supplier-123',
        order_date: '2024-01-15',
        items: [],
        subtotal: 0,
        total_amount: 0,
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
    });

    it('should reject PO with negative quantities', () => {
      const invalidPO = {
        supplier_id: 'supplier-123',
        order_date: '2024-01-15',
        items: [
          {
            product_id: 'product-1',
            quantity: -5,
            unit_price: 50.0,
            total_price: -250.0,
          },
        ],
        subtotal: -250.0,
        total_amount: -250.0,
      };

      const result = createPurchaseOrderSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
    });
  });

  describe('updatePurchaseOrderSchema', () => {
    it('should validate partial PO update', () => {
      const partialUpdate = {
        status: 'approved',
      };

      const result = updatePurchaseOrderSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate status change', () => {
      const statusUpdate = {
        status: 'cancelled',
        cancellation_reason: 'Supplier unavailable',
      };

      const result = updatePurchaseOrderSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('createGoodsReceiptSchema', () => {
    it('should validate a valid goods receipt', () => {
      const validReceipt = {
        purchase_order_id: 'po-123',
        received_date: '2024-02-15',
        items: [
          {
            po_item_id: 'item-1',
            received_quantity: 10,
            accepted_quantity: 9,
            rejected_quantity: 1,
            rejection_reason: 'Damaged',
          },
        ],
        notes: 'Partial acceptance',
      };

      const result = createGoodsReceiptSchema.safeParse(validReceipt);
      expect(result.success).toBe(true);
    });

    it('should reject receipt with negative quantities', () => {
      const invalidReceipt = {
        purchase_order_id: 'po-123',
        received_date: '2024-02-15',
        items: [
          {
            po_item_id: 'item-1',
            received_quantity: -5,
            accepted_quantity: 0,
          },
        ],
      };

      const result = createGoodsReceiptSchema.safeParse(invalidReceipt);
      expect(result.success).toBe(false);
    });
  });

  describe('createInvoiceSchema', () => {
    it('should validate a valid invoice', () => {
      const validInvoice = {
        purchase_order_id: 'po-123',
        invoice_number: 'INV-2024-001',
        invoice_date: '2024-02-20',
        due_date: '2024-03-20',
        subtotal: 500.0,
        tax_amount: 50.0,
        total_amount: 550.0,
        items: [
          {
            description: 'Product A',
            quantity: 10,
            unit_price: 50.0,
            total_price: 500.0,
          },
        ],
      };

      const result = createInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should reject invoice with invalid amounts', () => {
      const invalidInvoice = {
        purchase_order_id: 'po-123',
        invoice_number: 'INV-2024-001',
        invoice_date: '2024-02-20',
        subtotal: -100,
        total_amount: -100,
        items: [],
      };

      const result = createInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
  });

  describe('threeWayMatchingSchema', () => {
    it('should validate three-way matching data', () => {
      const validMatching = {
        purchase_order_id: 'po-123',
        goods_receipt_id: 'gr-123',
        invoice_id: 'inv-123',
        match_status: 'matched',
      };

      const result = threeWayMatchingSchema.safeParse(validMatching);
      expect(result.success).toBe(true);
    });

    it('should validate with discrepancies', () => {
      const matchingWithDiscrepancies = {
        purchase_order_id: 'po-123',
        goods_receipt_id: 'gr-123',
        invoice_id: 'inv-123',
        match_status: 'discrepancy',
        discrepancies: [
          {
            type: 'quantity',
            description: 'Quantity mismatch',
            po_value: 10,
            gr_value: 9,
            invoice_value: 10,
          },
        ],
      };

      const result = threeWayMatchingSchema.safeParse(matchingWithDiscrepancies);
      expect(result.success).toBe(true);
    });
  });
});
