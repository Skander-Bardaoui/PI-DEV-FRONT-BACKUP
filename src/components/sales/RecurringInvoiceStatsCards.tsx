// src/components/sales/RecurringInvoiceStatsCards.tsx
import { TrendingUp, CheckCircle, FileText, Activity } from 'lucide-react';
import { useRecurringInvoiceStats } from '@/hooks/useRecurringInvoices';

interface Props {
  businessId: string;
}

export default function RecurringInvoiceStatsCards({ businessId }: Props) {
  const { data: stats, isLoading } = useRecurringInvoiceStats(businessId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const total = stats.total_active + stats.total_inactive + stats.total_paused;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Revenu mensuel prévisionnel */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 border border-green-100">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-green-600">Revenu mensuel prévisionnel</p>
          <p className="text-2xl font-bold text-green-700">
            {stats.monthly_revenue_forecast.toFixed(3)} DT
          </p>
          <p className="text-xs text-green-600">Basé sur les récurrences actives</p>
        </div>
      </div>

      {/* Récurrences actives */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-600">Récurrences actives</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats.total_active} / {total}
          </p>
          <p className="text-xs text-blue-600">
            {stats.total_paused > 0 && `${stats.total_paused} en pause`}
          </p>
        </div>
      </div>

      {/* Factures générées ce mois */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-purple-600">Factures générées</p>
          <p className="text-2xl font-bold text-purple-700">
            {stats.invoices_generated_this_month}
          </p>
          <p className="text-xs text-purple-600">Ce mois-ci</p>
        </div>
      </div>

      {/* Taux d'activation */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Activity className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-600">Taux d'activation</p>
          <p className="text-2xl font-bold text-amber-700">
            {stats.activation_rate.toFixed(1)}%
          </p>
          <div className="mt-2">
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.activation_rate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
