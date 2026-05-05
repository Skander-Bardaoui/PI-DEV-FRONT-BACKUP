import { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Calendar,
  Filter,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  Loader2,
  Printer,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useSalesInvoices } from '@/hooks/useSalesInvoices';
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import { useClients } from '@/hooks/useClients';
import { useSuppliers } from '@/hooks/useSuppliers';
import { formatAmount } from '@/types';
import { SalesInvoiceStatus } from '@/types/sales-invoice';
import { stockDashboardApi } from '@/api/stock-dashboard.api';
import { useToast } from '@/components/ui/Toast';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6B7280'];

export default function Reports() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const toast = useToast();
  
  const [period, setPeriod] = useState('year');
  const [reportType, setReportType] = useState('overview');
  const [stockData, setStockData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch real data
  const { data: salesInvoicesData, isLoading: loadingSales } = useSalesInvoices(businessId, { limit: 1000 });
  const { data: purchaseInvoicesData, isLoading: loadingPurchases } = usePurchaseInvoices(businessId, { limit: 1000 });
  const { data: clientsData, isLoading: loadingClients } = useClients(businessId, { limit: 1000 });
  const { data: suppliersData, isLoading: loadingSuppliers } = useSuppliers(businessId, { limit: 1000 });

  // Fetch stock data
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
  const totalProducts = stockData?.summary?.total_products || 0;

  const isLoading = loadingSales || loadingPurchases || loadingClients || loadingSuppliers;

  // Calculate monthly data from real invoices
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthSales = salesInvoices.filter(inv => {
        const date = new Date(inv.date); // SalesInvoice uses 'date' property
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      const monthPurchases = purchaseInvoices.filter(inv => {
        const date = new Date(inv.invoice_date); // PurchaseInvoice uses 'invoice_date' property
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      const revenus = monthSales.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0);
      const depenses = monthPurchases.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0);
      
      return {
        month,
        revenus: Math.round(revenus * 100) / 100,
        depenses: Math.round(depenses * 100) / 100,
        profit: Math.round((revenus - depenses) * 100) / 100,
      };
    });
  }, [salesInvoices, purchaseInvoices]);

  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    purchaseInvoices.forEach(inv => {
      const category = inv.supplier?.category || 'Autres';
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + Number(inv.net_amount || 0));
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [purchaseInvoices]);

  // Calculate top clients
  const topClients = useMemo(() => {
    const clientMap = new Map<string, { revenue: number; invoices: number; name: string }>();
    
    salesInvoices.forEach(inv => {
      if (inv.client) {
        const clientId = inv.client.id;
        const current = clientMap.get(clientId) || { revenue: 0, invoices: 0, name: inv.client.name };
        clientMap.set(clientId, {
          name: inv.client.name,
          revenue: current.revenue + Number(inv.net_amount || 0),
          invoices: current.invoices + 1,
        });
      }
    });
    
    return Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(client => ({
        ...client,
        revenue: Math.round(client.revenue * 100) / 100,
      }));
  }, [salesInvoices]);

  // Calculate invoice status
  const invoicesByStatus = useMemo(() => {
    const paid = salesInvoices.filter(inv => inv.status === SalesInvoiceStatus.PAID);
    const pending = salesInvoices.filter(inv => inv.status === SalesInvoiceStatus.SENT || inv.status === SalesInvoiceStatus.DRAFT);
    const overdue = salesInvoices.filter(inv => inv.status === SalesInvoiceStatus.OVERDUE);
    
    return [
      {
        status: 'Payées',
        count: paid.length,
        amount: Math.round(paid.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0) * 100) / 100,
      },
      {
        status: 'En attente',
        count: pending.length,
        amount: Math.round(pending.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0) * 100) / 100,
      },
      {
        status: 'En retard',
        count: overdue.length,
        amount: Math.round(overdue.reduce((sum, inv) => sum + Number(inv.net_amount || 0), 0) * 100) / 100,
      },
    ];
  }, [salesInvoices]);

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenus, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.depenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalInvoices = salesInvoices.length;
  const totalBilled = invoicesByStatus.reduce((sum, s) => sum + s.amount, 0);
  const toRecover = invoicesByStatus.find(s => s.status === 'En attente')?.amount || 0 + 
                    invoicesByStatus.find(s => s.status === 'En retard')?.amount || 0;
  const recoveryRate = totalBilled > 0 ? ((invoicesByStatus.find(s => s.status === 'Payées')?.amount || 0) / totalBilled * 100) : 0;

  // Export functions
  const exportToCSV = () => {
    try {
      setExporting(true);
      
      // Create CSV content
      let csv = 'Rapport Financier\n\n';
      csv += 'Période,Revenus,Dépenses,Profit\n';
      monthlyData.forEach(row => {
        csv += `${row.month},${row.revenus},${row.depenses},${row.profit}\n`;
      });
      
      csv += '\n\nTop Clients\n';
      csv += 'Nom,Revenus,Factures\n';
      topClients.forEach(client => {
        csv += `${client.name},${client.revenue},${client.invoices}\n`;
      });
      
      csv += '\n\nDépenses par Catégorie\n';
      csv += 'Catégorie,Montant\n';
      expensesByCategory.forEach(cat => {
        csv += `${cat.name},${cat.value}\n`;
      });
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rapport_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Export réussi', 'Le fichier CSV a été téléchargé');
    } catch (error) {
      toast.error('Erreur', 'Impossible d\'exporter en CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    try {
      setExporting(true);
      
      // Create Excel-compatible CSV with tabs
      let excel = 'Rapport Financier\t\t\t\n\n';
      excel += 'Période\tRevenus\tDépenses\tProfit\n';
      monthlyData.forEach(row => {
        excel += `${row.month}\t${row.revenus}\t${row.depenses}\t${row.profit}\n`;
      });
      
      excel += '\n\nRésumé\t\t\n';
      excel += `Total Revenus\t${totalRevenue}\n`;
      excel += `Total Dépenses\t${totalExpenses}\n`;
      excel += `Bénéfice Net\t${totalProfit}\n`;
      excel += `Factures Émises\t${totalInvoices}\n`;
      excel += `Clients Actifs\t${clients.length}\n`;
      excel += `Fournisseurs\t${suppliers.length}\n`;
      excel += `Produits\t${totalProducts}\n`;
      
      excel += '\n\nTop Clients\t\t\n';
      excel += 'Nom\tRevenus\tFactures\n';
      topClients.forEach(client => {
        excel += `${client.name}\t${client.revenue}\t${client.invoices}\n`;
      });
      
      // Download
      const blob = new Blob([excel], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rapport_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();
      
      toast.success('Export réussi', 'Le fichier Excel a été téléchargé');
    } catch (error) {
      toast.error('Erreur', 'Impossible d\'exporter en Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    try {
      setExporting(true);
      toast.info('Génération PDF', 'Préparation du document...');
      
      // Use browser print to PDF
      window.print();
      
      setTimeout(() => {
        toast.success('PDF prêt', 'Utilisez la fonction d\'impression pour sauvegarder en PDF');
        setExporting(false);
      }, 500);
    } catch (error) {
      toast.error('Erreur', 'Impossible de générer le PDF');
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:space-y-4 > * + * { margin-top: 1rem; }
          @page { margin: 1cm; }
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Analytics</h1>
          <p className="text-gray-500">Analysez les performances de votre entreprise</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-5 w-5" />
            Exporter
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex no-print">
        {[
          { id: 'overview', label: 'Vue d\'ensemble' },
          { id: 'revenue', label: 'Revenus' },
          { id: 'expenses', label: 'Dépenses' },
          { id: 'clients', label: 'Clients' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              reportType === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards - Always visible */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 print:break-inside-avoid">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Revenus totaux</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalRevenue)}</p>
          <p className="text-sm text-green-600 mt-1">Année en cours</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Dépenses totales</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalExpenses)}</p>
          <p className="text-sm text-red-600 mt-1">Année en cours</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Bénéfice net</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(totalProfit)}</p>
          <p className="text-sm text-green-600 mt-1">{totalProfit >= 0 ? 'Bénéfice' : 'Perte'}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Factures émises</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
          <p className="text-sm text-gray-600 mt-1">{clients.length} clients actifs</p>
        </div>
      </div>

      {/* Additional Business Metrics - Always visible */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Clients</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
          <p className="text-sm text-gray-600 mt-1">{salesInvoices.length} factures ventes</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Fournisseurs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
          <p className="text-sm text-gray-600 mt-1">{purchaseInvoices.length} factures achats</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Produits</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
          <p className="text-sm text-gray-600 mt-1">En stock</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Users className="h-5 w-5 text-pink-600" />
            </div>
            <span className="text-sm text-gray-500">Taux recouvrement</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{recoveryRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 mt-1">{formatAmount(toRecover)} à recouvrer</p>
        </div>
      </div>

      {/* Charts Row - Conditional based on tab */}
      {(reportType === 'overview' || reportType === 'revenue' || reportType === 'expenses') && (
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue/Expense Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenus, Dépenses et Profit</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Area type="monotone" dataKey="revenus" stroke="#22C55E" strokeWidth={2} fill="url(#colorRev)" name="Revenus" />
                <Area type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} fill="url(#colorDep)" name="Dépenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Répartition des dépenses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatAmount(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {expensesByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-gray-600 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Tables Row - Conditional based on tab */}
      {(reportType === 'overview' || reportType === 'clients') && (
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top clients par chiffre d'affaires</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topClients.map((client, index) => (
              <div key={client.name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.invoices} factures</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatAmount(client.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Status */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">État des factures</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {invoicesByStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">{item.status}</span>
                    <span className="text-gray-900 font-medium">{item.count} ({formatAmount(item.amount)})</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'Payées' ? 'bg-green-500' :
                        item.status === 'En attente' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${totalInvoices > 0 ? (item.count / totalInvoices) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-3">Résumé</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total facturé</p>
                  <p className="font-semibold text-gray-900">{formatAmount(totalBilled)}</p>
                </div>
                <div>
                  <p className="text-gray-500">À recouvrer</p>
                  <p className="font-semibold text-yellow-600">{formatAmount(toRecover)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Taux de recouvrement</p>
                  <p className="font-semibold text-green-600">{recoveryRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Produits en stock</p>
                  <p className="font-semibold text-gray-900">{totalProducts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Export Options - Always visible */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 no-print">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exporter les rapports</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> : <Download className="h-6 w-6 text-indigo-600" />}
            <span className="font-medium text-gray-900">PDF</span>
            <span className="text-xs text-gray-500">Rapport complet</span>
          </button>

          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="h-6 w-6 text-green-600 animate-spin" /> : <Download className="h-6 w-6 text-green-600" />}
            <span className="font-medium text-gray-900">Excel</span>
            <span className="text-xs text-gray-500">Données détaillées</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="h-6 w-6 text-blue-600 animate-spin" /> : <Download className="h-6 w-6 text-blue-600" />}
            <span className="font-medium text-gray-900">CSV</span>
            <span className="text-xs text-gray-500">Données brutes</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Printer className="h-6 w-6 text-purple-600" />
            <span className="font-medium text-gray-900">Imprimer</span>
            <span className="text-xs text-gray-500">Version papier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
