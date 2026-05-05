/**
 * Tests for formatters utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatPhoneNumber,
  truncate,
  formatFileSize,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency with default USD', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format currency with custom currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toContain('-');
      expect(formatCurrency(-100)).toContain('100');
    });

    it('should handle invalid currency gracefully', () => {
      const result = formatCurrency(100, 'INVALID');
      expect(result).toContain('100');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle different formats', () => {
      const date = '2024-01-15';
      expect(formatDate(date, 'short')).toBeTruthy();
      expect(formatDate(date, 'medium')).toBeTruthy();
      expect(formatDate(date, 'long')).toBeTruthy();
    });

    it('should handle invalid date gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(0.1234, 0)).toBe('12%');
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
      expect(formatPercentage(0.1234, 3)).toBe('12.340%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should handle 100%', () => {
      expect(formatPercentage(1)).toBe('100.00%');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format US phone number', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should handle already formatted number', () => {
      const result = formatPhoneNumber('(123) 456-7890');
      expect(result).toBeTruthy();
    });

    it('should handle invalid phone number', () => {
      expect(formatPhoneNumber('123')).toBe('123');
    });

    it('should strip non-numeric characters', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });
});
