import { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Receipt,
  CheckCircle,
  Clock,
  X,
  Calendar,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const expenses = [
  { id: 1, description: 'Fournitures de bureau', category: 'Bureau', amount: 450, date: '15 Jan 2024', status: 'approved', vendor: 'Office Plus', receipt: true },
  { id: 2, description: 'Abonnement Adobe Creative', category: 'Logiciels', amount: 1200, date: '14 Jan 2024', status: 'approved', vendor: 'Adobe', receipt: true },
  { id: 3, description: 'Déjeuner client - Réunion projet', category: 'Repas', amount: 85, date: '13 Jan 2024', status: 'pending', vendor: 'Restaurant Le Comptoir', receipt: true },
  { id: 4, description: 'Uber - Déplacement client', category: 'Transport', amount: 45, date: '12 Jan 2024', status: 'approved', vendor: 'Uber', receipt: false },
  { id: 5, description: 'Hébergement serveur', category: 'IT', amount: 320, date: '10 Jan 2024', status: 'approved', vendor: 'OVH Cloud', receipt: true },
  { id: 6, description: 'Cartes de visite', category: 'Marketing', amount: 180, date: '08 Jan 2024', status: 'pending', vendor: 'Print Express', receipt: true },
  { id: 7, description: 'Licence Microsoft 365', category: 'Logiciels', amount: 600, date: '05 Jan 2024', status: 'approved', vendor: 'Microsoft', receipt: true },
  { id: 8, description: 'Matériel informatique', category: 'IT', amount: 2500, date: '03 Jan 2024', status: 'approved', vendor: 'Tunisianet', receipt: true },
];

const categoryData = [
  { name: 'IT', value: 2820, color: '#6366F1' },
  { name: 'Logiciels', value: 1800, color: '#8B5CF6' },
  { name: 'Bureau', value: 450, color: '#EC4899' },
  { name: 'Marketing', value: 180, color: '#F59E0B' },
  { name: 'Transport', value: 45, color: '#10B981' },
  { name: 'Repas', value: 85, color: '#EF4444' },
];

const categories = ['Bureau', 'Logiciels', 'Repas', 'Transport', 'IT', 'Marketing', 'Autre'];

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewExpense, setShowNewExpense] = useState(false);

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="text-gray-500">Suivez et catégorisez vos dépenses</p>
        </div>
        <button
          onClick={() => setShowNewExpense(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle dépense
        </button>
      </div>

      {/* Stats and Chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé du mois</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Total dépenses</p>
              <p className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} TND</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Approuvées</p>
              <p className="text-2xl font-bold text-green-600">
                {expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0).toLocaleString()} TND
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0).toLocaleString()} TND
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Par catégorie</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} TND`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-gray-600">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une dépense..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous statuts</option>
              <option value="approved">Approuvées</option>
              <option value="pending">En attente</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Description</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Catégorie</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Fournisseur</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Montant</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Reçu</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-red-500" />
                      </div>
                      <span className="font-medium text-gray-900">{expense.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{expense.vendor}</td>
                  <td className="px-6 py-4 text-gray-600">{expense.date}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {expense.amount.toLocaleString()} TND
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {expense.status === 'approved' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {expense.status === 'approved' ? 'Approuvée' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {expense.receipt ? (
                      <span className="text-green-500"><CheckCircle className="h-5 w-5 mx-auto" /></span>
                    ) : (
                      <span className="text-gray-300"><X className="h-5 w-5 mx-auto" /></span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
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

      {/* New Expense Modal */}
      {showNewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle dépense</h2>
              <button onClick={() => setShowNewExpense(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Description de la dépense"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant (TND)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">Sélectionner</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nom du fournisseur"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reçu / Justificatif</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Glissez-déposez ou cliquez pour uploader</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF jusqu'à 10MB</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowNewExpense(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
