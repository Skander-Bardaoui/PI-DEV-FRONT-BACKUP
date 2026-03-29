// src/pages/backoffice/StockDashboard.tsx
import { Package, AlertTriangle, Tag, TrendingUp } from 'lucide-react';
import StockCard from '../../components/stock/StockCard';

// Mock data
const mockStats = {
  totalProducts: 156,
  lowStockProducts: 12,
  totalCategories: 8,
  totalMovements: 342
};

const mockLowStockProducts = [
  { id: '1', name: 'Laptop Dell XPS 15', sku: 'LAP-001', quantity: 3, minQuantity: 10 },
  { id: '2', name: 'Souris Logitech MX Master', sku: 'ACC-045', quantity: 5, minQuantity: 15 },
  { id: '3', name: 'Clavier Mécanique RGB', sku: 'ACC-023', quantity: 2, minQuantity: 8 },
  { id: '4', name: 'Écran Samsung 27"', sku: 'MON-012', quantity: 4, minQuantity: 12 },
  { id: '5', name: 'Webcam HD Pro', sku: 'ACC-089', quantity: 1, minQuantity: 6 }
];

const mockRecentMovements = [
  { id: '1', product: 'Laptop HP ProBook', type: 'IN', quantity: 15, date: '15 Jan 2024' },
  { id: '2', product: 'Souris sans fil', type: 'OUT', quantity: 8, date: '14 Jan 2024' },
  { id: '3', product: 'Clavier USB', type: 'ADJUSTMENT', quantity: 3, date: '14 Jan 2024' },
  { id: '4', product: 'Écran Dell 24"', type: 'IN', quantity: 10, date: '13 Jan 2024' },
  { id: '5', product: 'Casque audio', type: 'OUT', quantity: 5, date: '12 Jan 2024' }
];

export default function StockDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de Stock</h1>
          <p className="text-gray-500">Vue d'ensemble de votre inventaire</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StockCard
          title="Total Produits"
          value={mockStats.totalProducts}
          icon={Package}
          color="indigo"
          change="+12"
          trend="up"
        />
        <StockCard
          title="Stock Faible"
          value={mockStats.lowStockProducts}
          icon={AlertTriangle}
          color="red"
          change="+3"
          trend="up"
        />
        <StockCard
          title="Catégories"
          value={mockStats.totalCategories}
          icon={Tag}
          color="green"
        />
        <StockCard
          title="Mouvements"
          value={mockStats.totalMovements}
          icon={TrendingUp}
          color="yellow"
          change="+45"
          trend="up"
        />
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stock Faible</h2>
                <p className="text-sm text-gray-500">Produits nécessitant un réapprovisionnement</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {mockLowStockProducts.map((product) => (
              <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">
                    {product.quantity} / {product.minQuantity}
                  </p>
                  <p className="text-xs text-gray-500">En stock / Min</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Voir tous les produits
            </button>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Mouvements Récents</h2>
                <p className="text-sm text-gray-500">Dernières opérations de stock</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {mockRecentMovements.map((movement) => (
              <div key={movement.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    movement.type === 'IN' ? 'bg-green-100' :
                    movement.type === 'OUT' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      movement.type === 'IN' ? 'text-green-600' :
                      movement.type === 'OUT' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '~'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{movement.product}</p>
                    <p className="text-sm text-gray-500">{movement.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    movement.type === 'IN' ? 'bg-green-100 text-green-700' :
                    movement.type === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {movement.type === 'IN' ? 'Entrée' : movement.type === 'OUT' ? 'Sortie' : 'Ajustement'}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{movement.quantity} unités</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Voir tous les mouvements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
