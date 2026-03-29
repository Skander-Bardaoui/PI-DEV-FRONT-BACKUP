// src/pages/backoffice/BusinessManagement.tsx
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2,
  X,
  Save,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  getMyBusinesses, 
  createBusiness, 
  updateBusiness, 
  deleteBusiness 
} from '../../api/business.api';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

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
  logo?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  currency?: string;
  tax_rate?: number;
  address?: Address;
}

const ITEMS_PER_PAGE = 5;

export default function BusinessManagement() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Check if user can delete businesses (only BUSINESS_OWNER)
  const canDelete = user?.role === 'BUSINESS_OWNER';

  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    currency: 'TND',
    tax_rate: 19,
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Tunisie',
    },
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await getMyBusinesses();
      setBusinesses(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des entreprises');
      console.error('Error loading businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (business?: Business) => {
    if (business) {
      setEditingBusiness(business);
      setFormData({
        name: business.name || '',
        tax_id: business.tax_id || '',
        email: business.email || '',
        phone: business.phone || '',
        currency: business.currency || 'TND',
        tax_rate: business.tax_rate || 19,
        address: {
          street: business.address?.street || '',
          city: business.address?.city || '',
          state: business.address?.state || '',
          postal_code: business.address?.postal_code || '',
          country: business.address?.country || 'Tunisie',
        },
      });
    } else {
      setEditingBusiness(null);
      setFormData({
        name: '',
        tax_id: '',
        email: '',
        phone: '',
        currency: 'TND',
        tax_rate: 19,
        address: {
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Tunisie',
        },
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBusiness(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else if (name === 'tax_rate') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value ? parseFloat(value) : 0
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Le nom de l\'entreprise est requis');
      return;
    }

    try {
      setIsSaving(true);

      // Build submit data - only include fields that have values
      const submitData: any = {
        name: formData.name,
        currency: formData.currency,
        tax_rate: formData.tax_rate,
        address: formData.address,
      };

      // Only add optional fields if they have values
      if (formData.tax_id?.trim()) {
        submitData.tax_id = formData.tax_id.trim();
      }
      if (formData.email?.trim()) {
        submitData.email = formData.email.trim();
      }
      if (formData.phone?.trim()) {
        submitData.phone = formData.phone.trim();
      }

      console.log('Submitting business data:', submitData);

      if (editingBusiness) {
        const result = await updateBusiness(editingBusiness.id, submitData);
        console.log('Update result:', result);
        toast.success(`"${formData.name}" mise à jour avec succès`);
      } else {
        const result = await createBusiness(submitData);
        console.log('Create result:', result);
        toast.success(`"${formData.name}" créée avec succès`);
      }

      await loadBusinesses();
      handleCloseModal();
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.message || 'Erreur lors de l\'enregistrement';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteBusiness(id);
      toast.success(`"${name}" supprimée avec succès`);
      await loadBusinesses();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(errorMsg);
      console.error('Error deleting business:', error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(businesses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBusinesses = businesses.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mes Entreprises</h2>
          <p className="text-sm text-gray-500">Gérez vos entreprises</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-5 w-5" />
          Nouvelle entreprise
        </button>
      </div>

      {/* Businesses List */}
      {businesses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune entreprise
          </h3>
          <p className="text-gray-500 mb-6">
            Commencez par créer votre première entreprise
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Créer une entreprise
          </button>
        </div>
      ) : (
        <>
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
            {currentBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Business Logo Circle */}
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-gray-100 shadow-sm">
                        {business.logo ? (
                          <img
                            src={`http://localhost:3001${business.logo}`}
                            alt={business.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xl font-bold">
                            {business.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {business.name}
                      </h3>
                      {business.tax_id && (
                        <p className="text-sm text-gray-500">
                          Matricule Fiscal: {business.tax_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(business)}
                      className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(business.id, business.name)}
                        className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {business.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg">
                        <Mail className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{business.email}</p>
                      </div>
                    </div>
                  )}

                  {business.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Téléphone</p>
                        <p className="text-sm font-medium text-gray-900">{business.phone}</p>
                      </div>
                    </div>
                  )}

                  {business.currency && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Devise</p>
                        <p className="text-sm font-medium text-gray-900">{business.currency}</p>
                      </div>
                    </div>
                  )}

                  {business.tax_rate !== null && business.tax_rate !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Taux de TVA</p>
                        <p className="text-sm font-medium text-gray-900">{business.tax_rate}%</p>
                      </div>
                    </div>
                  )}

                  {business.address?.city && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                      <div className="p-2 bg-white rounded-lg">
                        <MapPin className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Adresse</p>
                        <p className="text-sm font-medium text-gray-900">
                          {business.address.street && `${business.address.street}, `}
                          {business.address.postal_code && `${business.address.postal_code} `}
                          {business.address.city}
                          {business.address.state && `, ${business.address.state}`}
                          {business.address.country && ` - ${business.address.country}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages} ({businesses.length} entreprise{businesses.length > 1 ? 's' : ''})
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBusiness ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Informations générales</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matricule Fiscal
                    </label>
                    <input
                      type="text"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1234567/A/M/000"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Devise
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    >
                      <option value="TND">TND - Dinar Tunisien</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - Dollar US</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taux de TVA (%)
                    </label>
                    <input
                      type="number"
                      name="tax_rate"
                      value={formData.tax_rate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="19"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Adresse</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rue
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gouvernorat
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="address.postal_code"
                      value={formData.address.postal_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {editingBusiness ? 'Mettre à jour' : 'Créer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
