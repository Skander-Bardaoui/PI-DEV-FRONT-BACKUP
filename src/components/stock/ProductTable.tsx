// src/components/stock/ProductTable.tsx
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import { Product } from '../../types/product';

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Produit</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">SKU</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Prix</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Quantité</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Statut</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-gray-900">{product.price.toLocaleString()} TND</span>
                  {product.cost && (
                    <p className="text-xs text-gray-500">Coût: {product.cost.toLocaleString()} TND</p>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-semibold ${
                      product.quantity <= product.minQuantity ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {product.quantity}
                    </span>
                    {product.quantity <= product.minQuantity && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Min: {product.minQuantity}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    product.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
