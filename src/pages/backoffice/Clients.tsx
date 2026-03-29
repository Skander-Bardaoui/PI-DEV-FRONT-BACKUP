import { useState } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  X,
  User
} from 'lucide-react';

const clients = [
  {
    id: 1,
    name: 'Tech Solutions SARL',
    contact: 'Ahmed Ben Ali',
    email: 'ahmed@techsolutions.tn',
    phone: '+216 71 234 567',
    address: 'Rue de la Liberté, Tunis',
    totalInvoices: 12,
    totalAmount: 45000,
    status: 'active'
  },
  {
    id: 2,
    name: 'Digital Agency Tunisia',
    contact: 'Salma Mansouri',
    email: 'salma@digitalagency.tn',
    phone: '+216 71 345 678',
    address: 'Avenue Habib Bourguiba, Sousse',
    totalInvoices: 8,
    totalAmount: 28500,
    status: 'active'
  },
  {
    id: 3,
    name: 'StartUp Innovation',
    contact: 'Mohamed Trabelsi',
    email: 'mohamed@startup.tn',
    phone: '+216 71 456 789',
    address: 'Zone Industrielle, Sfax',
    totalInvoices: 5,
    totalAmount: 18200,
    status: 'active'
  },
  {
    id: 4,
    name: 'Consulting Pro',
    contact: 'Fatma Khelifi',
    email: 'fatma@consultingpro.tn',
    phone: '+216 71 567 890',
    address: 'Centre Urbain Nord, Tunis',
    totalInvoices: 3,
    totalAmount: 9800,
    status: 'inactive'
  },
  {
    id: 5,
    name: 'Media Group Tunisia',
    contact: 'Karim Bouazizi',
    email: 'karim@mediagroup.tn',
    phone: '+216 71 678 901',
    address: 'Lac 1, Tunis',
    totalInvoices: 15,
    totalAmount: 62000,
    status: 'active'
  },
  {
    id: 6,
    name: 'E-Commerce Plus',
    contact: 'Nadia Hamdi',
    email: 'nadia@ecomplus.tn',
    phone: '+216 71 789 012',
    address: 'Menzah 9, Tunis',
    totalInvoices: 7,
    totalAmount: 34500,
    status: 'active'
  },
];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Gérez votre base de données clients</p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouveau client
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total clients</p>
          <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Clients actifs</p>
          <p className="text-2xl font-bold text-green-600">{activeClients}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Chiffre d'affaires total</p>
          <p className="text-2xl font-bold text-indigo-600">{totalRevenue.toLocaleString()} TND</p>
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
              placeholder="Rechercher un client..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.contact}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {client.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {client.address}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Factures</p>
                  <p className="font-semibold text-gray-900">{client.totalInvoices}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total facturé</p>
                  <p className="font-semibold text-gray-900">{client.totalAmount.toLocaleString()} TND</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setSelectedClient(client)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Voir détails
              </button>
              <div className="flex gap-2">
                <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nouveau client</h2>
              <button onClick={() => setShowNewClient(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personne de contact</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nom complet"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Adresse complète"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Matricule fiscale</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="XXXXXXX/X/X/X/XXX"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowNewClient(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                Créer le client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedClient.name}</h2>
              <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Informations de contact</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <span>{selectedClient.contact}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">Factures</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedClient.totalInvoices}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-indigo-600">{selectedClient.totalAmount.toLocaleString()} TND</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Dernières factures</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">N° Facture</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Montant</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">INV-2024-001</td>
                        <td className="px-4 py-3 text-sm text-gray-600">15 Jan 2024</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">3,500 TND</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Payée</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">INV-2024-005</td>
                        <td className="px-4 py-3 text-sm text-gray-600">01 Jan 2024</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">2,800 TND</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Payée</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                <FileText className="h-5 w-5" />
                Nouvelle facture
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                <Mail className="h-5 w-5" />
                Envoyer un email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
