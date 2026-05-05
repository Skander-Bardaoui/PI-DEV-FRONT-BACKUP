/**
 * Error Handler Hook
 * Centralized error handling to improve reliability
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  context?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToConsole = true,
      context = 'Application',
    } = options;

    // Extract error message safely
    let message = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error);
    }

    // Show toast notification
    if (showToast) {
      toast.error(message, {
        duration: 5000,
      });
    }

    return message;
  }, []);

  const handleApiError = useCallback((error: unknown, context?: string) => {
    // Handle API-specific errors
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      const status = apiError.response?.status;
      const data = apiError.response?.data;

      let message = 'API request failed';

      if (status === 401) {
        message = 'Unauthorized. Please log in again.';
      } else if (status === 403) {
        message = 'Access denied. You don\'t have permission.';
      } else if (status === 404) {
        message = 'Resource not found.';
      } else if (status === 500) {
        message = 'Server error. Please try again later.';
      } else if (data?.message) {
        message = data.message;
      }

      return handleError(new Error(message), { context });
    }

    return handleError(error, { context });
  }, [handleError]);

  return {
    handleError,
    handleApiError,
  };
}
