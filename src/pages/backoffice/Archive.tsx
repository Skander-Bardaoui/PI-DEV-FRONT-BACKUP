import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import { stockMovementsApi } from '../../api/stock-movements.api';
import { Product } from '../../types/product';
import { Category } from '../../types/category';
import { StockMovement } from '../../types/stock-movement';
import { toast } from 'sonner';
import {
  Archive as ArchiveIcon,
  RotateCcw,
  Package,
  FolderTree,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

type EntityType = 'products' | 'categories' | 'movements';

interface ArchivedItem {
  id: string;
  name: string;
  type: string;
  deleted_at: string;
  deleted_by?: string;
  metadata?: Record<string, any>;
}

export default function Archive() {
  const { user } = useAuth();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();
  const [activeTab, setActiveTab] = useState<EntityType>('products');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Archived data
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [archivedCategories, setArchivedCategories] = useState<Category[]>([]);
  const [archivedMovements, setArchivedMovements] = useState<StockMovement[]>([]);

  // Check if user has permission
  const canManageArchive = user?.role === 'BUSINESS_OWNER' || user?.role === 'BUSINESS_ADMIN';

  useEffect(() => {
    if (!canManageArchive) {
      toast.error('You do not have permission to access the archive');
      return;
    }
    fetchArchivedData();
  }, [activeTab, businessId, canManageArchive]);

  const fetchArchivedData = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'products': {
          const products = await productsApi.getArchived(businessId);
          setArchivedProducts(products);
          break;
        }
        case 'categories': {
          const categories = await categoriesApi.getArchived(businessId);
          setArchivedCategories(categories);
          break;
        }
        case 'movements': {
          const movements = await stockMovementsApi.getArchived(businessId);
          setArchivedMovements(movements);
          break;
        }
      }
    } catch (error: any) {
      console.error('Error fetching archived data:', error);
      toast.error(error.response?.data?.message || 'Failed to load archived items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string, type: EntityType) => {
    if (!businessId) return;

    try {
      switch (type) {
        case 'products':
          await productsApi.restore(businessId, id);
          toast.success('Product restored successfully');
          break;
        case 'categories':
          await categoriesApi.restore(businessId, id);
          toast.success('Category restored successfully');
          break;
        case 'movements':
          await stockMovementsApi.restore(businessId, id);
          toast.success('Stock movement restored successfully');
          break;
      }
      fetchArchivedData();
    } catch (error: any) {
      console.error('Error restoring item:', error);
      toast.error(error.response?.data?.message || 'Failed to restore item');
    }
  };

  const filterItems = <T extends { name?: string; reference?: string; sku?: string }>(
    items: T[],
  ): T[] => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.reference?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query),
    );
  };

  if (!canManageArchive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only Business Owners and Admins can access the archive.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'products' as EntityType, label: 'Products', icon: Package, count: archivedProducts.length },
    { id: 'categories' as EntityType, label: 'Categories', icon: FolderTree, count: archivedCategories.length },
    { id: 'movements' as EntityType, label: 'Stock Movements', icon: TrendingUp, count: archivedMovements.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ArchiveIcon className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
          </div>
          <p className="text-gray-600">
            View and restore soft-deleted items. Only Business Owners and Admins can access this section.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Archived Items</h3>
              <p className="text-sm text-yellow-800">
                These items have been soft-deleted and are hidden from normal views. You can restore them at any time.
                All actions are logged in the audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search archived items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading archived items...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <>
                {filterItems(archivedProducts).length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Archived Products</h3>
                    <p className="text-gray-600">There are no archived products at the moment.</p>
                  </div>
                ) : (
                  filterItems(archivedProducts).map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              {product.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">SKU:</span> {product.reference || product.sku}
                            </div>
                            <div>
                              <span className="font-medium">Price:</span> {product.sale_price_ht?.toFixed(2)} DH
                            </div>
                            {product.barcode && (
                              <div>
                                <span className="font-medium">Barcode:</span> {product.barcode}
                              </div>
                            )}
                            {product.category_id && (
                              <div>
                                <span className="font-medium">Category:</span> {product.category_id}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Deleted: {format(new Date(product.created_at), 'PPp')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestore(product.id, 'products')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <>
                {filterItems(archivedCategories).length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <FolderTree className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Archived Categories</h3>
                    <p className="text-gray-600">There are no archived categories at the moment.</p>
                  </div>
                ) : (
                  filterItems(archivedCategories).map((category) => (
                    <div
                      key={category.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FolderTree className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Deleted: {format(new Date(category.created_at), 'PPp')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestore(category.id, 'categories')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Stock Movements Tab */}
            {activeTab === 'movements' && (
              <>
                {archivedMovements.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Archived Stock Movements</h3>
                    <p className="text-gray-600">There are no archived stock movements at the moment.</p>
                  </div>
                ) : (
                  archivedMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {movement.type} - {movement.quantity} units
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                movement.type?.includes('ENTREE')
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {movement.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Product ID:</span> {movement.product_id}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span>{' '}
                              {format(new Date(movement.created_at), 'PP')}
                            </div>
                            {movement.note && (
                              <div className="col-span-2">
                                <span className="font-medium">Notes:</span> {movement.note}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Deleted: {format(new Date(movement.created_at), 'PPp')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestore(movement.id, 'movements')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
