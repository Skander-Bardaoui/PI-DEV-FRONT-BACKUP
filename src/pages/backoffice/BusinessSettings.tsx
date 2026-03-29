// src/pages/backoffice/BusinessSettings.tsx
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  DollarSign,
  Calendar,
  Settings as SettingsIcon
} from 'lucide-react';
import { 
  getMyBusinesses, 
  updateBusiness, 
  getBusinessSettings, 
  updateBusinessSettings 
} from '../../api/business.api';
import { toast } from 'sonner';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface Business {
  id: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  currency?: string;
  tax_rate?: number;
  address?: Address;
}

export default function BusinessSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

  // Business Info Form
  const [businessForm, setBusinessForm] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    currency: 'TND',
    tax_rate: 19,
  });

  // Address Form
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Tunisie',
  });

  // Settings Form
  const [settingsForm, setSettingsForm] = useState({
    invoice_prefix: 'INV-',
    payment_terms: 30,
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      loadBusinessData();
    }
  }, [selectedBusinessId]);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await getMyBusinesses();
      setBusinesses(data);
      
      if (data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des entreprises');
      console.error('Error loading businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessData = async () => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    if (!business) return;

    setBusinessForm({
      name: business.name || '',
      tax_id: business.tax_id || '',
      email: business.email || '',
      phone: business.phone || '',
      currency: business.currency || 'TND',
      tax_rate: business.tax_rate || 19,
    });

    if (business.address) {
      const addr = business.address as Address;
      setAddressForm({
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        postal_code: addr.postal_code || '',
        country: addr.country || 'Tunisie',
      });
    }

    // Load business settings
    try {
      const settings = await getBusinessSettings(selectedBusinessId);
      if (settings) {
        setSettingsForm({
          invoice_prefix: settings.invoice_prefix || 'INV-',
          payment_terms: settings.payment_terms || 30,
        });
      }
    } catch (error) {
      // Settings might not exist yet, use defaults
      console.log('No settings found, using defaults');
    }
  };

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessForm(prev => ({ 
      ...prev, 
      [name]: name === 'tax_rate' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettingsForm(prev => ({ 
      ...prev, 
      [name]: name === 'payment_terms' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSave = async () => {
    if (!selectedBusinessId) {
      toast.error('Aucune entreprise sélectionnée');
      return;
    }

    // Validation
    if (!businessForm.name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      return;
    }

    if (businessForm.tax_id && !/^[0-9]{7}\/[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/.test(businessForm.tax_id)) {
      toast.error('Format du matricule fiscal invalide (ex: 1234567/A/M/000)');
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        name: businessForm.name,
        tax_id: businessForm.tax_id || undefined,
        email: businessForm.email || undefined,
        phone: businessForm.phone || undefined,
        currency: businessForm.currency,
        tax_rate: businessForm.tax_rate,
        address: {
          street: addressForm.street || undefined,
          city: addressForm.city || undefined,
          state: addressForm.state || undefined,
          postal_code: addressForm.postal_code || undefined,
          country: addressForm.country || undefined,
        },
      };

      await updateBusiness(selectedBusinessId, updateData);
      
      // Update business settings
      await updateBusinessSettings(selectedBusinessId, {
        invoice_prefix: settingsForm.invoice_prefix,
        payment_terms: settingsForm.payment_terms,
      });
      
      await loadBusinesses();
      
      toast.success('Paramètres enregistrés avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
      console.error('Error saving business:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune entreprise trouvée
          </h2>
          <p className="text-gray-500">
            Vous devez d'abord créer une entreprise pour accéder aux paramètres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
        <p className="text-gray-500">Gérez les informations de votre entreprise</p>
      </div>

      {/* Business Selector */}
      {businesses.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une entreprise
          </label>
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {businesses.map(business => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Business Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600" />
          Informations générales
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={businessForm.name}
              onChange={handleBusinessInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Nom de votre entreprise"
              required
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Matricule Fiscal
              </div>
            </label>
            <input
              type="text"
              name="tax_id"
              value={businessForm.tax_id}
              onChange={handleBusinessInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="1234567/A/M/000"
            />
            <p className="text-xs text-gray-500 mt-1">Format: NNNNNNN/X/A/E/NNN</p>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Devise
              </div>
            </label>
            <select
              name="currency"
              value={businessForm.currency}
              onChange={handleBusinessInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="TND">TND - Dinar Tunisien</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Dollar US</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </div>
            </label>
            <input
              type="email"
              name="email"
              value={businessForm.email}
              onChange={handleBusinessInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="contact@entreprise.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                Téléphone
              </div>
            </label>
            <input
              type="tel"
              name="phone"
              value={businessForm.phone}
              onChange={handleBusinessInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="+216 XX XXX XXX"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taux de TVA par défaut (%)
            </label>
            <input
              type="number"
              name="tax_rate"
              value={businessForm.tax_rate}
              onChange={handleBusinessInputChange}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="19"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-600" />
          Adresse
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Street */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rue
            </label>
            <input
              type="text"
              name="street"
              value={addressForm.street}
              onChange={handleAddressInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Numéro et nom de rue"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              name="city"
              value={addressForm.city}
              onChange={handleAddressInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Ville"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gouvernorat / État
            </label>
            <input
              type="text"
              name="state"
              value={addressForm.state}
              onChange={handleAddressInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Gouvernorat"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal
            </label>
            <input
              type="text"
              name="postal_code"
              value={addressForm.postal_code}
              onChange={handleAddressInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="1000"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <input
              type="text"
              name="country"
              value={addressForm.country}
              onChange={handleAddressInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Tunisie"
            />
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-indigo-600" />
          Paramètres de facturation
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Invoice Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Préfixe des factures
              </div>
            </label>
            <input
              type="text"
              name="invoice_prefix"
              value={settingsForm.invoice_prefix}
              onChange={handleSettingsInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="INV-"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: INV-2026-001</p>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Délai de paiement (jours)
              </div>
            </label>
            <input
              type="number"
              name="payment_terms"
              value={settingsForm.payment_terms}
              onChange={handleSettingsInputChange}
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="30"
            />
            <p className="text-xs text-gray-500 mt-1">Nombre de jours par défaut</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}
