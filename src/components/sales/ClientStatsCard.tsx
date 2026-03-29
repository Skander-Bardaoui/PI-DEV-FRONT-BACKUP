// src/components/sales/ClientStatsCard.tsx
import { TrendingUp, TrendingDown, DollarSign, FileText, ShoppingCart } from 'lucide-react';

interface ClientStats {
  totalOrders: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  averageOrderValue: number;
  trend: 'up' | 'down';
  trendPercentage: number;
}

interface Props {
  stats: ClientStats;
}

export default function ClientStatsCard({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </div>
          <div className={`flex items-center gap-1 text-sm ${stats.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {stats.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {stats.trendPercentage}%
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        <p className="text-sm text-gray-600">Commandes totales</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
        <p className="text-sm text-gray-600">Factures émises</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(3)} DT</p>
        <p className="text-sm text-gray-600">Chiffre d'affaires</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.pendingAmount.toFixed(3)} DT</p>
        <p className="text-sm text-gray-600">En attente de paiement</p>
      </div>
    </div>
  );
}
