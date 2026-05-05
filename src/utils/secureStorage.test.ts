import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
  secureClearAll,
  isStorageAvailable,
} from './secureStorage';

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('secureSetItem', () => {
    it('should store allowed keys', () => {
      const result = secureSetItem('app-language', 'en');
      expect(result).toBe(true);
      expect(localStorage.getItem('app-language')).toBe('en');
    });

    it('should reject disallowed keys', () => {
      const result = secureSetItem('unauthorized-key' as any, 'value');
      expect(result).toBe(false);
      expect(localStorage.getItem('unauthorized-key')).toBeNull();
    });

    it('should reject sensitive data containing "token"', () => {
      const result = secureSetItem('app-language', 'my-secret-token-123');
      expect(result).toBe(false);
    });

    it('should reject sensitive data containing "password"', () => {
      const result = secureSetItem('app-language', 'password123');
      expect(result).toBe(false);
    });

    it('should reject sensitive data containing "secret"', () => {
      const result = secureSetItem('app-language', 'my-secret-key');
      expect(result).toBe(false);
    });

    it('should store accessibility settings', () => {
      const settings = JSON.stringify({ fontSize: 16, contrast: 'high' });
      const result = secureSetItem('accessibility-settings', settings);
      expect(result).toBe(true);
    });

    it('should store color theme', () => {
      const result = secureSetItem('colorTheme', 'dark');
      expect(result).toBe(true);
      expect(localStorage.getItem('colorTheme')).toBe('dark');
    });
  });

  describe('secureGetItem', () => {
    it('should retrieve stored values', () => {
      localStorage.setItem('app-language', 'fr');
      const result = secureGetItem('app-language');
      expect(result).toBe('fr');
    });

    it('should return null for non-existent keys', () => {
      const result = secureGetItem('app-language');
      expect(result).toBeNull();
    });

    it('should reject disallowed keys', () => {
      localStorage.setItem('unauthorized-key', 'value');
      const result = secureGetItem('unauthorized-key' as any);
      expect(result).toBeNull();
    });

    it('should retrieve business ID', () => {
      localStorage.setItem('currentBusinessId', 'business-123');
      const result = secureGetItem('currentBusinessId');
      expect(result).toBe('business-123');
    });
  });

  describe('secureRemoveItem', () => {
    it('should remove stored values', () => {
      localStorage.setItem('app-language', 'en');
      const result = secureRemoveItem('app-language');
      expect(result).toBe(true);
      expect(localStorage.getItem('app-language')).toBeNull();
    });

    it('should reject disallowed keys', () => {
      localStorage.setItem('unauthorized-key', 'value');
      const result = secureRemoveItem('unauthorized-key' as any);
      expect(result).toBe(false);
      expect(localStorage.getItem('unauthorized-key')).toBe('value');
    });

    it('should handle non-existent keys gracefully', () => {
      const result = secureRemoveItem('app-language');
      expect(result).toBe(true);
    });
  });

  describe('secureClearAll', () => {
    it('should clear all allowed keys', () => {
      localStorage.setItem('app-language', 'en');
      localStorage.setItem('colorTheme', 'dark');
      localStorage.setItem('readingMode', 'true');
      localStorage.setItem('unauthorized-key', 'value');

      const result = secureClearAll();
      expect(result).toBe(true);

      expect(localStorage.getItem('app-language')).toBeNull();
      expect(localStorage.getItem('colorTheme')).toBeNull();
      expect(localStorage.getItem('readingMode')).toBeNull();
      // Unauthorized key should remain (not cleared)
      expect(localStorage.getItem('unauthorized-key')).toBe('value');
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('should return false when localStorage throws error', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      expect(isStorageAvailable()).toBe(false);

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Security validations', () => {
    it('should prevent storing JWT tokens', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token-data';
      const result = secureSetItem('app-language', token);
      expect(result).toBe(false);
    });

    it('should allow storing non-sensitive business IDs', () => {
      const result = secureSetItem('currentBusinessId', 'business-uuid-123');
      expect(result).toBe(true);
    });

    it('should allow storing language preferences', () => {
      const result = secureSetItem('app-language', 'en');
      expect(result).toBe(true);
    });

    it('should allow storing theme preferences', () => {
      const result = secureSetItem('colorTheme', 'protanopia');
      expect(result).toBe(true);
    });
  });
});
