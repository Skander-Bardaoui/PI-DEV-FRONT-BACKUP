import React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  defaultCountry?: string;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  label = 'Numéro de téléphone',
  placeholder = 'Entrez votre numéro',
  defaultCountry = 'TN', // Tunisia by default
}: PhoneInputProps) {
  const [touched, setTouched] = React.useState(false);

  // Validate phone number
  const isValid = value ? isValidPhoneNumber(value) : !required;
  const showError = touched && !isValid && value;

  // Get formatted info
  let countryCode = '';
  let nationalNumber = '';
  let country = '';

  if (value) {
    try {
      const phoneNumber = parsePhoneNumber(value);
      if (phoneNumber) {
        countryCode = `+${phoneNumber.countryCallingCode}`;
        nationalNumber = phoneNumber.nationalNumber;
        country = phoneNumber.country || '';
      }
    } catch (e) {
      // Invalid phone number
    }
  }

  const handleChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="phone-input-wrapper">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <PhoneInputWithCountry
          international
          defaultCountry={defaultCountry as any}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`phone-input ${error || showError ? 'phone-input-error' : ''} ${
            disabled ? 'phone-input-disabled' : ''
          }`}
        />

        {/* Validation Icon */}
        {value && touched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {isValid ? (
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {(error || showError) && (
        <div className="mt-1 flex items-start gap-1">
          <svg
            className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-600">
            {error || 'Numéro de téléphone invalide pour ce pays'}
          </p>
        </div>
      )}

      {/* Helper Text */}
      {!error && !showError && value && isValid && (
        <p className="mt-1 text-xs text-gray-500">
          Format international: {value}
          {country && ` (${country})`}
        </p>
      )}

      {/* Placeholder Helper */}
      {!value && !error && (
        <p className="mt-1 text-xs text-gray-500">
          Sélectionnez votre pays et entrez votre numéro
        </p>
      )}
    </div>
  );
}

// Export validation function for use in forms
export { isValidPhoneNumber, parsePhoneNumber };
