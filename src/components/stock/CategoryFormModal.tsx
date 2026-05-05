import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCategorySchema, UpdateCategorySchema, type CreateCategoryInput, CategoryTypeSchema } from '../../validation/category.schema';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldError, ValidationErrorDisplay } from '../common/ValidationErrorDisplay';
import { Category } from '../../types/category';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryInput) => Promise<void>;
  category?: Category | null;
  mode: 'create' | 'edit';
  categoryType: 'PRODUCT' | 'SERVICE'; // Fixed type, not editable
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  mode,
  categoryType, // Receive as prop
}: CategoryFormModalProps) {
  const schema = mode === 'create' ? CreateCategorySchema : UpdateCategorySchema;
  const { errors, validationErrors, validate, validateField, clearErrors } = useFormValidation(schema);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateCategoryInput>>({
    name: '',
    description: '',
    category_type: categoryType, // Use prop value
    is_active: true,
  });

  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name,
        description: category.description || '',
        category_type: categoryType, // Always use the prop value
        is_active: category.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category_type: categoryType, // Use prop value
        is_active: true,
      });
      clearErrors();
    }
  }, [category, mode, isOpen, categoryType, clearErrors]);

  const handleChange = (field: keyof CreateCategoryInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Real-time validation for the field
    if (value !== '' && value !== null && value !== undefined) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entire form
    if (!validate(formData as CreateCategoryInput)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData as CreateCategoryInput);
      toast.success(mode === 'create' ? 'Catégorie créée avec succès' : 'Catégorie mise à jour avec succès');
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
        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Nouvelle Catégorie' : 'Modifier la Catégorie'}
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

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Électronique, Mobilier, Services IT"
                  disabled={isSubmitting}
                  autoFocus
                />
                <FieldError error={errors.name} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Description de la catégorie..."
                  disabled={isSubmitting}
                />
                <FieldError error={errors.description} />
              </div>

              {/* Active Checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Catégorie active</span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500">
                  Les catégories inactives ne seront pas disponibles lors de la création de produits
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  mode === 'create' ? 'Créer la catégorie' : 'Mettre à jour'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
