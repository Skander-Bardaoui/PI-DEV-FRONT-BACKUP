import { AlertCircle } from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  className?: string;
}

export function ValidationErrorDisplay({ errors, className = '' }: ValidationErrorDisplayProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            Erreur de validation
          </h3>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                <span className="font-medium">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className = '' }: FieldErrorProps) {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-1.5 mt-1 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );
}

interface FieldSuccessProps {
  message: string;
  className?: string;
}

export function FieldSuccess({ message, className = '' }: FieldSuccessProps) {
  return (
    <div className={`flex items-center gap-1.5 mt-1 ${className}`}>
      <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <p className="text-sm text-green-600">{message}</p>
    </div>
  );
}
