/**
 * Secure Storage Utility
 * Wrapper around localStorage with security best practices
 * 
 * Security considerations:
 * - Only stores non-sensitive data (preferences, UI state)
 * - Never stores authentication tokens (use httpOnly cookies instead)
 * - Validates data before storage
 * - Handles errors gracefully
 */

const ALLOWED_KEYS = [
  'app-language',
  'accessibility-settings',
  'colorTheme',
  'readingMode',
  'currentBusinessId', // Non-sensitive, for UX only
] as const;

type AllowedKey = typeof ALLOWED_KEYS[number];

/**
 * Securely store non-sensitive data in localStorage
 * @param key - Storage key (must be in allowed list)
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function secureSetItem(key: AllowedKey, value: string): boolean {
  try {
    if (!ALLOWED_KEYS.includes(key)) {
      console.warn(`[SecureStorage] Attempted to store disallowed key: ${key}`);
      return false;
    }

    // Validate that we're not storing sensitive data
    if (value.includes('token') || value.includes('password') || value.includes('secret')) {
      console.error(`[SecureStorage] Attempted to store sensitive data in key: ${key}`);
      return false;
    }

    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[SecureStorage] Error storing ${key}:`, error);
    return false;
  }
}

/**
 * Securely retrieve data from localStorage
 * @param key - Storage key
 * @returns Stored value or null
 */
export function secureGetItem(key: AllowedKey): string | null {
  try {
    if (!ALLOWED_KEYS.includes(key)) {
      console.warn(`[SecureStorage] Attempted to access disallowed key: ${key}`);
      return null;
    }

    return localStorage.getItem(key);
  } catch (error) {
    console.error(`[SecureStorage] Error retrieving ${key}:`, error);
    return null;
  }
}

/**
 * Securely remove data from localStorage
 * @param key - Storage key
 * @returns true if successful, false otherwise
 */
export function secureRemoveItem(key: AllowedKey): boolean {
  try {
    if (!ALLOWED_KEYS.includes(key)) {
      console.warn(`[SecureStorage] Attempted to remove disallowed key: ${key}`);
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[SecureStorage] Error removing ${key}:`, error);
    return false;
  }
}

/**
 * Clear all allowed storage keys
 * @returns true if successful, false otherwise
 */
export function secureClearAll(): boolean {
  try {
    ALLOWED_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('[SecureStorage] Error clearing storage:', error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns true if available, false otherwise
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Export for documentation purposes
export const SECURITY_NOTES = {
  NEVER_STORE: [
    'Authentication tokens (use httpOnly cookies)',
    'Passwords or credentials',
    'API keys or secrets',
    'Personal Identifiable Information (PII)',
    'Credit card information',
    'Social security numbers',
  ],
  SAFE_TO_STORE: [
    'User preferences (language, theme)',
    'UI state (collapsed panels, selected tabs)',
    'Non-sensitive IDs (for UX, not security)',
    'Feature flags',
    'Analytics opt-in/out',
  ],
  BEST_PRACTICES: [
    'Always validate data before storage',
    'Use httpOnly cookies for sensitive data',
    'Implement Content Security Policy (CSP)',
    'Sanitize all user inputs',
    'Use HTTPS in production',
    'Regular security audits',
  ],
};
