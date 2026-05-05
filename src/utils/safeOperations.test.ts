/**
 * Tests for safeOperations utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  safeDivide,
  safePercentage,
  safeSum,
  safeAverage,
  safeParseNumber,
  safeParseInt,
  clamp,
  safeRound,
  safeEquals,
  safeClone,
  safeMerge,
} from './safeOperations';

describe('safeOperations', () => {
  describe('safeDivide', () => {
    it('should divide numbers correctly', () => {
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(7, 2)).toBe(3.5);
    });

    it('should return fallback for division by zero', () => {
      expect(safeDivide(10, 0)).toBe(0);
      expect(safeDivide(10, 0, 999)).toBe(999);
    });

    it('should handle infinity', () => {
      expect(safeDivide(10, Infinity)).toBe(0);
      expect(safeDivide(Infinity, 2)).toBe(0);
    });
  });

  describe('safePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(safePercentage(50, 100)).toBe(50);
      expect(safePercentage(25, 100)).toBe(25);
    });

    it('should handle decimals', () => {
      expect(safePercentage(1, 3, 2)).toBe(33.33);
      expect(safePercentage(1, 3, 0)).toBe(33);
    });

    it('should return 0 for division by zero', () => {
      expect(safePercentage(50, 0)).toBe(0);
    });

    it('should handle infinity', () => {
      expect(safePercentage(Infinity, 100)).toBe(0);
      expect(safePercentage(50, Infinity)).toBe(0);
    });
  });

  describe('safeSum', () => {
    it('should sum numbers correctly', () => {
      expect(safeSum([1, 2, 3])).toBe(6);
      expect(safeSum([10, 20, 30])).toBe(60);
    });

    it('should handle empty array', () => {
      expect(safeSum([])).toBe(0);
    });

    it('should handle non-array', () => {
      expect(safeSum(null as any)).toBe(0);
      expect(safeSum(undefined as any)).toBe(0);
    });

    it('should filter out invalid numbers', () => {
      expect(safeSum([1, NaN, 3])).toBe(4);
      expect(safeSum([1, Infinity, 3])).toBe(4);
    });
  });

  describe('safeAverage', () => {
    it('should calculate average correctly', () => {
      expect(safeAverage([1, 2, 3])).toBe(2);
      expect(safeAverage([10, 20, 30])).toBe(20);
    });

    it('should handle empty array', () => {
      expect(safeAverage([])).toBe(0);
    });

    it('should handle non-array', () => {
      expect(safeAverage(null as any)).toBe(0);
    });

    it('should filter out invalid numbers', () => {
      expect(safeAverage([2, NaN, 4])).toBe(3);
    });
  });

  describe('safeParseNumber', () => {
    it('should parse numbers', () => {
      expect(safeParseNumber(123)).toBe(123);
      expect(safeParseNumber('123')).toBe(123);
      expect(safeParseNumber('123.45')).toBe(123.45);
    });

    it('should return fallback for invalid input', () => {
      expect(safeParseNumber('abc')).toBe(0);
      expect(safeParseNumber('abc', 999)).toBe(999);
      expect(safeParseNumber(null)).toBe(0);
    });

    it('should handle infinity', () => {
      expect(safeParseNumber(Infinity)).toBe(0);
      expect(safeParseNumber(NaN)).toBe(0);
    });
  });

  describe('safeParseInt', () => {
    it('should parse integers', () => {
      expect(safeParseInt(123)).toBe(123);
      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('123.99')).toBe(123);
    });

    it('should return fallback for invalid input', () => {
      expect(safeParseInt('abc')).toBe(0);
      expect(safeParseInt('abc', 999)).toBe(999);
    });

    it('should floor decimal numbers', () => {
      expect(safeParseInt(123.99)).toBe(123);
      expect(safeParseInt(123.01)).toBe(123);
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle infinity', () => {
      expect(clamp(Infinity, 0, 10)).toBe(0);
      expect(clamp(NaN, 0, 10)).toBe(0);
    });
  });

  describe('safeRound', () => {
    it('should round numbers correctly', () => {
      expect(safeRound(1.234, 2)).toBe(1.23);
      expect(safeRound(1.235, 2)).toBe(1.24);
      expect(safeRound(1.5, 0)).toBe(2);
    });

    it('should handle infinity', () => {
      expect(safeRound(Infinity)).toBe(0);
      expect(safeRound(NaN)).toBe(0);
    });
  });

  describe('safeEquals', () => {
    it('should compare primitive values', () => {
      expect(safeEquals(1, 1)).toBe(true);
      expect(safeEquals('hello', 'hello')).toBe(true);
      expect(safeEquals(true, true)).toBe(true);
    });

    it('should compare objects', () => {
      expect(safeEquals({ a: 1 }, { a: 1 })).toBe(true);
      expect(safeEquals({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should compare arrays', () => {
      expect(safeEquals([1, 2], [1, 2])).toBe(true);
      expect(safeEquals([1, 2], [2, 1])).toBe(false);
    });

    it('should handle circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      expect(safeEquals(circular, circular)).toBe(true);
    });
  });

  describe('safeClone', () => {
    it('should clone objects', () => {
      const obj = { name: 'John', age: 30 };
      const cloned = safeClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, 3];
      const cloned = safeClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    it('should return null for circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      expect(safeClone(circular)).toBe(null);
    });
  });

  describe('safeMerge', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      expect(safeMerge(obj1, obj2)).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should handle empty objects', () => {
      expect(safeMerge({}, {})).toEqual({});
    });

    it('should handle single object', () => {
      const obj = { a: 1 };
      expect(safeMerge(obj)).toEqual(obj);
    });
  });
});
