import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessId } from '../../hooks/useBusinessId';
import { useParams, useNavigate } from 'react-router-dom';
import { warehousesApi } from '../../api/warehouses.api';
import { Warehouse } from '../../types/warehouse';
import { StockProduct } from '../../types/product';
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  AlertTriangle,
} from 'lucide-react';

export default function WarehouseDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { businessId, loading: loadingBusinessId, error: businessIdError } = useBusinessId();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId && id) {
      loadData();
    }
  }, [businessId, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warehouseData, stockData] = await Promise.all([
        warehousesApi.getOne(businessId!, id!),
        warehousesApi.getWarehouseStock(businessId!, id!),
      ]);
      setWarehouse(warehouseData);
      setProducts(stockData);
    } catch (error) {
      console.error('Error loading warehouse data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!businessId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No business associated with your account.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading warehouse...</p>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Warehouse not found</p>
        </div>
      </div>
    );
  }

  const lowStockProducts = products.filter(
    (p) => p.current_stock <= p.min_stock_threshold
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/warehouses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Warehouses
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <WarehouseIcon size={32} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{warehouse.name}</h1>
                <p className="text-gray-600">{warehouse.code}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                warehouse.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {warehouse.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {warehouse.description && (
            <p className="mt-4 text-gray-700">{warehouse.description}</p>
          )}

          {warehouse.address && (
            <div className="flex items-start gap-2 mt-4 text-gray-600">
              <MapPin size={20} className="mt-0.5 flex-shrink-0" />
              <p>{warehouse.address}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {products.reduce((sum, p) => sum + p.current_stock, 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Units</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {lowStockProducts.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Low Stock Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package size={20} />
            Products in this Warehouse
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products assigned
            </h3>
            <p className="text-gray-600">
              Assign products to this warehouse when creating or editing them
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Min Threshold
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock_threshold;
                  return (
                    <tr key={product.id} className={isLowStock ? 'bg-orange-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{product.reference}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {product.category?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {product.current_stock.toFixed(3)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-gray-600">
                          {product.min_stock_threshold.toFixed(3)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            <AlertTriangle size={12} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
