// ==================== Alaa change for service type ====================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { categoriesApi } from '../../api/categories.api';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types/category';
import { CreateCategoryInput } from '../../validation/category.schema';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { CategoryFormModal } from '../../components/stock/CategoryFormModal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { toast } from 'sonner';

// Simple category row skeleton
function CategoryRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-64"></div>
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
  );
}

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

export default function ServiceCategories() {
  const { user } = useAuth();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // User and member state for permissions
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<BusinessMember | null>(null);

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
  
  const canCreateServiceCategory = isOwner || stock?.create_service_category === true;
  const canUpdateServiceCategory = isOwner || stock?.update_service_category === true;
  const canDeleteServiceCategory = isOwner || stock?.delete_service_category === true;

  useEffect(() => {
    if (businessId) {
      loadCategories();
    }
  }, [businessId, searchTerm, showActiveOnly]);

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

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll(businessId!, {
        search: searchTerm || undefined,
        is_active: showActiveOnly ? true : undefined,
        category_type: 'SERVICE',
      });
      setCategories(data);
    } catch (error) {
      console.error('Error loading service categories:', error);
      toast.error('Erreur lors du chargement des catégories de service');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setModalMode('create');
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleCategorySubmit = async (data: CreateCategoryInput) => {
    try {
      // Ensure name is present (validated by Zod schema)
      if (!data.name) {
        toast.error('Le nom de la catégorie est requis');
        return;
      }
      
      const dataToSend: CreateCategoryDto = {
        name: data.name,
        description: data.description || undefined,
        category_type: 'SERVICE',
      };
      
      if (modalMode === 'edit' && editingCategory) {
        await categoriesApi.update(businessId!, editingCategory.id, dataToSend);
        toast.success('Catégorie de service mise à jour avec succès');
      } else {
        await categoriesApi.create(businessId!, dataToSend);
        toast.success('Catégorie de service créée avec succès');
      }
      await loadCategories();
    } catch (error: any) {
      // Error is handled in the modal component
      throw error;
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      await categoriesApi.softDelete(businessId!, categoryToDelete.id);
      toast.success('Catégorie de service supprimée avec succès');
      await loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await categoriesApi.update(businessId!, category.id, {
        is_active: !category.is_active,
      });
      toast.success(`Catégorie ${category.is_active ? 'désactivée' : 'activée'} avec succès`);
      loadCategories();
    } catch (error) {
      console.error('Error toggling service category status:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

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
        <h1 className="text-2xl font-bold">Service Categories</h1>
        {canCreateServiceCategory && (
          <button
            onClick={handleCreateCategory}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Service Category
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search service categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
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

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
                  <CategoryRowSkeleton key={i} />
                ))}
              </>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No service categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{category.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canUpdateServiceCategory && (
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {canDeleteServiceCategory && (
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        category={editingCategory}
        mode={modalMode}
        categoryType="SERVICE"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la catégorie de service"
        message={
          <div>
            <p>Êtes-vous sûr de vouloir supprimer <strong>{categoryToDelete?.name}</strong> ?</p>
            <p className="mt-2 text-sm text-gray-600">
              Cette action peut être annulée depuis les archives.
            </p>
          </div>
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
// ====================================================================