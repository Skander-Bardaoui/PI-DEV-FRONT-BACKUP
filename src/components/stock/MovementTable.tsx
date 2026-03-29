// src/components/stock/MovementTable.tsx
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { StockMovement } from '../../types/stockMovement';

interface MovementTableProps {
  movements: StockMovement[];
  products: { id: string; name: string; sku: string }[];
}

export default function MovementTable({ movements, products }: MovementTableProps) {
  const getProductInfo = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case 'OUT':
        return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Entrée';
      case 'OUT':
        return 'Sortie';
      case 'ADJUSTMENT':
        return 'Ajustement';
      default:
        return type;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-700';
      case 'OUT':
        return 'bg-red-100 text-red-700';
      case 'ADJUSTMENT':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Produit</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Type</th>
              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Quantité</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Référence</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Note</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movements.map((movement) => {
              const product = getProductInfo(movement.productId);
              return (
                <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{product?.name || 'Produit inconnu'}</p>
                      <p className="text-sm text-gray-500 font-mono">{product?.sku || movement.productId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {getMovementIcon(movement.type)}
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getMovementColor(movement.type)}`}>
                        {getMovementLabel(movement.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${
                      movement.type === 'IN' ? 'text-green-600' :
                      movement.type === 'OUT' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-mono">
                      {movement.reference || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {movement.note || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
