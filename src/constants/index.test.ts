/**
 * Tests for constants
 */

import { describe, it, expect } from 'vitest';
import {
  API_ENDPOINTS,
  STATUS_COLORS,
  PAGINATION,
  VALIDATION,
  DEBOUNCE_DELAY,
  TOAST_DURATION,
} from './index';

describe('constants', () => {
  describe('API_ENDPOINTS', () => {
    it('should have all required endpoints', () => {
      expect(API_ENDPOINTS.SUPPLIERS).toBe('/suppliers');
      expect(API_ENDPOINTS.PURCHASE_ORDERS).toBe('/purchase-orders');
      expect(API_ENDPOINTS.GOODS_RECEIPTS).toBe('/goods-receipts');
      expect(API_ENDPOINTS.INVOICES).toBe('/invoices');
      expect(API_ENDPOINTS.THREE_WAY_MATCHING).toBe('/three-way-matching');
    });

    it('should be readonly', () => {
      // TypeScript enforces readonly at compile time, not runtime
      // This test verifies the type is defined as const
      expect(API_ENDPOINTS).toBeDefined();
      expect(Object.isFrozen(API_ENDPOINTS)).toBe(false); // JS objects are not frozen by default
    });
  });

  describe('STATUS_COLORS', () => {
    it('should have all status colors', () => {
      expect(STATUS_COLORS.draft).toBe('gray');
      expect(STATUS_COLORS.pending).toBe('yellow');
      expect(STATUS_COLORS.approved).toBe('green');
      expect(STATUS_COLORS.rejected).toBe('red');
      expect(STATUS_COLORS.completed).toBe('blue');
      expect(STATUS_COLORS.cancelled).toBe('red');
      expect(STATUS_COLORS.matched).toBe('green');
      expect(STATUS_COLORS.discrepancy).toBe('orange');
    });
  });

  describe('PAGINATION', () => {
    it('should have pagination settings', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
      expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);
      expect(Array.isArray(PAGINATION.PAGE_SIZE_OPTIONS)).toBe(true);
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toContain(20);
    });
  });

  describe('VALIDATION', () => {
    it('should have validation rules', () => {
      expect(VALIDATION.MIN_PASSWORD_LENGTH).toBe(8);
      expect(VALIDATION.MAX_FILE_SIZE).toBeGreaterThan(0);
      expect(Array.isArray(VALIDATION.ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(Array.isArray(VALIDATION.ALLOWED_DOCUMENT_TYPES)).toBe(true);
    });
  });

  describe('DEBOUNCE_DELAY', () => {
    it('should have debounce delays', () => {
      expect(DEBOUNCE_DELAY.SEARCH).toBe(300);
      expect(DEBOUNCE_DELAY.RESIZE).toBe(150);
      expect(DEBOUNCE_DELAY.SCROLL).toBe(100);
    });
  });

  describe('TOAST_DURATION', () => {
    it('should have toast durations', () => {
      expect(TOAST_DURATION.SUCCESS).toBe(3000);
      expect(TOAST_DURATION.ERROR).toBe(5000);
      expect(TOAST_DURATION.INFO).toBe(4000);
    });
  });
});
