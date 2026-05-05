// src/pages/frontoffice/LoginPage.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { loginSchema, LoginFormData } from '../../schemas/auth.schemas';

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
  `w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all ${
    error
      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-200 focus:border-indigo-500'
  }`;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  // Check if redirected from successful registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Inscription réussie ! Veuillez vous connecter avec vos identifiants.');
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      // Navigation handled by AuthContext based on user role
    } catch (err: any) {
      setError('root', {
        message: err.message || t('errors.generic'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          ></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                NovEntra
              </span>
            </Link>
            <LanguageSwitcher variant="page" />
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('auth.login')}</h1>
            <p className="text-lg text-gray-600">{t('dashboard.welcome')}</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition duration-300"></div>
              <div className="relative p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 shadow-lg">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Global Error Message */}
          {errors.root && (
            <div className="mb-6 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition duration-300"></div>
              <div className="relative p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 shadow-lg">
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{errors.root.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors Summary */}
          {Object.keys(errors).length > 0 && !errors.root && (
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Field label={t('auth.email')} error={errors.email?.message} required>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  {...registerField('email')}
                  className={inputCls(errors.email?.message)}
                  placeholder="vous@exemple.com"
                  disabled={isSubmitting}
                />
              </div>
            </Field>

            <Field label={t('auth.password')} error={errors.password?.message} required>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerField('password')}
                  className={inputCls(errors.password?.message)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...registerField('remember')}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-600">{t('auth.rememberMe')}</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
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
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('auth.loading')}
                  </>
                ) : (
                  <>
                    {t('auth.loginButton')}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 text-gray-500">
                  {t('common.or', { defaultValue: 'Ou continuer avec' })}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'https://pi-dev-backend.onrender.com'}/auth/google`}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 group"
              >
                <svg
                  className="h-6 w-6 group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-base font-semibold text-gray-700 group-hover:text-gray-900">
                  {t('auth.continueWithGoogle', { defaultValue: 'Continuer avec Google' })}
                </span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              {t('auth.registerButton')}
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
                  {t('landing.hero.title', {
                    defaultValue: "Gérez vos finances d'entreprise en toute simplicité",
                  })}
                </h2>
                <p className="text-indigo-100 text-lg">
                  {t('landing.hero.subtitle', {
                    defaultValue:
                      'Rejoignez plus de 2,500 entreprises tunisiennes qui utilisent NovEntra pour leur gestion quotidienne.',
                  })}
                </p>
              </div>

              <div className="space-y-5">
                {[
                  {
                    icon: '📊',
                    title: t('landing.features.invoicing', {
                      defaultValue: 'Facturation professionnelle en quelques clics',
                    }),
                    desc: 'Créez et envoyez des factures en quelques secondes',
                  },
                  {
                    icon: '💰',
                    title: t('landing.features.expenses', {
                      defaultValue: 'Suivi des dépenses automatisé',
                    }),
                    desc: 'Gardez le contrôle total de vos finances',
                  },
                  {
                    icon: '📈',
                    title: t('landing.features.reports', {
                      defaultValue: 'Rapports et analytics en temps réel',
                    }),
                    desc: 'Prenez des décisions éclairées avec des données précises',
                  },
                  {
                    icon: '🎯',
                    title: t('landing.features.support', {
                      defaultValue: 'Support client disponible 24/7',
                    }),
                    desc: 'Une équipe dédiée pour vous accompagner',
                  },
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
