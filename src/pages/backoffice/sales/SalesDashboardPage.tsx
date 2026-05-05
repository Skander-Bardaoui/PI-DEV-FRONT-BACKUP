import { useAuth } from '../../../hooks/useAuth';
import { FileText, ShoppingCart, Truck, Receipt, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { AiForecastPanel } from '../../../components/sales/AiForecastPanel';
import { SalesForecastWidget } from '../../../components/sales/SalesForecastWidget';
import { HighRiskClientsWidget } from '../../../components/sales/HighRiskClientsWidget';
import { useAIAccess } from '../../../hooks/useAIAccess';

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
  const { hasAIAccess, loading: aiLoading } = useAIAccess();

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

      {/* ML Widgets - Sales Forecast & High Risk Clients - Only for Premium users */}
      {!aiLoading && hasAIAccess && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SalesForecastWidget businessId={businessId} forecastDays={30} />
          <HighRiskClientsWidget businessId={businessId} />
        </div>
      )}

      {/* Dashboard Power BI (grand) */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Dashboard Power BI
        </h2>
        <div className="relative w-full" style={{ paddingBottom: '60%' }}>
          <iframe
            title="PISAAS Dashboard"
            src="https://app.powerbi.com/reportEmbed?reportId=aa84f5ff-5e48-4237-8442-25926ba4d04e&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730"
            frameBorder="0"
            allowFullScreen={true}
            className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
          />
        </div>
      </div>

      {/* Prévisions IA - Only for Premium users */}
      {!aiLoading && hasAIAccess && (
        <div>
          <AiForecastPanel businessId={businessId} />
        </div>
      )}
    </div>
  );
}
