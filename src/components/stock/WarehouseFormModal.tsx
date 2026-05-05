import { useState, useEffect } from 'react';
import { X, Warehouse, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { CreateWarehouseSchema, UpdateWarehouseSchema, type CreateWarehouseInput } from '../../validation/warehouse.schema';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldError, ValidationErrorDisplay } from '../common/ValidationErrorDisplay';
import { Warehouse as WarehouseType } from '../../types/warehouse';

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
  warehouse?: WarehouseType | null;
  mode: 'create' | 'edit';
}

export function WarehouseFormModal({
  isOpen,
  onClose,
  onSubmit,
  warehouse,
  mode,
}: WarehouseFormModalProps) {
  const schema = mode === 'create' ? CreateWarehouseSchema : UpdateWarehouseSchema;
  const { errors, validationErrors, validate, validateField, clearErrors } = useFormValidation(schema);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateWarehouseInput>>({
    name: '',
    code: '',
    description: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    is_active: true,
  });

  useEffect(() => {
    if (warehouse && mode === 'edit') {
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        description: warehouse.description || '',
        address: warehouse.address || '',
        latitude: warehouse.latitude || undefined,
        longitude: warehouse.longitude || undefined,
        is_active: warehouse.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        is_active: true,
      });
      clearErrors();
    }
  }, [warehouse, mode, isOpen, clearErrors]);

  const handleChange = (field: keyof CreateWarehouseInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Real-time validation for the field
    if (value !== '' && value !== null && value !== undefined) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entire form
    if (!validate(formData as CreateWarehouseInput)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData as CreateWarehouseInput);
      toast.success(mode === 'create' ? 'Entrepôt créé avec succès' : 'Entrepôt mis à jour avec succès');
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Une erreur est survenue';
      toast.error(errorMessage);
      
      // Handle backend validation errors
      if (error?.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Warehouse className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Nouvel Entrepôt' : 'Modifier l\'Entrepôt'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="p-6">
            {/* Validation Errors Summary */}
            {validationErrors.length > 0 && (
              <ValidationErrorDisplay errors={validationErrors} className="mb-6" />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entrepôt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Entrepôt Principal"
                  disabled={isSubmitting}
                  autoFocus
                />
                <FieldError error={errors.name} />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: WH-001"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.code} />
                <p className="mt-1 text-xs text-gray-500">
                  Lettres majuscules, chiffres, tirets et underscores uniquement
                </p>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 123 Rue de la Logistique, Tunis"
                    disabled={isSubmitting}
                  />
                </div>
                <FieldError error={errors.address} />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude ?? ''}
                  onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.latitude ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 36.806389"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.latitude} />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude ?? ''}
                  onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.longitude ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 10.181667"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.longitude} />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Description de l'entrepôt..."
                  disabled={isSubmitting}
                />
                <FieldError error={errors.description} />
              </div>

              {/* Active Checkbox */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Entrepôt actif</span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500">
                  Les entrepôts inactifs ne seront pas disponibles lors de la gestion des stocks
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === 'create' ? 'Création...' : 'Mise à jour...'}
                  </span>
                ) : (
                  mode === 'create' ? 'Créer l\'entrepôt' : 'Mettre à jour'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
