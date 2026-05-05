/**
 * Safe Operations Utilities
 * Wrapper functions to prevent runtime errors
 */

/**
 * Safely divide two numbers
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !isFinite(denominator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Safely calculate percentage
 */
export function safePercentage(value: number, total: number, decimals = 2): number {
  if (total === 0 || !isFinite(total) || !isFinite(value)) {
    return 0;
  }
  const percentage = (value / total) * 100;
  return isFinite(percentage) ? Number(percentage.toFixed(decimals)) : 0;
}

/**
 * Safely sum an array of numbers
 */
export function safeSum(numbers: number[]): number {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0;
  }
  return numbers.reduce((sum, num) => {
    const value = Number(num);
    return sum + (isFinite(value) ? value : 0);
  }, 0);
}

/**
 * Safely get average of numbers
 */
export function safeAverage(numbers: number[]): number {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0;
  }
  const validNumbers = numbers.filter(n => isFinite(Number(n)));
  if (validNumbers.length === 0) {
    return 0;
  }
  return safeSum(validNumbers) / validNumbers.length;
}

/**
 * Safely parse number from string
 */
export function safeParseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Safely parse integer from string
 */
export function safeParseInt(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return isFinite(value) ? Math.floor(value) : fallback;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Safely clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely round a number to decimals
 */
export function safeRound(value: number, decimals = 2): number {
  if (!isFinite(value)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Safely compare two values for equality
 */
export function safeEquals(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

/**
 * Safely deep clone an object
 */
export function safeClone<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return null;
  }
}

/**
 * Safely merge objects
 */
export function safeMerge<T extends object>(...objects: Partial<T>[]): T {
  try {
    return Object.assign({}, ...objects) as T;
  } catch {
    return {} as T;
  }
}
