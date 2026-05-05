// src/pages/frontoffice/RegisterPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Briefcase, 
  FileText,
  XCircle,
  CreditCard,
  Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PhoneInput from '../../components/common/PhoneInput';
import AddressAutocomplete, { AddressData } from '../../components/common/AddressAutocomplete';
import { plansApi } from '../../api/plans.api';
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  registerStep4Schema,
} from '../../schemas/auth.schemas';

// Field component with error display
const Field = ({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-start gap-1.5 mt-1.5">
        <svg
          className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-red-600 text-xs font-medium">{error}</p>
      </div>
    )}
  </div>
);

const inputCls = (error?: string) =>
  `w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
    error
      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-200 focus:border-indigo-500'
  }`;

export default function RegisterPage() {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',

    tenantName: '',
    domain: '',
    contactEmail: '',
    description: '',

    businessName: '',
    businessEmail: '',
    logo: '',
    tax_id: '',
    currency: 'TND',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Tunisia'
    },

    taxRateName: 'TVA Standard',
    taxRate: 19,

    planId: '',
    billingCycle: 'monthly' as 'monthly' | 'annual',

    acceptTerms: false
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  // Fetch plans when component mounts
  useEffect(() => {
    const fetchPlans = async () => {
      setPlansLoading(true);
      try {
        const fetchedPlans = await plansApi.getPublicPlans();
        // Include all plans (Free, Standard, Premium)
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setError('Impossible de charger les plans. Veuillez réessayer.');
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Prevent double submission
    if (isSubmitting) {
      console.log('Form already submitting, ignoring duplicate submission');
      return;
    }

    if (step === 1) {
      // Validate Step 1 with Zod
      const result = registerStep1Schema.safeParse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        // Scroll to first error
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }
      setStep(2);
    } 
    else if (step === 2) {
      // Validate Step 2 with Zod
      const result = registerStep2Schema.safeParse({
        tenantName: formData.tenantName,
        domain: formData.domain,
        contactEmail: formData.contactEmail,
        description: formData.description,
      });

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }
      setStep(3);
    } 
    else if (step === 3) {
      // Validate Step 3 with Zod
      const result = registerStep3Schema.safeParse({
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        tax_id: formData.tax_id,
        currency: formData.currency,
        address: formData.address,
        taxRateName: formData.taxRateName,
        taxRate: formData.taxRate,
      });

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setValidationErrors(errors);
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }
      setStep(4);
    }
    else {
      // Final Step 4 - Validate and submit
      const result = registerStep4Schema.safeParse({
        planId: formData.planId,
        billingCycle: formData.billingCycle,
        acceptTerms: formData.acceptTerms,
      });

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        setError(Object.values(errors)[0] || 'Veuillez corriger les erreurs');
        return;
      }

      setIsLoading(true);
      setIsSubmitting(true);

      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number?.trim() || undefined,

        planId: formData.planId,
        billingCycle: formData.billingCycle,

        tenant: {
          name: formData.tenantName.trim(),
          domain: formData.domain?.trim() || undefined,
          contactEmail: formData.contactEmail?.trim() || formData.email,
          description: formData.description?.trim() || undefined,
        },

        business: {
          name: formData.businessName.trim(),
          logo: formData.logo || undefined,
          tax_id: formData.tax_id?.trim() || undefined,
          currency: formData.currency,
          address: {
            street: formData.address.street.trim(),
            city: formData.address.city.trim(),
            postalCode: formData.address.postalCode.trim(),
            country: formData.address.country,
          },
        },

        taxRate: {
          name: formData.taxRateName,
          rate: formData.taxRate,
          is_default: true,
        },
      };

      try {
        await register(registrationData);
        // Success - navigation is handled by AuthContext
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription');
        setIsSubmitting(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              NovEntra
            </span>
          </Link>

          {/* Progress Steps - Enhanced */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all ${
                step >= 1 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Compte</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ${step > 1 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all ${
                step >= 2 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
              </div>
              <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Tenant</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ${step > 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all ${
                step >= 3 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
              </div>
              <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Entreprise</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ${step > 3 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all ${
                step >= 4 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
              }`}>
                4
              </div>
              <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Plan</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {step === 1 ? 'Créez votre compte' : step === 2 ? 'Configuration Tenant' : step === 3 ? 'Informations entreprise' : 'Choisissez votre plan'}
            </h1>
            <p className="text-lg text-gray-600">
              {step === 1
                ? 'Commencez votre essai gratuit de 14 jours.'
                : step === 2
                ? 'Configurez votre espace de travail.'
                : step === 3
                ? 'Finalisez les détails de votre entreprise.'
                : 'Sélectionnez le plan qui correspond à vos besoins.'
              }
            </p>
          </div>

          {/* Error Message - Enhanced */}
          {error && (
            <div className="mb-6 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition duration-300"></div>
              <div className="relative p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-lg">
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(validationErrors).length > 0 && !error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Erreurs de validation
                  </h3>
                  <p className="text-sm text-red-700">
                    Veuillez corriger les erreurs ci-dessous avant de continuer.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom" error={validationErrors.firstName} required>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                          validationErrors.firstName
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-indigo-500'
                        }`}
                        placeholder="Jean"
                        disabled={isLoading}
                      />
                    </div>
                  </Field>

                  <Field label="Nom" error={validationErrors.lastName} required>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                          validationErrors.lastName
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-indigo-500'
                        }`}
                        placeholder="Dupont"
                        disabled={isLoading}
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Email" error={validationErrors.email} required>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.email
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="vous@exemple.com"
                      disabled={isLoading}
                    />
                  </div>
                </Field>

                <div>
                  <PhoneInput
                    value={formData.phone_number}
                    onChange={(value) => setFormData({ ...formData, phone_number: value || '' })}
                    label="Téléphone (optionnel)"
                    placeholder="Entrez votre numéro"
                    defaultCountry="TN"
                    disabled={isLoading}
                    required={false}
                  />
                  {validationErrors.phone_number && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <svg
                        className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-red-600 text-xs font-medium">{validationErrors.phone_number}</p>
                    </div>
                  )}
                </div>

                <Field label="Mot de passe" error={validationErrors.password} required>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.password
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Minimum 8 caractères"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {formData.password && !validationErrors.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength
                                ? passwordStrength === 1
                                  ? 'bg-red-500'
                                  : passwordStrength === 2
                                  ? 'bg-orange-500'
                                  : passwordStrength === 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength === 1
                          ? 'text-red-600'
                          : passwordStrength === 2
                          ? 'text-orange-600'
                          : passwordStrength === 3
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {passwordStrength === 0 && 'Entrez un mot de passe'}
                        {passwordStrength === 1 && 'Faible'}
                        {passwordStrength === 2 && 'Moyen'}
                        {passwordStrength === 3 && 'Bon'}
                        {passwordStrength === 4 && 'Excellent'}
                      </p>
                    </div>
                  )}
                </Field>

                <Field label="Confirmer le mot de passe" error={validationErrors.confirmPassword} required>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.confirmPassword
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Confirmez votre mot de passe"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && !validationErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && !validationErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Les mots de passe correspondent
                    </p>
                  )}
                </Field>
              </>
            ) : step === 2 ? (
              <>
                <Field label="Nom du Tenant" error={validationErrors.tenantName} required>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="tenantName"
                      value={formData.tenantName}
                      onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.tenantName
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Mon Organisation"
                      disabled={isLoading}
                    />
                  </div>
                  {!validationErrors.tenantName && (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-indigo-500" />
                      Le nom de votre espace de travail
                    </p>
                  )}
                </Field>

                <Field label="Domaine (optionnel)" error={validationErrors.domain}>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.domain
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="monentreprise"
                      disabled={isLoading}
                    />
                  </div>
                  {!validationErrors.domain && (
                    <p className="mt-1.5 text-xs text-gray-500">Sous-domaine personnalisé pour votre tenant</p>
                  )}
                </Field>

                <Field label="Email de contact (optionnel)" error={validationErrors.contactEmail}>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.contactEmail
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="contact@exemple.com"
                      disabled={isLoading}
                    />
                  </div>
                  {!validationErrors.contactEmail && (
                    <p className="mt-1.5 text-xs text-gray-500">Par défaut, votre email sera utilisé</p>
                  )}
                </Field>

                <Field label="Description (optionnel)" error={validationErrors.description}>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      validationErrors.description
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-200 focus:border-indigo-500'
                    }`}
                    placeholder="Décrivez votre organisation..."
                    rows={3}
                    disabled={isLoading}
                  />
                </Field>
              </>
            ) : step === 3 ? (
              <>
                <Field label="Nom de l'entreprise" error={validationErrors.businessName} required>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.businessName
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Ma Société SARL"
                      disabled={isLoading}
                    />
                  </div>
                </Field>

                <Field label="Email de l'entreprise (optionnel)" error={validationErrors.businessEmail}>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      name="businessEmail"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.businessEmail
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="contact@mon-entreprise.tn"
                      disabled={isLoading}
                    />
                  </div>
                  {!validationErrors.businessEmail && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Affiché dans les bons de commande envoyés aux fournisseurs
                    </p>
                  )}
                </Field>

                <Field label="Matricule Fiscal (optionnel)" error={validationErrors.tax_id}>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.tax_id
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="1234567/A/M/E/000"
                      disabled={isLoading}
                    />
                  </div>
                  {!validationErrors.tax_id && (
                    <p className="mt-1.5 text-xs text-gray-500">Format: NNNNNNN/X/A/E/NNN</p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Devise" error={validationErrors.currency} required>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.currency
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      disabled={isLoading}
                    >
                      <option value="TND">TND - Dinar Tunisien</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - Dollar</option>
                    </select>
                  </Field>

                  <Field label="Taux TVA (%)" error={validationErrors.taxRate} required>
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        validationErrors.taxRate
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="19"
                      min={0}
                      max={100}
                      step={0.01}
                      disabled={isLoading}
                    />
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse <span className="text-red-500">*</span>
                  </label>
                  <AddressAutocomplete
                    value={{
                      street: formData.address.street,
                      city: formData.address.city,
                      postalCode: formData.address.postalCode,
                      country: formData.address.country,
                    }}
                    onChange={(address: AddressData) => {
                      setFormData({
                        ...formData,
                        address: {
                          street: address.street,
                          city: address.city,
                          postalCode: address.postalCode,
                          country: address.country,
                        },
                      });
                    }}
                    disabled={isLoading}
                    required={false}
                  />
                  {/* Display address validation errors */}
                  {(validationErrors['address.street'] || 
                    validationErrors['address.city'] || 
                    validationErrors['address.postalCode'] || 
                    validationErrors['address.country']) && (
                    <div className="mt-2 space-y-1">
                      {validationErrors['address.street'] && (
                        <div className="flex items-start gap-1.5">
                          <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-red-600 text-xs font-medium">{validationErrors['address.street']}</p>
                        </div>
                      )}
                      {validationErrors['address.city'] && (
                        <div className="flex items-start gap-1.5">
                          <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-red-600 text-xs font-medium">{validationErrors['address.city']}</p>
                        </div>
                      )}
                      {validationErrors['address.postalCode'] && (
                        <div className="flex items-start gap-1.5">
                          <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-red-600 text-xs font-medium">{validationErrors['address.postalCode']}</p>
                        </div>
                      )}
                      {validationErrors['address.country'] && (
                        <div className="flex items-start gap-1.5">
                          <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-red-600 text-xs font-medium">{validationErrors['address.country']}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : step === 4 ? (
              <>
                {/* Billing Cycle Toggle */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('monthly');
                      setFormData({ ...formData, billingCycle: 'monthly' });
                    }}
                    className={`px-6 py-2 rounded-full font-semibold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={isLoading}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('annual');
                      setFormData({ ...formData, billingCycle: 'annual' });
                    }}
                    className={`px-6 py-2 rounded-full font-semibold transition-all ${
                      billingCycle === 'annual'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={isLoading}
                  >
                    Annuel
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">-17%</span>
                  </button>
                </div>

                {/* Plans Grid */}
                {plansLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Aucun plan disponible pour le moment.
                  </div>
                ) : (
                  <>
                    {validationErrors.planId && (
                      <div className="flex items-start gap-1.5 mb-4">
                        <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-600 text-xs font-medium">{validationErrors.planId}</p>
                      </div>
                    )}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {plans.map((plan) => {
                      const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual;
                      const isSelected = formData.planId === plan.id;
                      
                      // Slug-based feature display
                      const getPlanDisplay = (slug: string) => {
                        switch (slug) {
                          case 'free':
                            return {
                              badge: { text: 'Gratuit', color: 'bg-green-500' },
                              isPopular: false,
                              priceDisplay: 'Gratuit',
                              subtitle: '7 jours d\'essai gratuit — accès complet',
                              features: [
                                { icon: '✅', text: 'Accès complet à la plateforme' },
                                { icon: '✅', text: 'Toutes les fonctionnalités' },
                                { icon: '⏱', text: 'Durée: 7 jours' },
                                { icon: '❌', text: 'IA non incluse' },
                              ]
                            };
                          case 'standard':
                            return {
                              badge: { text: 'Standard', color: 'bg-blue-500' },
                              isPopular: false,
                              priceDisplay: `${Number(price).toFixed(0)} TND`,
                              subtitle: 'Pour les petites entreprises',
                              features: [
                                { icon: '✅', text: 'Accès complet à la plateforme' },
                                { icon: '✅', text: 'Toutes les fonctionnalités' },
                                { icon: '❌', text: 'IA non incluse' },
                              ]
                            };
                          case 'premium':
                            return {
                              badge: { text: 'Premium', color: 'bg-purple-500' },
                              isPopular: true,
                              priceDisplay: `${Number(price).toFixed(0)} TND`,
                              subtitle: 'Pour les entreprises avancées',
                              features: [
                                { icon: '✅', text: 'Accès complet à la plateforme' },
                                { icon: '✅', text: 'Toutes les fonctionnalités' },
                                { icon: '✅', text: 'IA illimitée incluse' },
                              ]
                            };
                          default:
                            // Fallback for unknown plans
                            return {
                              badge: { text: plan.name, color: 'bg-gray-500' },
                              isPopular: false,
                              priceDisplay: `${Number(price).toFixed(0)} TND`,
                              subtitle: '',
                              features: Array.isArray(plan.features) ? plan.features.map((f: string) => ({ icon: '✅', text: f })) : []
                            };
                        }
                      };

                      const planDisplay = getPlanDisplay(plan.slug);

                      return (
                        <div
                          key={plan.id}
                          onClick={() => setFormData({ ...formData, planId: plan.id })}
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                              : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                          } ${planDisplay.isPopular ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          {planDisplay.isPopular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              Recommandé
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <span className={`${planDisplay.badge.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                                  {planDisplay.badge.text}
                                </span>
                              </div>
                              {planDisplay.subtitle && (
                                <p className="text-sm text-gray-500 mb-2">{planDisplay.subtitle}</p>
                              )}
                              <div className="mt-2">
                                {plan.slug === 'free' ? (
                                  <span className="text-3xl font-bold text-green-600">{planDisplay.priceDisplay}</span>
                                ) : (
                                  <>
                                    <span className="text-3xl font-bold text-indigo-600">{planDisplay.priceDisplay}</span>
                                    <span className="text-gray-500 ml-1">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <CheckCircle className="h-5 w-5 text-white" />}
                            </div>
                          </div>

                          <ul className="space-y-2">
                            {planDisplay.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-base">{feature.icon}</span>
                                <span>{feature.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    </div>
                  </>
                )}

                <div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className={`w-4 h-4 mt-1 text-indigo-600 rounded focus:ring-indigo-500 ${
                        validationErrors.acceptTerms
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      J'accepte les{' '}
                      <a href="#" className="text-indigo-600 hover:underline">Conditions d'utilisation</a>
                      {' '}et la{' '}
                      <a href="#" className="text-indigo-600 hover:underline">Politique de confidentialité</a>
                    </label>
                  </div>
                  {validationErrors.acceptTerms && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-600 text-xs font-medium">{validationErrors.acceptTerms}</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full group overflow-hidden rounded-xl font-semibold py-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300 group-hover:scale-105"></div>
              
              {/* Animated shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              {/* Button content */}
              <span className="relative flex items-center justify-center gap-2 text-white">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    {step < 4 ? 'Continuer' : 'Créer mon compte'}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>

            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
                className="w-full text-gray-600 py-3 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Retour
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Enhanced */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600"></div>
        
        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-center p-12 w-full">
          <div className="max-w-lg w-full">
            {/* Main card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white shadow-2xl border border-white/20">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                  Pourquoi choisir NovEntra ?
                </h2>
                <p className="text-indigo-100 text-lg">
                  La solution complète pour votre entreprise
                </p>
              </div>

              <div className="space-y-5">
                {[
                  {
                    icon: '⚡',
                    title: 'Configuration en 5 minutes',
                    desc: 'Commencez à facturer vos clients immédiatement'
                  },
                  {
                    icon: '🔒',
                    title: 'Données sécurisées en Tunisie',
                    desc: 'Vos données restent sur des serveurs tunisiens'
                  },
                  {
                    icon: '🌍',
                    title: 'Support en français et arabe',
                    desc: 'Une équipe locale à votre écoute'
                  },
                  {
                    icon: '🎁',
                    title: 'Essai gratuit 14 jours',
                    desc: 'Sans carte bancaire requise'
                  }
                ].map((item, index) => (
                  <div 
                    key={item.title} 
                    className="flex gap-4 group hover:translate-x-2 transition-transform duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-indigo-100 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats section */}
              <div className="mt-8 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="group hover:scale-105 transition-transform">
                    <div className="text-3xl font-bold mb-1">2.5K+</div>
                    <div className="text-indigo-100 text-xs">Entreprises</div>
                  </div>
                  <div className="group hover:scale-105 transition-transform">
                    <div className="text-3xl font-bold mb-1">50K+</div>
                    <div className="text-indigo-100 text-xs">Factures</div>
                  </div>
                  <div className="group hover:scale-105 transition-transform">
                    <div className="text-3xl font-bold mb-1">99.9%</div>
                    <div className="text-indigo-100 text-xs">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}