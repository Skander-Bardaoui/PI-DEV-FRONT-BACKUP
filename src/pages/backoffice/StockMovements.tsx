import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { stockMovementsApi } from '../../api/stock-movements.api';
import { productsApi } from '../../api/products.api';
import { warehousesApi } from '../../api/warehouses.api';
import {
  StockMovement,
  StockMovementType,
  CreateStockMovementDto,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_COLORS,
} from '../../types/stock-movement';
import { Product } from '../../types/product';
import { Warehouse } from '../../types/warehouse';
import {
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StockMovementRowSkeleton } from '../../components/stock/StockSkeletonLoaders';

const PAGE_SIZE = 5;

// ─── Infinite Scroll Hook ─────────────────────────────────────────────────
function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [callback, hasMore]
  );
  
  return lastElementRef;
}

export default function StockMovements() {
  const { user } = useAuth();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [allMovements, setAllMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [total, setTotal] = useState(0);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateStockMovementDto>({
    product_id: '',
    type: StockMovementType.AJUSTEMENT_POSITIF,
    quantity: 0,
    note: '',
  });

  useEffect(() => {
    if (businessId) {
      loadMovements();
      loadProducts();
      loadWarehouses();
    }
  }, [businessId, selectedProduct, selectedType, startDate, endDate, currentPage]);

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

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    setIsLoadingMore(false);
  }, [selectedProduct, selectedType, startDate, endDate]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const response = await stockMovementsApi.getAll(businessId!, {
        product_id: selectedProduct || undefined,
        type: selectedType as StockMovementType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 1000, // Load all movements for client-side pagination
        offset: 0,
      });
      setAllMovements(response.data);
      setMovements(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll(businessId!, { is_active: true });
      // Filter out SERVICE and DIGITAL products - only show PHYSICAL products for stock movements
      const physicalProducts = data.filter(p => p.type === 'PHYSICAL' || p.is_stockable);
      setProducts(physicalProducts);
    } catch (error) {
      console.error('Error loading products:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stockMovementsApi.createManual(businessId!, formData);
      setShowModal(false);
      resetForm();
      loadMovements();
      toast.success('Mouvement de stock créé avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du mouvement');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      type: StockMovementType.AJUSTEMENT_POSITIF,
      quantity: 0,
      note: '',
    });
  };

  const getMovementIcon = (type: StockMovementType) => {
    if (
      type === StockMovementType.ENTREE_ACHAT ||
      type === StockMovementType.AJUSTEMENT_POSITIF
    ) {
      return <TrendingUp className="text-green-600" size={20} />;
    }
    return <TrendingDown className="text-red-600" size={20} />;
  };

  // Infinite scroll logic
  const displayed = allMovements.slice(0, displayCount);
  const hasMore = displayCount < allMovements.length;

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      // Show loading for 2 seconds before loading more
      setTimeout(() => {
        setDisplayCount((prev) => prev + PAGE_SIZE);
        setIsLoadingMore(false);
      }, 2000);
    }
  }, [hasMore, isLoadingMore]);

  const lastElementRef = useInfiniteScroll(loadMore, hasMore && !isLoadingMore);

  const totalPages = Math.ceil(total / pageSize);
  const isDisplayLoading = loading || showSkeleton;

  if (!businessId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No business associated with your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Movements</h1>
          <p className="text-gray-600 mt-1">Track all stock changes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Movement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package size={16} className="inline mr-1" />
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.reference})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter size={16} className="inline mr-1" />
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              {Object.entries(STOCK_MOVEMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Before
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                After
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isDisplayLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <StockMovementRowSkeleton key={i} />
                ))}
              </>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No movements found
                </td>
              </tr>
            ) : (
              displayed.map((movement, index) => {
                const isLastElement = index === displayed.length - 1;
                return (
                  <tr 
                    key={movement.id}
                    ref={isLastElement && lastElementRef ? lastElementRef : null}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.product?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.product?.reference}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            STOCK_MOVEMENT_TYPE_COLORS[movement.type]
                          }`}
                        >
                          {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {movement.quantity.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-600">
                        {movement.stock_before.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {movement.stock_after.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {movement.note || '-'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Loading indicator for infinite scroll */}
        {!isDisplayLoading && isLoadingMore && (
          <div className="flex items-center justify-center px-6 py-8 border-t bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-b-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
              </div>
              <span className="text-sm font-semibold text-indigo-700">Loading more movements...</span>
            </div>
          </div>
        )}

        {/* Footer with count */}
        {!isDisplayLoading && !hasMore && !isLoadingMore && displayed.length > 0 && (
          <div className="flex items-center justify-center px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white">
            <p className="text-sm text-gray-600 font-medium">
              Showing <span className="font-bold text-indigo-600">{displayed.length}</span> of{' '}
              <span className="font-bold text-gray-900">{total}</span> movement{total > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Create Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Stock Movement</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product *
                </label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.reference}) - Stock:{' '}
                      {product.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as StockMovementType,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={StockMovementType.AJUSTEMENT_POSITIF}>
                    {STOCK_MOVEMENT_TYPE_LABELS[StockMovementType.AJUSTEMENT_POSITIF]}
                  </option>
                  <option value={StockMovementType.AJUSTEMENT_NEGATIF}>
                    {STOCK_MOVEMENT_TYPE_LABELS[StockMovementType.AJUSTEMENT_NEGATIF]}
                  </option>
                  <option value={StockMovementType.ENTREE_ACHAT}>
                    {STOCK_MOVEMENT_TYPE_LABELS[StockMovementType.ENTREE_ACHAT]}
                  </option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0.001"
                  step="0.001"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse
                </label>
                <select
                  value={formData.warehouse_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouse_id: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">No Warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
