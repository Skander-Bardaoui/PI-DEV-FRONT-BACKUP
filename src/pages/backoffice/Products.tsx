import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import { warehousesApi } from '../../api/warehouses.api';
import { Product, CreateProductDto, ProductType } from '../../types/product';
import { Category } from '../../types/category';
import { Warehouse } from '../../types/warehouse';
import {
  Plus, Edit, Trash2, Search, AlertTriangle, Camera, Upload, X,
  RefreshCw, CheckCircle, Barcode, Printer, Eye, ImagePlus, ImageOff,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import JsBarcode from 'jsbarcode';
import { StockMovementRowSkeleton } from '../../components/stock/StockSkeletonLoaders';
import { CreateProductSchema, UpdateProductSchema } from '../../validation/product.schema';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FieldError } from '../../components/common/ValidationErrorDisplay';
import { useAIAccess } from '../../hooks/useAIAccess';

// ─── tiny reusable image picker ───────────────────────────────────────────────
interface ImagePickerProps {
  value: string | null;          // current preview (data-url or null)
  onChange: (file: File, preview: string) => void;
  onRemove: () => void;
  label?: string;
}

function ImagePicker({ value, onChange, onRemove, label = 'Product Image' }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      toast.error('Only JPEG, PNG, WEBP or GIF allowed'); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(file, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {value ? (
        <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
          <img src={value} alt="product" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
              title="Change image"
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"
              title="Remove image"
            >
              <ImageOff size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <ImagePlus size={24} />
          <span className="text-xs text-center">Add image</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

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

export default function Products() {
  const { user } = useAuth();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();
  const { hasAIAccess, loading: aiLoading } = useAIAccess();
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly]   = useState(true);
  const [showLowStock, setShowLowStock]       = useState(false);
  const [showModal, setShowModal]             = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null);
  
  // User and member state for permissions
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<BusinessMember | null>(null);

  // image state for the create/edit modal
  const [pendingImageFile, setPendingImageFile]       = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [removeImageOnSave, setRemoveImageOnSave]     = useState(false);

  // scan modal
  const [showScanModal, setShowScanModal]         = useState(false);
  const [scanStep, setScanStep]                   = useState<'upload' | 'review'>('upload');
  const [selectedImage, setSelectedImage]         = useState<File | null>(null);
  const [imagePreview, setImagePreview]           = useState<string | null>(null);
  const [scanning, setScanning]                   = useState(false);
  const [scanError, setScanError]                 = useState<string | null>(null);
  const [scannedData, setScannedData]             = useState<any>(null);

  // category creation
  const [showCategoryModal, setShowCategoryModal]         = useState(false);
  const [newCategoryName, setNewCategoryName]             = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory]           = useState(false);
  const [categoryError, setCategoryError]                 = useState<string | null>(null);
  const [categoryMatchStatus, setCategoryMatchStatus]     = useState<'matched' | 'no-match' | null>(null);
  const [matchedCategoryName, setMatchedCategoryName]     = useState<string | null>(null);

  // SKU
  const [generatingSku, setGeneratingSku] = useState(false);
  const [skuError, setSkuError]           = useState<string | null>(null);

  // detail modal
  const [showDetailModal, setShowDetailModal]               = useState(false);
  const [viewingProduct, setViewingProduct]                 = useState<Product | null>(null);
  const [generatingDetailBarcode, setGeneratingDetailBarcode] = useState(false);

  // delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete]     = useState<string | null>(null);

  // low stock warning modal
  const [showLowStockWarning, setShowLowStockWarning] = useState(false);
  const [lowStockProductName, setLowStockProductName] = useState<string>('');


  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    reference: '',
    description: '',
    category_id: '',
    unit: 'pièce',
    sale_price_ht: 0,
    purchase_price_ht: 0,
    current_stock: 0,
    min_stock_threshold: 0,
    is_stockable: true,
  });

  // Validation hook
  const schema = editingProduct ? UpdateProductSchema : CreateProductSchema;
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
  
  const canCreateProduct = isOwner || stock?.create_product === true;
  const canUpdateProduct = isOwner || stock?.update_product === true;
  const canDeleteProduct = isOwner || stock?.delete_product === true;

  // ─── Click outside handler ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close modals when clicking on backdrop
      if (target.classList.contains('modal-backdrop')) {
        if (showModal) {
          setShowModal(false);
          setEditingProduct(null);
          resetForm();
        }
        if (showScanModal) {
          setShowScanModal(false);
          resetScanModal();
        }
        if (showCategoryModal) {
          setShowCategoryModal(false);
          handleDeclineCategory();
        }
        if (showDetailModal) {
          setShowDetailModal(false);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setProductToDelete(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showModal, showScanModal, showCategoryModal, showDetailModal, showDeleteConfirm]);

  useEffect(() => {
    if (businessId) {
      loadProducts();
      loadCategories();
      loadWarehouses();
    }
  }, [businessId, searchTerm, selectedCategory, showActiveOnly, showLowStock]);

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

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll(businessId!, {
        search: searchTerm || undefined,
        category_id: selectedCategory || undefined,
        is_active: showActiveOnly ? true : undefined,
        low_stock: showLowStock ? true : undefined,
        type: ProductType.PHYSICAL,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll(businessId!, { is_active: true, category_type: 'PRODUCT' });
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await warehousesApi.getAll(businessId!, { is_active: true });
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  // ─── helpers ───────────────────────────────────────────────────────────────

  const resetImageState = () => {
    setPendingImageFile(null);
    setPendingImagePreview(null);
    setRemoveImageOnSave(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      reference: '',
      description: '',
      category_id: '',
      unit: 'pièce',
      sale_price_ht: 0,
      purchase_price_ht: 0,
      current_stock: 0,
      min_stock_threshold: 0,
      is_stockable: true,
    });
    resetImageState();
  };

  const isLowStock = (p: Product) =>
    p.is_stockable && p.current_stock < p.min_stock_threshold;

  const isDisplayLoading = loading || showSkeleton;

  // ─── submit create/edit ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validate(formData)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    
    // Check if product will be low stock
    const willBeLowStock = formData.is_stockable && 
                           formData.current_stock < formData.min_stock_threshold;
    
    try {
      const productData = { ...formData, type: ProductType.PHYSICAL };

      let saved: Product;
      if (editingProduct) {
        saved = await productsApi.update(businessId!, editingProduct.id, productData);
      } else {
        saved = await productsApi.create(businessId!, productData);
      }

      // handle image after product is saved
      if (pendingImageFile) {
        saved = await productsApi.uploadImage(businessId!, saved.id, pendingImageFile);
      } else if (removeImageOnSave && editingProduct?.image_url) {
        saved = await productsApi.removeImage(businessId!, saved.id);
      }

      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
      
      // Show low stock warning if applicable
      if (willBeLowStock) {
        setLowStockProductName(saved.name);
        setShowLowStockWarning(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving product');
    }
  };

  // ─── edit ──────────────────────────────────────────────────────────────────

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      reference: product.reference,
      description: product.description || '',
      category_id: product.category_id || '',
      warehouse_id: product.warehouse_id || '',
      unit: product.unit,
      sale_price_ht: product.sale_price_ht,
      purchase_price_ht: product.purchase_price_ht,
      current_stock: product.current_stock,
      min_stock_threshold: product.min_stock_threshold,
      is_stockable: product.is_stockable,
      barcode: product.barcode || '',
    });
    // pre-fill image preview with existing image
    setPendingImagePreview(product.image_url || null);
    setPendingImageFile(null);
    setRemoveImageOnSave(false);
    setShowModal(true);
  };

  // ─── delete ────────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productsApi.delete(businessId!, productToDelete);
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      toast.success('Product deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error deleting product');
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productsApi.update(businessId!, product.id, { is_active: !product.is_active });
      loadProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  // ─── scan flow ─────────────────────────────────────────────────────────────

  const handleImageSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setScanError('Image size must be less than 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setScanError('Only JPEG, PNG, and WEBP images are supported'); return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setScanError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleScanImage = async () => {
    if (!selectedImage) return;
    setScanning(true);
    setScanError(null);
    try {
      const result = await productsApi.scanImage(businessId!, selectedImage);
      setScannedData(result);
      setFormData({
        name: result.name || '',
        reference: '',
        description: result.description || '',
        category_id: '',
        unit: result.unit || 'pièce',
        sale_price_ht: result.sale_price_ht || 0,
        purchase_price_ht: 0,
        current_stock: 0,
        min_stock_threshold: 0,
        is_stockable: true,
        barcode: result.barcode || '',
      });
      if (result.suggested_category_name) {
        await handleCategoryMatching(result.suggested_category_name);
      }
      setScanStep('review');
    } catch (error: any) {
      setScanError(error.response?.data?.message || 'Failed to scan image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleCategoryMatching = async (suggestedName: string) => {
    try {
      const allCategories = await categoriesApi.getAll(businessId!);
      const matchedCategory = allCategories.find(
        cat => cat.name.toLowerCase() === suggestedName.toLowerCase(),
      );
      if (matchedCategory) {
        setFormData(prev => ({ ...prev, category_id: matchedCategory.id }));
        setCategoryMatchStatus('matched');
        setMatchedCategoryName(matchedCategory.name);
      } else {
        setCategoryMatchStatus('no-match');
        setNewCategoryName(suggestedName);
        setNewCategoryDescription(`Products in the ${suggestedName} category`);
        setShowCategoryModal(true);
      }
    } catch (error) {
      console.error('Error matching category:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) { setCategoryError('Category name is required'); return; }
    setCreatingCategory(true);
    setCategoryError(null);
    try {
      const newCategory = await categoriesApi.create(businessId!, {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });
      setCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      setShowCategoryModal(false);
      toast.success('Category created and selected');
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

  const handleGenerateSku = async () => {
    if (formData.reference?.trim()) {
      toast.info('Génération d\'un nouveau SKU...');
    }
    setGeneratingSku(true);
    setSkuError(null);
    try {
      let categoryName: string | null = null;
      if (formData.category_id) {
        categoryName = categories.find(cat => cat.id === formData.category_id)?.name || null;
      }
      const result = await productsApi.generateSku(businessId!, {
        category_name: categoryName,
        brand: null,
        name: formData.name || null,
        unit: formData.unit || null,
        extra_attribute: null,
        type: 'PHYSICAL',
      });
      setFormData(prev => ({ ...prev, reference: result.sku }));
    } catch (error: any) {
      setSkuError(error.response?.data?.message || 'Failed to generate SKU');
    } finally {
      setGeneratingSku(false);
    }
  };

  const handleGenerateBarcode = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && !product.warehouse_id) {
      toast.warning('Aucun entrepôt assigné. Le code-barres utilisera le préfixe GEN.');
    }
    try {
      const updatedProduct = await productsApi.generateBarcode(businessId!, productId);
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      toast.success('Barcode generated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate barcode');
    }
  };

  const handlePrintLabel = async (productId: string, productSku: string) => {
    try {
      const blob = await productsApi.downloadLabel(businessId!, productId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `label-${productSku}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download label');
    }
  };

  const handleRegenerateBarcode = async () => {
    if (!editingProduct) return;
    try {
      const updatedProduct = await productsApi.generateBarcode(businessId!, editingProduct.id);
      setFormData(prev => ({ ...prev, barcode: updatedProduct.barcode || '' }));
      toast.success('Barcode regenerated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate barcode');
    }
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setShowDetailModal(true);
  };

  const handleGenerateDetailBarcode = async () => {
    if (!viewingProduct) return;
    setGeneratingDetailBarcode(true);
    try {
      const updatedProduct = await productsApi.generateBarcode(businessId!, viewingProduct.id);
      setViewingProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      toast.success('Barcode generated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate barcode');
    } finally {
      setGeneratingDetailBarcode(false);
    }
  };

  React.useEffect(() => {
    if (showDetailModal && viewingProduct?.barcode) {
      try {
        const svg = document.getElementById('barcode-svg');
        if (svg) {
          JsBarcode(svg, viewingProduct.barcode, {
            format: 'CODE128', width: 2, height: 80, displayValue: false,
          });
        }
      } catch (error) {
        console.error('Error rendering barcode:', error);
      }
    }
  }, [showDetailModal, viewingProduct]);

  // ─── save scanned product (with the scanned image attached) ───────────────

  const handleSaveScannedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validate(formData)) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    
    // Check if product will be low stock
    const willBeLowStock = formData.is_stockable && 
                           formData.current_stock < formData.min_stock_threshold;
    
    try {
      const productData = { ...formData, type: ProductType.PHYSICAL };
      let saved = await productsApi.create(businessId!, productData);

      // attach the scanned image automatically
      if (selectedImage) {
        saved = await productsApi.uploadImage(businessId!, saved.id, selectedImage);
      }

      toast.success('Product created successfully');
      setShowScanModal(false);
      resetScanModal();
      loadProducts();
      
      // Show low stock warning if applicable
      if (willBeLowStock) {
        setLowStockProductName(saved.name);
        setShowLowStockWarning(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving product');
    }
  };

  const resetScanModal = () => {
    setScanStep('upload');
    setSelectedImage(null);
    setImagePreview(null);
    setScanError(null);
    setScannedData(null);
    setCategoryMatchStatus(null);
    setMatchedCategoryName(null);
    setShowCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryError(null);
    setSkuError(null);
    resetForm();
  };

  const handleRescan = () => {
    setScanStep('upload');
    setSelectedImage(null);
    setImagePreview(null);
    setScanError(null);
  };

  // ─── guard ─────────────────────────────────────────────────────────────────

  if (loadingBusinessId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (businessIdError || !businessId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {businessIdError || 'No business associated with your account. Please contact your administrator.'}
          </p>
        </div>
      </div>
    );
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          {canCreateProduct && (
            <>
              {/* AI Feature - Only for Premium users */}
              {!aiLoading && hasAIAccess && (
                <button
                  onClick={() => { resetScanModal(); setShowScanModal(true); }}
                  className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <Camera size={20} />
                  Add via image scan
                </button>
              )}
              <button
                onClick={() => { setEditingProduct(null); resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                New Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
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
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showActiveOnly} onChange={(e) => setShowActiveOnly(e.target.checked)} className="rounded" />
            <span>Active only</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} className="rounded" />
            <span>Low stock only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isDisplayLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <StockMovementRowSkeleton key={i} />
                ))}
              </>
            ) : products.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-4 text-center text-gray-500">No products found</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className={isLowStock(product) ? 'bg-red-50' : ''}>
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product.reference}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{product.category?.name || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {product.barcode ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 text-gray-800 rounded">
                        {product.barcode}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isLowStock(product) && product.current_stock > 0 && (
                        <span title={`Low stock — below minimum threshold of ${product.min_stock_threshold} ${product.unit}`}>
                          <AlertTriangle size={16} className="text-amber-500" />
                        </span>
                      )}
                      {product.is_stockable && product.current_stock === 0 && (
                        <span title="Out of stock"><X size={16} className="text-red-500" /></span>
                      )}
                      <span className={`text-sm ${
                        product.is_stockable && product.current_stock === 0
                          ? 'text-red-600 font-semibold'
                          : isLowStock(product)
                          ? 'text-amber-600 font-semibold'
                          : 'text-gray-900'
                      }`}>
                        {product.is_stockable ? `${product.current_stock} ${product.unit}` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {(product.sale_price_ht || 0).toFixed(3)} DT
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewProduct(product)} className="text-gray-600 hover:text-gray-900" title="View details"><Eye size={18} /></button>
                      {canUpdateProduct && (
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit size={18} /></button>
                      )}
                      {canUpdateProduct && (
                        <button onClick={() => handleGenerateBarcode(product.id)} className="text-purple-600 hover:text-purple-900" title="Generate barcode"><Barcode size={18} /></button>
                      )}
                      {canUpdateProduct && (
                        <button onClick={() => handlePrintLabel(product.id, product.reference)} className="text-green-600 hover:text-green-900" title="Print label"><Printer size={18} /></button>
                      )}
                      {canDeleteProduct && (
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h2>
            <form onSubmit={handleSubmit} noValidate>
              {/* Image picker */}
        <div className="mb-6 flex justify-center">
                <ImagePicker
                  value={pendingImagePreview}
                  onChange={(file, preview) => {
                    setPendingImageFile(file);
                    setPendingImagePreview(preview);
                    setRemoveImageOnSave(false);
                  }}
                  onRemove={() => {
                    setPendingImageFile(null);
                    setPendingImagePreview(null);
                    setRemoveImageOnSave(true);
                  }}
                />
              </div>

              {/* Two-column layout for better space usage */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        validateField('name', e.target.value);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300 bg-red-50' : ''
                      }`}
                    />
                    <FieldError error={errors.name} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference *</label>
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
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                    {skuError && <p className="mt-1 text-sm text-red-600">{skuError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => {
                          setFormData({ ...formData, category_id: e.target.value });
                          validateField('category_id', e.target.value);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.category_id ? 'border-red-300 bg-red-50' : ''
                        }`}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <FieldError error={errors.category_id} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
                      <select
                        value={formData.warehouse_id}
                        onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No Warehouse</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price HT (DT) *</label>
                      <input
                        type="number" step="0.001"
                        value={formData.sale_price_ht}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, sale_price_ht: value });
                          validateField('sale_price_ht', value);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.sale_price_ht ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      <FieldError error={errors.sale_price_ht} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price HT (DT) *</label>
                      <input
                        type="number" step="0.001"
                        value={formData.purchase_price_ht}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, purchase_price_ht: value });
                          validateField('purchase_price_ht', value);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.purchase_price_ht ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      <FieldError error={errors.purchase_price_ht} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_stockable}
                        onChange={(e) => setFormData({ ...formData, is_stockable: e.target.checked })}
                        className="rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Stockable Product</span>
                    </label>
                  </div>

                  {formData.is_stockable && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                        <input
                          type="number" step="1"
                          value={formData.current_stock}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, current_stock: value });
                            validateField('current_stock', value);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.current_stock ? 'border-red-300 bg-red-50' : ''
                          }`}
                        />
                        <FieldError error={errors.current_stock} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Threshold</label>
                        <input
                          type="number" step="1"
                          value={formData.min_stock_threshold}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, min_stock_threshold: value });
                            validateField('min_stock_threshold', value);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.min_stock_threshold ? 'border-red-300 bg-red-50' : ''
                          }`}
                        />
                        <FieldError error={errors.min_stock_threshold} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                    {editingProduct ? (
                      formData.barcode ? (
                        <div className="flex gap-2">
                          <div className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 font-mono text-sm">{formData.barcode}</div>
                          <button type="button" onClick={handleRegenerateBarcode} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap">Regenerate</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg" />
                          <button type="button" onClick={handleRegenerateBarcode} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 whitespace-nowrap">Generate</button>
                        </div>
                      )
                    ) : (
                      <>
                        <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        <p className="mt-1 text-sm text-gray-500">You can generate an internal barcode after saving the product.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!formData.warehouse_id && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">No warehouse assigned. The generated barcode will use a GEN prefix.</p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditingProduct(null); resetForm(); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Image Scan Modal ── */}
      {showScanModal && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {scanStep === 'upload' ? 'Scan Product Image' : 'Review Scanned Product'}
              </h2>
              <button onClick={() => { setShowScanModal(false); resetScanModal(); }} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>

            {scanStep === 'upload' ? (
              <div>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                      <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload size={48} className="mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">Drop an image here or click to browse</p>
                        <p className="text-sm text-gray-500 mt-2">Supports JPEG, PNG, WEBP up to 5MB</p>
                      </div>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageSelect(file); }}
                    className="hidden"
                  />
                </div>
                {scanError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{scanError}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => { setShowScanModal(false); resetScanModal(); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleScanImage}
                    disabled={!selectedImage || scanning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {scanning ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Analyzing image...</>
                    ) : (
                      <><Camera size={20} />Scan image</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveScannedProduct} noValidate>
                <div className="grid grid-cols-2 gap-6">
                  {/* Left: image + info */}
                  <div>
                    <img src={imagePreview!} alt="Scanned product" className="w-full rounded-lg shadow-lg" />
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">This image will be saved as the product photo automatically.</p>
                    </div>
                    <button type="button" onClick={handleRescan} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                      <RefreshCw size={16} />Re-scan
                    </button>
                  </div>

                  {/* Right: form */}
                  <div className="space-y-4">
                    {scannedData?.confidence_note && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">{scannedData.confidence_note}</p>
                      </div>
                    )}

                    {categoryMatchStatus === 'matched' && matchedCategoryName && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-green-800">
                          Category <strong>'{matchedCategoryName}'</strong> was detected and automatically selected.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name * {scannedData?.name && <span className="text-xs text-blue-600">(Detected from image)</span>}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reference *</label>
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
                        <button type="button" onClick={handleGenerateSku} disabled={generatingSku} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed whitespace-nowrap">
                          {generatingSku ? 'Generating...' : 'Generate SKU'}
                        </button>
                      </div>
                      {skuError && <p className="mt-1 text-sm text-red-600">{skuError}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description {scannedData?.description && <span className="text-xs text-blue-600">(Detected from image)</span>}
                      </label>
                      <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
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
                          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                        <FieldError error={errors.category_id} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
                        <select value={formData.warehouse_id} onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                          <option value="">No Warehouse</option>
                          {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit {scannedData?.unit && <span className="text-xs text-blue-600">(Detected from image)</span>}
                        </label>
                        <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Barcode {scannedData?.barcode && <span className="text-xs text-blue-600">(Detected from image)</span>}
                        </label>
                        <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>

                    {!formData.warehouse_id && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">No warehouse assigned. The generated barcode will use a GEN prefix.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sale Price HT (DT) * {scannedData?.sale_price_ht && <span className="text-xs text-blue-600">(Detected from image)</span>}
                        </label>
                        <input
                          type="number" step="0.001"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price HT (DT) *</label>
                        <input
                          type="number" step="0.001"
                          value={formData.purchase_price_ht}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, purchase_price_ht: value });
                            validateField('purchase_price_ht', value);
                          }}
                          className={`w-full px-3 py-2 border rounded-lg ${
                            errors.purchase_price_ht ? 'border-red-300 bg-red-50' : ''
                          }`}
                        />
                        <FieldError error={errors.purchase_price_ht} />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.is_stockable} onChange={(e) => setFormData({ ...formData, is_stockable: e.target.checked })} className="rounded" />
                        <span className="text-sm font-medium text-gray-700">Stockable Product</span>
                      </label>
                    </div>

                    {formData.is_stockable && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                          <input
                            type="number" step="1"
                            value={formData.current_stock}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, current_stock: value });
                              validateField('current_stock', value);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg ${
                              errors.current_stock ? 'border-red-300 bg-red-50' : ''
                            }`}
                          />
                          <FieldError error={errors.current_stock} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Threshold</label>
                          <input
                            type="number" step="1"
                            value={formData.min_stock_threshold}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, min_stock_threshold: value });
                              validateField('min_stock_threshold', value);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg ${
                              errors.min_stock_threshold ? 'border-red-300 bg-red-50' : ''
                            }`}
                          />
                          <FieldError error={errors.min_stock_threshold} />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <button type="button" onClick={() => { setShowScanModal(false); resetScanModal(); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Product</button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Category Creation Modal ── */}
      {showCategoryModal && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New category suggested</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Category name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Brief description" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleDeclineCategory} disabled={creatingCategory} className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Decline</button>
              <button type="button" onClick={handleCreateCategory} disabled={creatingCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2">
                {creatingCategory ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Creating...</>
                ) : 'Create and select'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      {showDetailModal && viewingProduct && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Product Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product image with better presentation */}
              <div className="flex justify-center">
                {viewingProduct.image_url ? (
                  <div className="relative group">
                    <img
                      src={viewingProduct.image_url}
                      alt={viewingProduct.name}
                      className="max-h-64 rounded-lg object-contain border border-gray-200 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <ImageOff size={48} className="mb-2" />
                    <p className="text-sm">No image available</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900 font-medium">{viewingProduct.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference/SKU</label>
                  <p className="text-gray-900 font-mono">{viewingProduct.reference}</p>
                </div>
              </div>

              {viewingProduct.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingProduct.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{viewingProduct.category?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <p className="text-gray-900">{viewingProduct.warehouse?.name || '-'}</p>
                </div>
              </div>

              {/* Barcode Section with better styling */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Barcode</label>
                {viewingProduct.barcode ? (
                  <div className="space-y-4">
                    <div className="flex justify-center bg-gray-50 p-6 border rounded-lg">
                      <svg id="barcode-svg" className="max-w-full"></svg>
                    </div>
                    <p className="text-center font-mono text-lg font-semibold text-gray-700">{viewingProduct.barcode}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleGenerateDetailBarcode}
                        disabled={generatingDetailBarcode}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {generatingDetailBarcode ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</>
                        ) : (
                          <><Barcode size={18} />Regenerate Barcode</>
                        )}
                      </button>
                      <button
                        onClick={() => handlePrintLabel(viewingProduct.id, viewingProduct.reference)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Printer size={18} />Print Label
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No barcode generated yet</p>
                    </div>
                    <button
                      onClick={handleGenerateDetailBarcode}
                      disabled={generatingDetailBarcode}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {generatingDetailBarcode ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generating...</>
                      ) : (
                        <><Barcode size={18} />Generate Barcode</>
                      )}
                    </button>
                  </div>
                )}
                {!viewingProduct.warehouse_id && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">No warehouse assigned. The generated barcode will use the GEN prefix.</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <p className="text-gray-900">{viewingProduct.unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price HT</label>
                  <p className="text-gray-900 font-semibold text-lg">{(viewingProduct.sale_price_ht || 0).toFixed(3)} DT</p>
                </div>
                {viewingProduct.is_stockable && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                      <p className={`text-gray-900 font-semibold text-lg ${
                        viewingProduct.current_stock <= viewingProduct.min_stock_threshold ? 'text-red-600' : ''
                      }`}>
                        {viewingProduct.current_stock} {viewingProduct.unit}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Threshold</label>
                      <p className="text-gray-900">{viewingProduct.min_stock_threshold} {viewingProduct.unit}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              {canUpdateProduct && (
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEdit(viewingProduct);
                  }} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Edit size={16} />Edit Product
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {showDeleteConfirm && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Delete product?</h2>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Stock Warning ── */}
      {showLowStockWarning && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Low Stock Alert</h2>
                <p className="text-gray-700 mb-3">
                  The product <strong>"{lowStockProductName}"</strong> has been saved successfully.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> The minimum stock threshold is higher than the current stock level. 
                    This product will be marked as low stock.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowLowStockWarning(false)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}