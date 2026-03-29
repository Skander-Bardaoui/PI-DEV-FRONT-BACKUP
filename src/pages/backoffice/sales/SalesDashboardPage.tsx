import { useAuth } from '../../../hooks/useAuth';
import { FileText, ShoppingCart, Truck, Receipt, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { AiForecastPanel } from '../../../components/sales/AiForecastPanel';

interface DashboardStats {
  pendingQuotes: number;
  activeOrders: number;
  todayDeliveries: number;
  unpaidInvoices: number;
  monthlyRevenue: number;
  topClients: Array<{
    name: string;
    total: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export default function SalesDashboardPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['sales-dashboard', businessId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<DashboardStats>(
        `/businesses/${businessId}/sales/dashboard`
      );
      return data;
    },
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erreur lors du chargement: {(error as any)?.message || 'Erreur inconnue'}</p>
          <p className="text-sm text-red-600 mt-2">Vérifiez que le backend est démarré sur le port 3001</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Devis en attente',
      value: stats?.pendingQuotes ?? 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Commandes en cours',
      value: stats?.activeOrders ?? 0,
      icon: ShoppingCart,
      color: 'bg-yellow-500',
    },
    {
      title: 'Livraisons du jour',
      value: stats?.todayDeliveries ?? 0,
      icon: Truck,
      color: 'bg-green-500',
    },
    {
      title: 'Factures impayées',
      value: stats?.unpaidInvoices ?? 0,
      icon: Receipt,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord - Ventes</h1>
        <p className="text-gray-600">Vue d'ensemble de vos ventes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Chiffre d'affaires mensuel
          </h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">
                {stats?.monthlyRevenue?.toFixed(3) ?? '0.000'} DT
              </p>
              <p className="text-gray-500 mt-2">Ce mois-ci</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Top clients
          </h2>
          <div className="space-y-3">
            {stats?.topClients && stats.topClients.length > 0 ? (
              stats.topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-blue-600 font-semibold">{client.total.toFixed(3)} DT</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section avec Activité récente et Prévisions IA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Activité récente - 2 colonnes sur grand écran */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Activité récente</h2>
          <div className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>

        {/* Prévisions IA - 1 colonne sur grand écran */}
        <div>
          <AiForecastPanel businessId={businessId} />
        </div>
      </div>
    </div>
  );
}
