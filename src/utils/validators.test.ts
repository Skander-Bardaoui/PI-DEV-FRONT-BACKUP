/**
 * Tests for validators utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  isDefined,
  isNonEmptyString,
  isNonEmptyArray,
  safeArrayAccess,
  safeGet,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isNotPastDate,
  isPositiveNumber,
  isNonNegativeNumber,
  safeJsonParse,
  safeJsonStringify,
} from './validators';

describe('validators', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' hello ')).toBe(true);
    });

    it('should return false for empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isNonEmptyArray('hello')).toBe(false);
      expect(isNonEmptyArray(null)).toBe(false);
      expect(isNonEmptyArray(undefined)).toBe(false);
    });
  });

  describe('safeArrayAccess', () => {
    it('should return element at valid index', () => {
      expect(safeArrayAccess([1, 2, 3], 0)).toBe(1);
      expect(safeArrayAccess([1, 2, 3], 2)).toBe(3);
    });

    it('should return null for invalid index', () => {
      expect(safeArrayAccess([1, 2, 3], -1)).toBe(null);
      expect(safeArrayAccess([1, 2, 3], 10)).toBe(null);
    });

    it('should return null for non-array', () => {
      expect(safeArrayAccess(null as any, 0)).toBe(null);
      expect(safeArrayAccess('hello' as any, 0)).toBe(null);
    });
  });

  describe('safeGet', () => {
    it('should return property value', () => {
      const obj = { name: 'John', age: 30 };
      expect(safeGet(obj, 'name')).toBe('John');
      expect(safeGet(obj, 'age')).toBe(30);
    });

    it('should return null for missing property', () => {
      const obj = { name: 'John' };
      expect(safeGet(obj, 'age' as any)).toBe(null);
    });

    it('should return null for null/undefined object', () => {
      expect(safeGet(null, 'name' as any)).toBe(null);
      expect(safeGet(undefined, 'name' as any)).toBe(null);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('+1 (234) 567-8900')).toBe(true);
      expect(isValidPhone('+33 1 23 45 67 89')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isNotPastDate', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isNotPastDate(futureDate)).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date();
      expect(isNotPastDate(today)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isNotPastDate(pastDate)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isNotPastDate('invalid')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(1000)).toBe(true);
    });

    it('should return false for zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositiveNumber('1' as any)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber(null as any)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should return true for non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
      expect(isNonNegativeNumber(1000)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(-0.1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNonNegativeNumber('0' as any)).toBe(false);
      expect(isNonNegativeNumber(NaN)).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"name":"John"}', {})).toEqual({ name: 'John' });
      expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true });
      expect(safeJsonParse('', [])).toEqual([]);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      expect(safeJsonStringify({ name: 'John' })).toBe('{"name":"John"}');
      expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
    });

    it('should return fallback for circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      expect(safeJsonStringify(circular)).toBe('{}');
    });
  });
});
