// src/pages/frontoffice/RegisterPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Briefcase, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

    acceptTerms: false
  });

  const validateTaxId = (taxId: string): boolean => {
    if (!taxId) return true;
    const taxIdRegex = /^[0-9]{7}\/[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/;
    return taxIdRegex.test(taxId);
  };

  const validateTunisianPostalCode = (postalCode: string): boolean => {
    if (!postalCode || postalCode.trim() === '') return true;
    const trimmed = postalCode.trim();
    return /^\d{4}$/.test(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.firstName?.trim() || formData.firstName.trim().length < 2) {
        setError('Le prénom doit contenir au moins 2 caractères');
        return;
      }
      if (!formData.lastName?.trim() || formData.lastName.trim().length < 2) {
        setError('Le nom doit contenir au moins 2 caractères');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (formData.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      setStep(2);
    } 
    else if (step === 2) {
      if (!formData.tenantName?.trim() || formData.tenantName.trim().length < 2) {
        setError('Le nom du tenant doit contenir au moins 2 caractères');
        return;
      }
      setStep(3);
    } 
    else {
      // Final Step 3
      if (!formData.businessName?.trim() || formData.businessName.trim().length < 2) {
        setError('Le nom de l\'entreprise doit contenir au moins 2 caractères');
        return;
      }
      if (formData.tax_id && !validateTaxId(formData.tax_id)) {
        setError('Le matricule fiscal doit suivre le format: NNNNNNN/X/A/E/NNN');
        return;
      }
      if (!validateTunisianPostalCode(formData.address.postalCode)) {
        setError('Le code postal doit contenir exactement 4 chiffres (ex: 4000 pour Sousse)');
        return;
      }
      if (formData.taxRate < 0 || formData.taxRate > 100) {
        setError('Le taux de TVA doit être entre 0 et 100');
        return;
      }
      if (!formData.acceptTerms) {
        setError('Vous devez accepter les conditions d\'utilisation');
        return;
      }

      setIsLoading(true);

      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number?.trim() || undefined,

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
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">NovEntra</span>
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Compte</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200">
              <div className={`h-full bg-indigo-600 transition-all ${step > 1 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Tenant</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200">
              <div className={`h-full bg-indigo-600 transition-all ${step > 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Entreprise</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Créez votre compte' : step === 2 ? 'Configuration Tenant' : 'Informations entreprise'}
          </h1>
          <p className="text-gray-600 mb-8">
            {step === 1
              ? 'Commencez votre essai gratuit de 14 jours.'
              : step === 2
              ? 'Configurez votre espace de travail.'
              : 'Finalisez les détails de votre entreprise.'
            }
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Jean"
                        required
                        minLength={2}
                        maxLength={50}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Dupont"
                        required
                        minLength={2}
                        maxLength={50}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="vous@exemple.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone (optionnel)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+216 XX XXX XXX"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Minimum 8 caractères"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Confirmez votre mot de passe"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            ) : step === 2 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du Tenant</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.tenantName}
                      onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Mon Organisation"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Le nom de votre espace de travail</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domaine (optionnel)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="monentreprise"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Sous-domaine personnalisé pour votre tenant</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email de contact (optionnel)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="contact@exemple.com"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Par défaut, votre email sera utilisé</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Décrivez votre organisation..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ma Société SARL"
                      required
                      minLength={2}
                      maxLength={200}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de l'entreprise (optionnel)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="contact@mon-entreprise.tn"
                    disabled={isLoading}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Affiché dans les bons de commande envoyés aux fournisseurs
                </p>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Matricule Fiscal (optionnel)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="1234567/A/M/E/000"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Format: NNNNNNN/X/A/E/NNN</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isLoading}
                    >
                      <option value="TND">TND - Dinar Tunisien</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taux TVA (%)</label>
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="19"
                      min={0}
                      max={100}
                      step={0.01}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      address: { ...formData.address, street: e.target.value } 
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                    placeholder="Rue et numéro"
                    disabled={isLoading}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value } 
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ville (ex: Sousse)"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, postalCode: e.target.value } 
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Code postal (ex: 4000)"
                      maxLength={4}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Le code postal tunisien doit contenir exactement 4 chiffres
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="w-4 h-4 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    J'accepte les{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Conditions d'utilisation</a>
                    {' '}et la{' '}
                    <a href="#" className="text-indigo-600 hover:underline">Politique de confidentialité</a>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Création en cours...
                </>
              ) : (
                <>
                  {step < 3 ? 'Continuer' : 'Créer mon compte'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
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

      {/* Right Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <div className="max-w-lg">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Pourquoi choisir NovEntra ?</h2>
            <div className="space-y-6">
              {[
                {
                  title: 'Configuration en 5 minutes',
                  desc: 'Commencez à facturer vos clients immédiatement'
                },
                {
                  title: 'Données sécurisées en Tunisie',
                  desc: 'Vos données restent sur des serveurs tunisiens'
                },
                {
                  title: 'Support en français et arabe',
                  desc: 'Une équipe locale à votre écoute'
                },
                {
                  title: 'Essai gratuit 14 jours',
                  desc: 'Sans carte bancaire requise'
                }
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-indigo-200 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}