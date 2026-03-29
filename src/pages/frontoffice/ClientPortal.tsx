import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  CreditCard,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  LogOut,
  User,
  Bell
} from 'lucide-react';

const invoices = [
  {
    id: 'INV-2024-001',
    date: '15 Jan 2024',
    dueDate: '30 Jan 2024',
    amount: 2500,
    status: 'paid',
    description: 'Services de consulting - Janvier'
  },
  {
    id: 'INV-2024-002',
    date: '01 Fév 2024',
    dueDate: '15 Fév 2024',
    amount: 3200,
    status: 'pending',
    description: 'Développement web - Phase 1'
  },
  {
    id: 'INV-2024-003',
    date: '15 Fév 2024',
    dueDate: '01 Mar 2024',
    amount: 1800,
    status: 'overdue',
    description: 'Maintenance mensuelle'
  },
  {
    id: 'INV-2024-004',
    date: '01 Mar 2024',
    dueDate: '15 Mar 2024',
    amount: 4500,
    status: 'pending',
    description: 'Développement web - Phase 2'
  }
];

const statusConfig = {
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function ClientPortal() {
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">NovaEntra</span>
              <span className="text-sm text-gray-500 ml-2">| Portail Client</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AC</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Acme Corporation</p>
                  <p className="text-xs text-gray-500">contact@acme.tn</p>
                </div>
              </div>
              <Link to="/" className="text-gray-400 hover:text-gray-500">
                <LogOut className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue, Acme Corporation</h1>
          <p className="text-gray-600">Consultez et payez vos factures en toute simplicité.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Factures</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant en attente</p>
                <p className="text-2xl font-bold text-gray-900">{totalOutstanding.toLocaleString()} TND</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Factures payées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter(i => i.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vos factures</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">N° Facture</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Échéance</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Montant</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Statut</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.dueDate}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        {invoice.amount.toLocaleString()} TND
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {invoice.status !== 'paid' && (
                            <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                              Payer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              return (
                <div key={invoice.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.id}</p>
                      <p className="text-sm text-gray-500">{invoice.description}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span>{invoice.date}</span>
                      <span className="mx-2">•</span>
                      <span>Éch. {invoice.dueDate}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{invoice.amount.toLocaleString()} TND</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                      Voir
                    </button>
                    {invoice.status !== 'paid' && (
                      <button className="flex-1 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        Payer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modes de paiement acceptés</h2>
          <div className="flex flex-wrap gap-4">
            {['Carte bancaire', 'Virement bancaire', 'D17', 'Espèces'].map((method) => (
              <div key={method} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{method}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-indigo-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide ?</h2>
          <p className="text-gray-600 mb-4">
            Pour toute question concernant vos factures, n'hésitez pas à nous contacter.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:support@novaentra.tn" className="text-indigo-600 hover:text-indigo-700 font-medium">
              support@novaentra.tn
            </a>
            <span className="text-gray-300">|</span>
            <a href="tel:+21671234567" className="text-indigo-600 hover:text-indigo-700 font-medium">
              +216 71 234 567
            </a>
          </div>
        </div>
      </main>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Facture {selectedInvoice.id}</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date de facturation</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date d'échéance</p>
                  <p className="font-medium text-gray-900">{selectedInvoice.dueDate}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-sm text-gray-500">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-gray-900">{selectedInvoice.description}</td>
                      <td className="py-2 text-right text-gray-900">{selectedInvoice.amount.toLocaleString()} TND</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-gray-200">
                    <tr>
                      <td className="pt-4 font-semibold text-gray-900">Total TTC</td>
                      <td className="pt-4 text-right font-bold text-xl text-gray-900">
                        {selectedInvoice.amount.toLocaleString()} TND
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download className="h-5 w-5" />
                  Télécharger PDF
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                    <CreditCard className="h-5 w-5" />
                    Payer maintenant
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
