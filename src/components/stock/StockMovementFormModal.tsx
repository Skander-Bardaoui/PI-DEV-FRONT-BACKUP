import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw, Package } from 'lucide-react';
import { toast } from 'sonner';
import { CreateStockMovementSchema, type CreateStockMovementInput, StockMovementTypeSchema } from '../../validation/stock-movement.schema';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldError, ValidationErrorDisplay } from '../common/ValidationErrorDisplay';
import { Product } from '../../types/product';
import { Warehouse } from '../../types/warehouse';

interface StockMovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStockMovementInput) => Promise<void>;
  products: Product[];
  warehouses: Warehouse[];
}

export function StockMovementFormModal({
  isOpen,
  onClose,
  onSubmit,
  products,
  warehouses,
}: StockMovementFormModalProps) {
  const { errors, validationErrors, validate, validateField, clearErrors } = useFormValidation(CreateStockMovementSchema);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateStockMovementInput>>({
    product_id: '',
    type: 'ENTREE_ACHAT',
    quantity: 0,
    warehouse_id: '',
    note: '',
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        product_id: '',
        type: 'ENTREE_ACHAT',
        quantity: 0,
        warehouse_id: '',
        note: '',
      });
      setSelectedProduct(null);
      clearErrors();
    }
  }, [isOpen, clearErrors]);

  const handleChange = (field: keyof CreateStockMovementInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Update selected product when product_id changes
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      setSelectedProduct(product || null);
    }
    
    // Real-time validation for the field
    if (value !== '' && value !== null && value !== undefined) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entire form
    if (!validate(formData as CreateStockMovementInput)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData as CreateStockMovementInput);
      toast.success('Mouvement de stock créé avec succès');
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

  const movementTypes = [
    { value: 'ENTREE_ACHAT', label: 'Entrée Achat', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'SORTIE_VENTE', label: 'Sortie Vente', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { value: 'AJUSTEMENT_POSITIF', label: 'Ajustement +', icon: RefreshCw, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'AJUSTEMENT_NEGATIF', label: 'Ajustement -', icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const selectedType = movementTypes.find(t => t.value === formData.type);

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
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedType?.bg || 'bg-gray-100'}`}>
                {selectedType ? <selectedType.icon className={`h-5 w-5 ${selectedType.color}`} /> : <Package className="h-5 w-5 text-gray-600" />}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Nouveau Mouvement de Stock
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
              {/* Movement Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de mouvement <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {movementTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleChange('type', type.value)}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? `border-${type.color.replace('text-', '')} ${type.bg} ring-2 ring-${type.color.replace('text-', '')} ring-opacity-20`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${type.bg}`}>
                          <Icon className={`h-5 w-5 ${type.color}`} />
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleChange('product_id', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.product_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.filter(p => (p.type === 'PHYSICAL' || p.is_stockable) && p.is_active).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.reference || product.sku}) - Stock: {product.current_stock || product.quantity || 0}
                    </option>
                  ))}
                </select>
                <FieldError error={errors.product_id} />
                
                {/* Product Info Card */}
                {selectedProduct && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stock actuel:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {selectedProduct.current_stock || selectedProduct.quantity || 0} {selectedProduct.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Seuil minimal:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {selectedProduct.min_stock_threshold || selectedProduct.minQuantity || 0} {selectedProduct.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                <FieldError error={errors.quantity} />
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrepôt
                </label>
                <select
                  value={formData.warehouse_id || ''}
                  onChange={(e) => handleChange('warehouse_id', e.target.value || null)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
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
                <FieldError error={errors.warehouse_id} />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleChange('note', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                    errors.note ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Raison du mouvement, référence de commande, etc..."
                  disabled={isSubmitting}
                />
                <FieldError error={errors.note} />
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
                    Création...
                  </span>
                ) : (
                  'Créer le mouvement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
