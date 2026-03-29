import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { stockMovementsApi } from '../../api/stock-movements.api';
import { productsApi } from '../../api/products.api';
import {
  StockMovement,
  StockMovementType,
  CreateStockMovementDto,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_COLORS,
} from '../../types/stock-movement';
import { Product } from '../../types/product';
import {
  Plus,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

export default function StockMovements() {
  const { user } = useAuth();
  const businessId = user?.business_id;

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

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
    }
  }, [businessId, selectedProduct, selectedType, startDate, endDate, currentPage]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const response = await stockMovementsApi.getAll(businessId!, {
        product_id: selectedProduct || undefined,
        type: selectedType as StockMovementType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
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
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stockMovementsApi.createManual(businessId!, formData);
      setShowModal(false);
      resetForm();
      loadMovements();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating movement');
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
      type === StockMovementType.ENTREE_RETOUR_CLIENT ||
      type === StockMovementType.AJUSTEMENT_POSITIF
    ) {
      return <TrendingUp className="text-green-600" size={20} />;
    }
    return <TrendingDown className="text-red-600" size={20} />;
  };

  const totalPages = Math.ceil(total / pageSize);

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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No movements found
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
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
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Stock Movement</h2>
            <form onSubmit={handleSubmit}>
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
                  <option value={StockMovementType.ENTREE_RETOUR_CLIENT}>
                    {STOCK_MOVEMENT_TYPE_LABELS[StockMovementType.ENTREE_RETOUR_CLIENT]}
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
