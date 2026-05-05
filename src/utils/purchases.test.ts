import { describe, it, expect } from 'vitest';

// Utility functions for purchases
export const calculatePOTotal = (items: any[]) => {
  return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
};

export const formatPONumber = (number: number) => {
  return `PO-${new Date().getFullYear()}-${String(number).padStart(3, '0')}`;
};

export const getPOStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'gray',
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    completed: 'blue',
    cancelled: 'red',
  };
  return colors[status] || 'gray';
};

export const isOverdue = (dueDate: string) => {
  const due = new Date(dueDate);
  const today = new Date();
  // Set both to start of day for fair comparison
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

describe('Purchases Utilities', () => {
  describe('calculatePOTotal', () => {
    it('should calculate total for single item', () => {
      const items = [{ quantity: 10, unit_price: 50 }];
      expect(calculatePOTotal(items)).toBe(500);
    });

    it('should calculate total for multiple items', () => {
      const items = [
        { quantity: 10, unit_price: 50 },
        { quantity: 5, unit_price: 100 },
      ];
      expect(calculatePOTotal(items)).toBe(1000);
    });

    it('should return 0 for empty items', () => {
      expect(calculatePOTotal([])).toBe(0);
    });

    it('should handle decimal prices', () => {
      const items = [{ quantity: 3, unit_price: 10.50 }];
      expect(calculatePOTotal(items)).toBe(31.5);
    });
  });

  describe('formatPONumber', () => {
    it('should format PO number with padding', () => {
      const result = formatPONumber(1);
      expect(result).toMatch(/PO-\d{4}-001/);
    });

    it('should format large numbers correctly', () => {
      const result = formatPONumber(999);
      expect(result).toMatch(/PO-\d{4}-999/);
    });

    it('should include current year', () => {
      const currentYear = new Date().getFullYear();
      const result = formatPONumber(1);
      expect(result).toContain(String(currentYear));
    });
  });

  describe('getPOStatusColor', () => {
    it('should return correct color for draft status', () => {
      expect(getPOStatusColor('draft')).toBe('gray');
    });

    it('should return correct color for approved status', () => {
      expect(getPOStatusColor('approved')).toBe('green');
    });

    it('should return correct color for rejected status', () => {
      expect(getPOStatusColor('rejected')).toBe('red');
    });

    it('should return gray for unknown status', () => {
      expect(getPOStatusColor('unknown')).toBe('gray');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past date', () => {
      const pastDate = '2020-01-01';
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = '2030-12-31';
      expect(isOverdue(futureDate)).toBe(false);
    });
  });
});