import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

interface ValidationError {
  field: string;
  message: string;
}

interface UseFormValidationReturn<T> {
  errors: Record<string, string>;
  validationErrors: ValidationError[];
  validate: (data: T) => boolean;
  validateField: (field: string | keyof T, value: any) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setFieldError: (field: keyof T, message: string) => void;
}

export function useFormValidation<T>(schema: ZodSchema<T>): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validate = useCallback((data: T): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      setValidationErrors([]);
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMap: Record<string, string> = {};
        const errorList: ValidationError[] = [];

        error.errors.forEach((err) => {
          const field = err.path.join('.');
          errorMap[field] = err.message;
          errorList.push({ field, message: err.message });
        });

        setErrors(errorMap);
        setValidationErrors(errorList);
      }
      return false;
    }
  }, [schema]);

  const validateField = useCallback((field: string | keyof T, value: any): boolean => {
    try {
      // Validate the entire form with the updated field value
      // This is more reliable than trying to pick individual fields from complex schemas
      const testData = { [field]: value } as Partial<T>;
      schema.partial().parse(testData);
      
      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      
      setValidationErrors((prev) => 
        prev.filter((err) => err.field !== field)
      );
      
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors[0]?.message || 'Validation error';
        
        setErrors((prev) => ({
          ...prev,
          [field as string]: errorMessage,
        }));
        
        setValidationErrors((prev) => {
          const filtered = prev.filter((err) => err.field !== field);
          return [...filtered, { field: field as string, message: errorMessage }];
        });
      }
      return false;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setValidationErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
    
    setValidationErrors((prev) => 
      prev.filter((err) => err.field !== field)
    );
  }, []);

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field as string]: message,
    }));
    
    setValidationErrors((prev) => {
      const filtered = prev.filter((err) => err.field !== field);
      return [...filtered, { field: field as string, message }];
    });
  }, []);

  return {
    errors,
    validationErrors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}
