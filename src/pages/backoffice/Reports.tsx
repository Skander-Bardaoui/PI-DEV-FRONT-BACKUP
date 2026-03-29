import { useState } from 'react';
import {
  Download,
  Calendar,
  Filter,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon
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

const monthlyData = [
  { month: 'Jan', revenus: 32000, depenses: 12000, profit: 20000 },
  { month: 'Fév', revenus: 38000, depenses: 14000, profit: 24000 },
  { month: 'Mar', revenus: 35000, depenses: 11000, profit: 24000 },
  { month: 'Avr', revenus: 42000, depenses: 15000, profit: 27000 },
  { month: 'Mai', revenus: 48000, depenses: 13000, profit: 35000 },
  { month: 'Jun', revenus: 45200, depenses: 12800, profit: 32400 },
  { month: 'Jul', revenus: 52000, depenses: 16000, profit: 36000 },
  { month: 'Aoû', revenus: 49000, depenses: 14500, profit: 34500 },
  { month: 'Sep', revenus: 55000, depenses: 17000, profit: 38000 },
  { month: 'Oct', revenus: 58000, depenses: 15500, profit: 42500 },
  { month: 'Nov', revenus: 62000, depenses: 18000, profit: 44000 },
  { month: 'Déc', revenus: 68000, depenses: 20000, profit: 48000 }
];

const expensesByCategory = [
  { name: 'Salaires', value: 45000, color: '#6366F1' },
  { name: 'Loyer', value: 12000, color: '#8B5CF6' },
  { name: 'Marketing', value: 8500, color: '#EC4899' },
  { name: 'IT & Logiciels', value: 6200, color: '#F59E0B' },
  { name: 'Fournitures', value: 3800, color: '#10B981' },
  { name: 'Autres', value: 4500, color: '#6B7280' }
];

const topClients = [
  { name: 'Tech Solutions SARL', revenue: 45000, invoices: 12 },
  { name: 'Media Group Tunisia', revenue: 38500, invoices: 15 },
  { name: 'Digital Agency', revenue: 28000, invoices: 8 },
  { name: 'E-Commerce Plus', revenue: 24500, invoices: 7 },
  { name: 'StartUp Innovation', revenue: 18200, invoices: 5 }
];

const invoicesByStatus = [
  { status: 'Payées', count: 145, amount: 285000 },
  { status: 'En attente', count: 23, amount: 45600 },
  { status: 'En retard', count: 8, amount: 12400 }
];

export default function Reports() {
  const [period, setPeriod] = useState('year');
  const [reportType, setReportType] = useState('overview');

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenus, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.depenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex">
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

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Revenus totaux</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} TND</p>
          <p className="text-sm text-green-600 mt-1">+18.2% vs année précédente</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Dépenses totales</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} TND</p>
          <p className="text-sm text-red-600 mt-1">+8.5% vs année précédente</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Bénéfice net</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProfit.toLocaleString()} TND</p>
          <p className="text-sm text-green-600 mt-1">+24.7% vs année précédente</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Factures émises</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">176</p>
          <p className="text-sm text-green-600 mt-1">+12 ce mois</p>
        </div>
      </div>

      {/* Charts Row */}
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
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} TND`} />
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
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} TND`} />
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

      {/* Tables Row */}
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
                <p className="font-semibold text-gray-900">{client.revenue.toLocaleString()} TND</p>
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
                    <span className="text-gray-900 font-medium">{item.count} ({item.amount.toLocaleString()} TND)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'Payées' ? 'bg-green-500' :
                        item.status === 'En attente' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(item.count / 176) * 100}%` }}
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
                  <p className="font-semibold text-gray-900">343,000 TND</p>
                </div>
                <div>
                  <p className="text-gray-500">À recouvrer</p>
                  <p className="font-semibold text-yellow-600">58,000 TND</p>
                </div>
                <div>
                  <p className="text-gray-500">Taux de recouvrement</p>
                  <p className="font-semibold text-green-600">83.1%</p>
                </div>
                <div>
                  <p className="text-gray-500">Délai moyen paiement</p>
                  <p className="font-semibold text-gray-900">18 jours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exporter les rapports</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { type: 'PDF', desc: 'Rapport complet' },
            { type: 'Excel', desc: 'Données détaillées' },
            { type: 'CSV', desc: 'Données brutes' },
            { type: 'Imprimer', desc: 'Version papier' }
          ].map((opt) => (
            <button
              key={opt.type}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Download className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-gray-900">{opt.type}</span>
              <span className="text-xs text-gray-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
