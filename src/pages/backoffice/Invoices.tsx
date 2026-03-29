import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';

const invoices = [
  { id: 'INV-2024-001', client: 'Tech Solutions SARL', clientEmail: 'contact@techsolutions.tn', date: '15 Jan 2024', dueDate: '30 Jan 2024', amount: 3500, status: 'paid' },
  { id: 'INV-2024-002', client: 'Digital Agency Tunisia', clientEmail: 'info@digitalagency.tn', date: '14 Jan 2024', dueDate: '28 Jan 2024', amount: 2800, status: 'pending' },
  { id: 'INV-2024-003', client: 'StartUp Innovation', clientEmail: 'hello@startup.tn', date: '13 Jan 2024', dueDate: '27 Jan 2024', amount: 5200, status: 'pending' },
  { id: 'INV-2024-004', client: 'Consulting Pro', clientEmail: 'contact@consultingpro.tn', date: '10 Jan 2024', dueDate: '25 Jan 2024', amount: 1900, status: 'overdue' },
  { id: 'INV-2024-005', client: 'Media Group Tunisia', clientEmail: 'admin@mediagroup.tn', date: '09 Jan 2024', dueDate: '24 Jan 2024', amount: 4100, status: 'paid' },
  { id: 'INV-2024-006', client: 'E-Commerce Plus', clientEmail: 'support@ecomplus.tn', date: '08 Jan 2024', dueDate: '23 Jan 2024', amount: 6800, status: 'paid' },
  { id: 'INV-2024-007', client: 'Finance Expert', clientEmail: 'info@finexpert.tn', date: '05 Jan 2024', dueDate: '20 Jan 2024', amount: 2300, status: 'overdue' },
  { id: 'INV-2024-008', client: 'Health Solutions', clientEmail: 'contact@healthsol.tn', date: '03 Jan 2024', dueDate: '18 Jan 2024', amount: 3900, status: 'paid' },
];

const statusConfig = {
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-500">Gérez vos factures et suivez les paiements</p>
        </div>
        <button
          onClick={() => setShowNewInvoice(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle facture
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalAmount.toLocaleString()} TND</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Payé</p>
          <p className="text-2xl font-bold text-green-600">{paidAmount.toLocaleString()} TND</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingAmount.toLocaleString()} TND</p>
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
              placeholder="Rechercher par client ou numéro..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payées</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
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
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">N° Facture</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Échéance</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Montant</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => {
                const status = statusConfig[invoice.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{invoice.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.client}</p>
                        <p className="text-sm text-gray-500">{invoice.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                    <td className="px-6 py-4 text-gray-600">{invoice.dueDate}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {invoice.amount.toLocaleString()} TND
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Modifier">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Envoyer">
                          <Send className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage de {filteredInvoices.length} factures
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
              Précédent
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle facture</h2>
              <button onClick={() => setShowNewInvoice(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>Sélectionner un client</option>
                    <option>Tech Solutions SARL</option>
                    <option>Digital Agency Tunisia</option>
                    <option>StartUp Innovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
                  <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lignes de facture</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Description</th>
                        <th className="text-center px-4 py-2 text-sm font-medium text-gray-500 w-20">Qté</th>
                        <th className="text-right px-4 py-2 text-sm font-medium text-gray-500 w-32">Prix unit.</th>
                        <th className="text-right px-4 py-2 text-sm font-medium text-gray-500 w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2">
                          <input type="text" placeholder="Description du service" className="w-full px-2 py-1 border border-gray-200 rounded" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" defaultValue={1} className="w-full px-2 py-1 border border-gray-200 rounded text-center" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" placeholder="0" className="w-full px-2 py-1 border border-gray-200 rounded text-right" />
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">0 TND</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  + Ajouter une ligne
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">0 TND</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">TVA (19%)</span>
                  <span className="font-medium">0 TND</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total TTC</span>
                  <span>0 TND</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes ou conditions particulières..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowNewInvoice(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                Créer la facture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Facture {selectedInvoice.id}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedInvoice.client}</h3>
                  <p className="text-sm text-gray-500">{selectedInvoice.clientEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date: {selectedInvoice.date}</p>
                  <p className="text-sm text-gray-500">Échéance: {selectedInvoice.dueDate}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total TTC</span>
                  <span>{selectedInvoice.amount.toLocaleString()} TND</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download className="h-5 w-5" />
                  Télécharger PDF
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                  <Send className="h-5 w-5" />
                  Envoyer par email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
