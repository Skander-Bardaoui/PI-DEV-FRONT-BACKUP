// ==================== Alaa change for service type ====================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import { Product, CreateProductDto, ProductType } from '../../types/product';
import { Category } from '../../types/category';
import { Plus, Edit, Trash2, Search, Info, Sparkles, RefreshCw, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { StockMovementRowSkeleton } from '../../components/stock/StockSkeletonLoaders';
import { CreateServiceSchema, UpdateServiceSchema } from '../../validation/product.schema';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldError } from '../../components/common/ValidationErrorDisplay';
import { useAIAccess } from '../../hooks/useAIAccess';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface BusinessMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  stock_permissions: {
    create_product: boolean;
    update_product: boolean;
    delete_product: boolean;
    create_movement: boolean;
    delete_movement: boolean;
    create_category: boolean;
    update_category: boolean;
    delete_category: boolean;
    create_warehouse: boolean;
    update_warehouse: boolean;
    delete_warehouse: boolean;
    create_reservation: boolean;
    delete_reservation: boolean;
    create_service: boolean;
    update_service: boolean;
    delete_service: boolean;
    create_service_category: boolean;
    update_service_category: boolean;
    delete_service_category: boolean;
  };
  is_active: boolean;
}

async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

async function fetchBusinessMembers(businessId: string): Promise<BusinessMember[]> {
  const res = await fetch(`${API_URL}/businesses/${businessId}/members`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch members');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.members || []);
}

export default function Services() {
  const { user } = useAuth();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();
  const { hasAIAccess, loading: aiLoading } = useAIAccess();
  const [services, setServices] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  
  // User and member state for permissions
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<BusinessMember | null>(null);
  
  // ==================== Alaa change for service type ====================
  // AI scan states
  const [showAiScanModal, setShowAiScanModal] = useState(false);
  const [aiScanStep, setAiScanStep] = useState<'input' | 'review'>('input');
  const [serviceDescription, setServiceDescription] = useState('');
  const [analyzingDescription, setAnalyzingDescription] = useState(false);
  const [aiScanError, setAiScanError] = useState<string | null>(null);
  const [aiScanResult, setAiScanResult] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryMatchStatus, setCategoryMatchStatus] = useState<'matched' | 'no-match' | null>(null);
  const [matchedCategoryName, setMatchedCategoryName] = useState<string | null>(null);
  // ====================================================================
  
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    reference: '',
    description: '',
    category_id: '',
    unit: 'service',
    sale_price_ht: 0,
    tax_rate_id: '',
    is_stockable: false,
  });

  // Validation hook
  const schema = editingService ? UpdateServiceSchema : CreateServiceSchema;
  const { errors, validate, validateField, clearErrors } = useFormValidation(schema);

  // Load current user and member on mount
  useEffect(() => {
    async function loadUserData() {
      if (!businessId) return;
      
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        
        const members = await fetchBusinessMembers(businessId);
        const member = members.find(m => m.user_id === user.id);
        setCurrentMember(member || null);
      } catch (err: any) {
        console.error('Failed to load user data:', err);
      }
    }
    loadUserData();
  }, [businessId]);

  // Permission checks
  const isOwner = currentUser?.role === 'BUSINESS_OWNER';
  const stock = currentMember?.stock_permissions;
  
  const canCreateService = isOwner || stock?.create_service === true;
  const canUpdateService = isOwner || stock?.update_service === true;
  const canDeleteService = isOwner || stock?.delete_service === true;

  useEffect(() => {
    if (businessId) {
      loadServices();
      loadCategories();
    }
  }, [businessId, searchTerm, selectedCategory, showActiveOnly]);

  // Show skeleton for minimum 2 seconds
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll(businessId!, {
        search: searchTerm || undefined,
        category_id: selectedCategory || undefined,
        is_active: showActiveOnly ? true : undefined,
        type: ProductType.SERVICE,
      });
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // ==================== Alaa change for service type ====================
      const data = await categoriesApi.getAll(businessId!, { is_active: true, category_type: 'SERVICE' });
      // ====================================================================
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validate(formData)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    
    try {
      const serviceData = {
        ...formData,
        type: ProductType.SERVICE,
        is_stockable: false,
        current_stock: 0,
        min_stock_threshold: 0,
      };

      if (editingService) {
        await productsApi.update(businessId!, editingService.id, serviceData);
        toast.success('Service updated successfully');
      } else {
        await productsApi.create(businessId!, serviceData);
        toast.success('Service created successfully');
      }
      setShowModal(false);
      setEditingService(null);
      resetForm();
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving service');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      reference: '',
      description: '',
      category_id: '',
      unit: 'service',
      sale_price_ht: 0,
      tax_rate_id: '',
      is_stockable: false,
    });
    setSkuError(null);
  };

  const handleEdit = (service: Product) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      reference: service.reference,
      description: service.description || '',
      category_id: service.category_id || '',
      unit: service.unit,
      sale_price_ht: service.sale_price_ht,
      tax_rate_id: service.tax_rate_id || '',
      is_stockable: false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setServiceToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    
    try {
      await productsApi.delete(businessId!, serviceToDelete);
      setServices(prev => prev.filter(s => s.id !== serviceToDelete));
      toast.success('Service deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting service');
    } finally {
      setShowDeleteConfirm(false);
      setServiceToDelete(null);
    }
  };

  const handleToggleActive = async (service: Product) => {
    try {
      await productsApi.update(businessId!, service.id, {
        is_active: !service.is_active,
      });
      loadServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const handleGenerateSku = async () => {
    if (formData.reference && formData.reference.trim()) {
      toast.info('Génération d\'un nouveau SKU...');
    }

    setGeneratingSku(true);
    setSkuError(null);

    try {
      let categoryName: string | null = null;
      if (formData.category_id) {
        const selectedCategory = categories.find(cat => cat.id === formData.category_id);
        categoryName = selectedCategory?.name || null;
      }

      // ==================== Alaa change for service type ====================
      const result = await productsApi.generateSku(businessId!, {
        category_name: categoryName,
        brand: null,
        name: formData.name || null,
        unit: formData.unit || null,
        extra_attribute: null,
        type: 'SERVICE', // Pass SERVICE type for service SKU generation
      });
      // ====================================================================

      setFormData(prev => ({ ...prev, reference: result.sku }));
    } catch (error: any) {
      setSkuError(error.response?.data?.message || 'Failed to generate SKU');
    } finally {
      setGeneratingSku(false);
    }
  };

  // ==================== Alaa change for service type ====================
  const handleAnalyzeDescription = async () => {
    if (!serviceDescription || serviceDescription.trim().length < 10) {
      setAiScanError('Please enter at least 10 characters');
      return;
    }

    setAnalyzingDescription(true);
    setAiScanError(null);

    try {
      const result = await productsApi.scanServiceDescription(businessId!, serviceDescription);
      setAiScanResult(result);

      // Pre-fill form with scanned data
      let description = result.description || '';
      if (result.duration_note) {
        description = description ? `${description} — ${result.duration_note}` : result.duration_note;
      }

      setFormData({
        name: result.name || '',
        reference: '',
        description: description,
        category_id: '',
        unit: 'service',
        sale_price_ht: result.price_ht || 0,
        tax_rate_id: '',
        is_stockable: false,
      });

      // Handle category matching
      if (result.suggested_category_name) {
        await handleCategoryMatching(result.suggested_category_name);
      } else {
        setCategoryMatchStatus(null);
      }

      setAiScanStep('review');
    } catch (error: any) {
      setAiScanError(error.response?.data?.message || 'Failed to analyze description. Please try again.');
    } finally {
      setAnalyzingDescription(false);
    }
  };

  const handleCategoryMatching = async (suggestedName: string) => {
    try {
      // Fetch all service categories
      const allCategories = await categoriesApi.getAll(businessId!, { category_type: 'SERVICE' });

      // Case-insensitive match
      const matchedCategory = allCategories.find(
        cat => cat.name.toLowerCase() === suggestedName.toLowerCase()
      );

      if (matchedCategory) {
        // Auto-select the matched category
        setFormData(prev => ({ ...prev, category_id: matchedCategory.id }));
        setCategoryMatchStatus('matched');
        setMatchedCategoryName(matchedCategory.name);
      } else {
        // Show modal to create new category
        setCategoryMatchStatus('no-match');
        setNewCategoryName(suggestedName);
        setNewCategoryDescription(`Services in the ${suggestedName} category`);
        setShowCategoryModal(true);
      }
    } catch (error) {
      console.error('Error matching category:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    setCreatingCategory(true);
    setCategoryError(null);

    try {
      const newCategory = await categoriesApi.create(businessId!, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        category_type: 'SERVICE',
      });

      // Add to categories list
      setCategories(prev => [...prev, newCategory]);

      // Auto-select the new category
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));

      // Close modal and show success
      setShowCategoryModal(false);
      toast.success('Service category created and selected');
      setCategoryMatchStatus('matched');
      setMatchedCategoryName(newCategory.name);
    } catch (error: any) {
      setCategoryError(error.response?.data?.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeclineCategory = () => {
    setShowCategoryModal(false);
    setCategoryMatchStatus(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryError(null);
  };

  const handleSaveAiScannedService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validate(formData)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    
    try {
      const serviceData = {
        ...formData,
        type: ProductType.SERVICE,
        is_stockable: false,
        current_stock: 0,
        min_stock_threshold: 0,
      };

      await productsApi.create(businessId!, serviceData);
      toast.success('Service created successfully');
      setShowAiScanModal(false);
      resetAiScanModal();
      loadServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving service');
    }
  };

  const resetAiScanModal = () => {
    setAiScanStep('input');
    setServiceDescription('');
    setAiScanError(null);
    setAiScanResult(null);
    setCategoryMatchStatus(null);
    setMatchedCategoryName(null);
    setShowCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryError(null);
    setSkuError(null);
    setFormData({
      name: '',
      reference: '',
      description: '',
      category_id: '',
      unit: 'service',
      sale_price_ht: 0,
      tax_rate_id: '',
      is_stockable: false,
    });
  };

  const handleReanalyze = () => {
    setAiScanStep('input');
    setAiScanError(null);
    setCategoryMatchStatus(null);
    setMatchedCategoryName(null);
  };
  // ====================================================================

  const isDisplayLoading = loading || showSkeleton;

  if (!businessId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No business associated with your account. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        {/* ==================== Alaa change for service type ==================== */}
        <div className="flex gap-2">
          {canCreateService && (
            <>
              {/* AI Feature - Only for Premium users */}
              {!aiLoading && hasAIAccess && (
                <button
                  onClick={() => {
                    resetAiScanModal();
                    setShowAiScanModal(true);
                  }}
                  className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <Sparkles size={20} />
                  Add via AI
                </button>
              )}
              <button
                onClick={() => {
                  setEditingService(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Service
              </button>
            </>
          )}
        </div>
        {/* ==================================================================== */}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Services are not tracked in inventory and do not generate stock movements.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded"
            />
            <span>Active only</span>
          </label>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU/Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (HT)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isDisplayLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No services found
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{service.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.reference}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(service.sale_price_ht || 0).toFixed(3)} DT
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {service.category?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {canUpdateService && (
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {canDeleteService && (
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingService ? 'Edit Service' : 'New Service'}
            </h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      validateField('name', e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      errors.name ? 'border-red-300 bg-red-50' : ''
                    }`}
                  />
                  <FieldError error={errors.name} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU/Reference *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => {
                          const upperValue = e.target.value.toUpperCase();
                          setFormData({ ...formData, reference: upperValue });
                          validateField('reference', upperValue);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.reference ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      <FieldError error={errors.reference} />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      disabled={generatingSku}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {generatingSku ? 'Generating...' : 'Generate SKU'}
                    </button>
                  </div>
                  {skuError && (
                    <p className="mt-1 text-sm text-red-600">{skuError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      setFormData({ ...formData, category_id: e.target.value });
                      validateField('category_id', e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      errors.category_id ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <FieldError error={errors.category_id} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price HT (DT) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.sale_price_ht}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, sale_price_ht: value });
                        validateField('sale_price_ht', value);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        errors.sale_price_ht ? 'border-red-300 bg-red-50' : ''
                      }`}
                    />
                    <FieldError error={errors.sale_price_ht} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={19}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this service? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setServiceToDelete(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Alaa change for service type ==================== */}
      {/* AI Scan Modal */}
      {showAiScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {aiScanStep === 'input' ? 'Describe Your Service' : 'Review Service Details'}
              </h2>
              <button
                onClick={() => {
                  setShowAiScanModal(false);
                  resetAiScanModal();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {aiScanStep === 'input' ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Description
                  </label>
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Describe your service in your own words... e.g. We repair air conditioners on-site, 2-hour visit, includes diagnosis and parts replacement, price is 150 DT"
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={6}
                    style={{ minHeight: '120px' }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      The AI will extract the service name, category, price and description from what you write. You can edit everything before saving.
                    </p>
                    <span className="text-sm text-gray-500">
                      {serviceDescription.length}/1000
                    </span>
                  </div>
                </div>

                {aiScanError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{aiScanError}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiScanModal(false);
                      resetAiScanModal();
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAnalyzeDescription}
                    disabled={!serviceDescription || serviceDescription.length < 10 || analyzingDescription}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {analyzingDescription ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Analyze description
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAiScannedService} noValidate>
                {aiScanResult?.confidence_note && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">{aiScanResult.confidence_note}</p>
                  </div>
                )}

                {categoryMatchStatus === 'matched' && matchedCategoryName && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                      Category <strong>'{matchedCategoryName}'</strong> was detected and automatically selected.
                    </p>
                  </div>
                )}

                {categoryMatchStatus === null && aiScanResult?.suggested_category_name === null && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      AI could not determine a category. Please select one manually.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name * {aiScanResult?.name && <span className="text-xs text-blue-600">(Detected by AI)</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        validateField('name', e.target.value);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        errors.name ? 'border-red-300 bg-red-50' : ''
                      }`}
                    />
                    <FieldError error={errors.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU/Reference *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.reference}
                          onChange={(e) => {
                            const upperValue = e.target.value.toUpperCase();
                            setFormData({ ...formData, reference: upperValue });
                            validateField('reference', upperValue);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg ${
                            errors.reference ? 'border-red-300 bg-red-50' : ''
                          }`}
                        />
                        <FieldError error={errors.reference} />
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateSku}
                        disabled={generatingSku}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {generatingSku ? 'Generating...' : 'Generate SKU'}
                      </button>
                    </div>
                    {skuError && (
                      <p className="mt-1 text-sm text-red-600">{skuError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description {aiScanResult?.description && <span className="text-xs text-blue-600">(Detected by AI)</span>}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        setFormData({ ...formData, category_id: e.target.value });
                        validateField('category_id', e.target.value);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        errors.category_id ? 'border-red-300 bg-red-50' : ''
                      }`}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <FieldError error={errors.category_id} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price HT (DT) * {aiScanResult?.price_ht && <span className="text-xs text-blue-600">(Detected by AI)</span>}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.sale_price_ht}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, sale_price_ht: value });
                          validateField('sale_price_ht', value);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.sale_price_ht ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      <FieldError error={errors.sale_price_ht} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={19}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={handleReanalyze}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Re-analyze
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiScanModal(false);
                      resetAiScanModal();
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Service
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New service category suggested</h2>
            <p className="text-sm text-gray-600 mb-4">
              The AI suggested a category that does not exist yet: <strong>'{newCategoryName}'</strong>. Would you like to create it?
            </p>

            {categoryError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{categoryError}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDeclineCategory}
                disabled={creatingCategory}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingCategory ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  'Create and select'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================================================================== */}
    </div>
  );
}
// ====================================================================
