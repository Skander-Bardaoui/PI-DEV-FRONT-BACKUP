/**
 * Safe Async Hook
 * Prevents memory leaks and handles errors in async operations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface UseSafeAsyncOptions {
  onError?: (error: unknown) => void;
  context?: string;
}

export function useSafeAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseSafeAsyncOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await asyncFunction();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
      }

      return result;
    } catch (err) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (options.onError) {
          options.onError(err);
        } else {
          handleError(err, { context: options.context });
        }
      }

      throw err;
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction, options, handleError]);

  return {
    data,
    loading,
    error,
    execute,
  };
}
