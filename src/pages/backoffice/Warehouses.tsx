import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { useNavigate } from 'react-router-dom';
import { warehousesApi } from '../../api/warehouses.api';
import { Warehouse, CreateWarehouseDto } from '../../types/warehouse';
import LocationPicker from '../../components/common/LocationPicker';
import {
  Plus,
  Warehouse as WarehouseIcon,
  MapPin,
  Edit,
  Trash2,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { StockCardSkeleton } from '../../components/stock/StockSkeletonLoaders';

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
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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

export default function Warehouses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<CreateWarehouseDto>({
    name: '',
    code: '',
    description: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    is_active: true,
  });
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
        
        // Debug log
        console.log('stock_permissions:', member?.stock_permissions);
      } catch (err: any) {
        console.error('Failed to load user data:', err);
      }
    }
    loadUserData();
  }, [businessId]);

  // Permission checks
  const isOwner = currentUser?.role === 'BUSINESS_OWNER';
  const stock = currentMember?.stock_permissions;
  
  const canCreateWarehouse = isOwner || stock?.create_warehouse === true;
  const canUpdateWarehouse = isOwner || stock?.update_warehouse === true;
  const canDeleteWarehouse = isOwner || stock?.delete_warehouse === true;

  useEffect(() => {
    if (businessId) {
      loadWarehouses();
    }
  }, [businessId]);

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

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehousesApi.getAll(businessId!);
      setWarehouses(data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await warehousesApi.update(businessId!, editingWarehouse.id, formData);
      } else {
        await warehousesApi.create(businessId!, formData);
      }
      setShowModal(false);
      resetForm();
      loadWarehouses();
      toast.success(editingWarehouse ? 'Entrepôt mis à jour avec succès' : 'Entrepôt créé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'entrepôt');
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      description: warehouse.description || '',
      address: warehouse.address || '',
      latitude: warehouse.latitude || undefined,
      longitude: warehouse.longitude || undefined,
      is_active: warehouse.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await warehousesApi.delete(businessId!, id);
      loadWarehouses();
      toast.success('Entrepôt supprimé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de l\'entrepôt');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      is_active: true,
    });
    setEditingWarehouse(null);
  };

  const isDisplayLoading = loading || showSkeleton;

  if (!businessId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No business associated with your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <p className="text-gray-600 mt-1">Manage your storage locations</p>
        </div>
        {canCreateWarehouse && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Warehouse
          </button>
        )}
      </div>

      {isDisplayLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <StockCardSkeleton key={i} />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <WarehouseIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No warehouses yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first warehouse to organize your inventory
          </p>
          {canCreateWarehouse && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create Warehouse
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <WarehouseIcon size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                      <p className="text-sm text-gray-500">{warehouse.code}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      warehouse.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {warehouse.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {warehouse.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {warehouse.description}
                  </p>
                )}

                {warehouse.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{warehouse.address}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => navigate(`/app/warehouses/${warehouse.id}`)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Package size={16} />
                    View Stock
                  </button>
                  <div className="flex gap-2">
                    {canUpdateWarehouse && (
                      <button
                        onClick={() => handleEdit(warehouse)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canDeleteWarehouse && (
                      <button
                        onClick={() => handleDelete(warehouse.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                {editingWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} noValidate className="p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'entrepôt *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrepôt Principal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="WH01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Description optionnelle de l'entrepôt"
                  />
                </div>

                {/* Location Picker */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Localisation
                  </h3>
                  <LocationPicker
                    value={{
                      address: formData.address || '',
                      latitude: formData.latitude || 36.8065,
                      longitude: formData.longitude || 10.1815,
                    }}
                    onChange={(location) => {
                      setFormData({
                        ...formData,
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Actif</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingWarehouse ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
