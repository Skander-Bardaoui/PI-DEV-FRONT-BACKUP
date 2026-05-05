import { useState, useEffect } from 'react';
import { X, Package, DollarSign, Hash, Tag, Warehouse, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProductSchema, UpdateProductSchema, type CreateProductInput } from '../../validation/product.schema';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldError, ValidationErrorDisplay } from '../common/ValidationErrorDisplay';
import { Product, ProductType } from '../../types/product';
import { Category } from '../../types/category';
import { Warehouse as WarehouseType } from '../../types/warehouse';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  warehouses: WarehouseType[];
  mode: 'create' | 'edit';
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  warehouses,
  mode,
}: ProductFormModalProps) {
  const schema = mode === 'create' ? CreateProductSchema : UpdateProductSchema;
  const { errors, validationErrors, validate, validateField, clearErrors } = useFormValidation(schema);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateProductInput>>({
    name: '',
    reference: '',
    description: '',
    sale_price_ht: 0,
    purchase_price_ht: 0,
    current_stock: 0,
    min_stock_threshold: 0,
    category_id: '',
    warehouse_id: '',
    unit: 'unité',
    barcode: '',
    is_stockable: true,
    type: 'PHYSICAL' as ProductType,
    is_active: true,
  });

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        name: product.name,
        reference: product.reference || product.sku,
        description: product.description || '',
        sale_price_ht: product.sale_price_ht || product.price,
        purchase_price_ht: product.purchase_price_ht || product.cost || 0,
        current_stock: product.current_stock || product.quantity || 0,
        min_stock_threshold: product.min_stock_threshold || product.minQuantity || 0,
        category_id: product.category_id || '',
        warehouse_id: product.warehouse_id || '',
        unit: product.unit || 'unité',
        barcode: product.barcode || '',
        is_stockable: product.is_stockable ?? product.track_inventory ?? true,
        type: product.type || 'PHYSICAL',
        is_active: product.is_active ?? product.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        reference: '',
        description: '',
        sale_price_ht: 0,
        purchase_price_ht: 0,
        current_stock: 0,
        min_stock_threshold: 0,
        category_id: '',
        warehouse_id: '',
        unit: 'unité',
        barcode: '',
        is_stockable: true,
        type: 'PHYSICAL',
        is_active: true,
      });
      clearErrors();
    }
  }, [product, mode, isOpen, clearErrors]);

  const handleChange = (field: keyof CreateProductInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Real-time validation for the field
    if (value !== '' && value !== null && value !== undefined) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entire form
    if (!validate(formData as CreateProductInput)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData as CreateProductInput);
      toast.success(mode === 'create' ? 'Produit créé avec succès' : 'Produit mis à jour avec succès');
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
        <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Nouveau Produit' : 'Modifier le Produit'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Ordinateur portable Dell XPS 15"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.name} />
              </div>

              {/* Reference (SKU) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence (SKU) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleChange('reference', e.target.value.toUpperCase())}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      errors.reference ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ex: DELL-XPS15-2024"
                    disabled={isSubmitting}
                  />
                </div>
                <FieldError error={errors.reference} />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de produit
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as ProductType)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="PHYSICAL">Physique</option>
                  <option value="SERVICE">Service</option>
                  <option value="DIGITAL">Numérique</option>
                </select>
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de vente HT <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price_ht}
                    onChange={(e) => handleChange('sale_price_ht', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      errors.sale_price_ht ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
                <FieldError error={errors.sale_price_ht} />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix d'achat HT
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price_ht}
                    onChange={(e) => handleChange('purchase_price_ht', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      errors.purchase_price_ht ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
                <FieldError error={errors.purchase_price_ht} />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => handleChange('category_id', e.target.value || null)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      errors.category_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.filter(c => c.category_type === 'PRODUCT').map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldError error={errors.category_id} />
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrepôt
                </label>
                <div className="relative">
                  <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.warehouse_id || ''}
                    onChange={(e) => handleChange('warehouse_id', e.target.value || null)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      errors.warehouse_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Aucun entrepôt</option>
                    {warehouses.filter(w => w.is_active).map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                </div>
                <FieldError error={errors.warehouse_id} />
              </div>

              {/* Current Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock actuel
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => handleChange('current_stock', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.current_stock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.current_stock} />
              </div>

              {/* Min Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil minimal
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.min_stock_threshold}
                  onChange={(e) => handleChange('min_stock_threshold', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.min_stock_threshold ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.min_stock_threshold} />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unité
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.unit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: pièce, kg, litre"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.unit} />
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code-barres
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.barcode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ex: 1234567890123"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.barcode} />
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
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Description détaillée du produit..."
                  disabled={isSubmitting}
                />
                <FieldError error={errors.description} />
              </div>

              {/* Checkboxes */}
              <div className="md:col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_stockable ?? true}
                    onChange={(e) => handleChange('is_stockable', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Gérer le stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  mode === 'create' ? 'Créer le produit' : 'Mettre à jour'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
