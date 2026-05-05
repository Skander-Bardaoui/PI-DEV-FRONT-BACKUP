import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Users,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wallet,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useSalesInvoices } from '@/hooks/useSalesInvoices';
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { stockDashboardApi } from '@/api/stock-dashboard.api';
import { formatAmount } from '@/types';
import { SalesInvoiceStatus } from '@/types/sales-invoice';
import { InvoiceStatus } from '@/types/purchase-invoice';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const [stockData, setStockData] = useState<any>(null);

  // Fetch data
  const { data: salesInvoicesData, isLoading: loadingSales } = useSalesInvoices(businessId, { limit: 100 });
  const { data: purchaseInvoicesData, isLoading: loadingPurchases } = usePurchaseInvoices(businessId, { limit: 100 });
  const { data: clientsData, isLoading: loadingClients } = useClients(businessId, { limit: 100 });
  const { data: suppliersData, isLoading: loadingSuppliers } = useSuppliers(businessId, { limit: 100 });

  useEffect(() => {
    if (businessId) {
      stockDashboardApi.getProductsDashboard(businessId)
        .then(data => setStockData(data))
        .catch(err => console.error('Error fetching stock data:', err));
    }
  }, [businessId]);

  const salesInvoices = salesInvoicesData?.data || [];
  const purchaseInvoices = purchaseInvoicesData?.data || [];
  const clients = clientsData?.clients || [];
  const suppliers = suppliersData?.data || [];

  const isLoading = loadingSales || loadingPurchases || loadingClients || loadingSuppliers;

  // Calculate metrics
  const totalSalesRevenue = salesInvoices.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0);
  const totalPurchaseExpenses = purchaseInvoices.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0);
  const paidSalesInvoices = salesInvoices.filter(inv => inv.status === SalesInvoiceStatus.PAID);
  const pendingSalesInvoices = salesInvoices.filter(inv => inv.status === SalesInvoiceStatus.SENT || inv.status === SalesInvoiceStatus.PARTIALLY_PAID);
  const overdueSalesInvoices = salesInvoices.filter(inv => inv.status === SalesInvoiceStatus.OVERDUE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Vue d'ensemble de votre activité</p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">Ventes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalSalesRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">{salesInvoices.length} factures</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Receipt className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-xs text-red-600 font-medium">Achats</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalPurchaseExpenses)}</p>
          <p className="text-sm text-gray-500 mt-1">{purchaseInvoices.length} factures</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs text-blue-600 font-medium">Clients</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
          <p className="text-sm text-gray-500 mt-1">Actifs</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-xs text-indigo-600 font-medium">Bénéfice</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalSalesRevenue - totalPurchaseExpenses)}</p>
          <p className="text-sm text-gray-500 mt-1">Net</p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Sales Module */}
        <div 
          onClick={() => navigate('/app/sales/dashboard')}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Ventes</h3>
                <p className="text-sm text-gray-600">Module commercial</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Clients</p>
              <p className="text-lg font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Factures</p>
              <p className="text-lg font-bold text-gray-900">{salesInvoices.length}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">CA</p>
              <p className="text-lg font-bold text-gray-900">{(totalSalesRevenue / 1000).toFixed(0)}k</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-gray-700">{paidSalesInvoices.length} payées</span>
            <Clock className="h-4 w-4 text-yellow-600 ml-2" />
            <span className="text-gray-700">{pendingSalesInvoices.length} en attente</span>
          </div>
        </div>

        {/* Purchases Module */}
        <div 
          onClick={() => navigate('/app/purchases/dashboard')}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Achats</h3>
                <p className="text-sm text-gray-600">Gestion fournisseurs</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Fournisseurs</p>
              <p className="text-lg font-bold text-gray-900">{suppliers.length}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Factures</p>
              <p className="text-lg font-bold text-gray-900">{purchaseInvoices.length}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Dépenses</p>
              <p className="text-lg font-bold text-gray-900">{(totalPurchaseExpenses / 1000).toFixed(0)}k</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span className="text-gray-700">{suppliers.filter(s => s.is_active).length} actifs</span>
          </div>
        </div>

        {/* Stock Module */}
        <div 
          onClick={() => navigate('/app/stock')}
          className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stock</h3>
                <p className="text-sm text-gray-600">Gestion inventaire</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Produits</p>
              <p className="text-lg font-bold text-gray-900">{stockData?.summary?.total_products || 0}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Catégories</p>
              <p className="text-lg font-bold text-gray-900">{stockData?.summary?.total_categories || 0}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Valeur</p>
              <p className="text-lg font-bold text-gray-900">{((stockData?.summary?.total_value || 0) / 1000).toFixed(0)}k</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-gray-700">{stockData?.summary?.low_stock_count || 0} en stock faible</span>
          </div>
        </div>

        {/* Treasury Module */}
        <div 
          onClick={() => navigate('/app/treasury/accounts')}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Trésorerie</h3>
                <p className="text-sm text-gray-600">Gestion financière</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">À recevoir</p>
              <p className="text-lg font-bold text-gray-900">{pendingSalesInvoices.length}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">À payer</p>
              <p className="text-lg font-bold text-gray-900">{purchaseInvoices.filter(inv => inv.status === InvoiceStatus.PENDING).length}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">En retard</p>
              <p className="text-lg font-bold text-gray-900">{overdueSalesInvoices.length}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-gray-700">Solde: {formatAmount(totalSalesRevenue - totalPurchaseExpenses)}</span>
          </div>
        </div>

        {/* Collaboration Module */}
        <div 
          onClick={() => navigate('/app/collaboration')}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 hover:shadow-lg transition-all cursor-pointer lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Collaboration</h3>
                <p className="text-sm text-gray-600">Gestion des tâches et équipe</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Tâches actives</p>
              <p className="text-lg font-bold text-gray-900">-</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Complétées</p>
              <p className="text-lg font-bold text-gray-900">-</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">En retard</p>
              <p className="text-lg font-bold text-gray-900">-</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Membres</p>
              <p className="text-lg font-bold text-gray-900">-</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <span className="text-gray-700">Cliquez pour voir les tâches et l'équipe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
