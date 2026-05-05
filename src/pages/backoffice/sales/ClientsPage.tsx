// src/pages/backoffice/sales/ClientsPage.tsx
import { useState, useMemo } from 'react';
import { Plus, Search, Mail, Phone, MapPin, Edit, Trash2, UserPlus, Users, UserCheck, TrendingUp, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import { useCurrentBusinessMember } from '@/hooks/useCurrentBusinessMember';
import ClientInvitationModal from '@/components/sales/ClientInvitationModal';
import ClientFormModal from '@/components/sales/ClientFormModal';

export default function ClientsPage() {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';
  const { businessMember: currentMember } = useCurrentBusinessMember();

  // Permission checks
  const currentUserRole = (user as any)?.role;
  const isOwner = currentUserRole === 'BUSINESS_OWNER';
  const sales = currentMember?.sales_permissions;
  
  const canCreateClient = isOwner || sales?.create_client === true;
  const canUpdateClient = isOwner || sales?.update_client === true;
  const canDeleteClient = isOwner || sales?.delete_client === true;
  const canInviteClient = isOwner || sales?.invite_client === true;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [filterPortalAccess, setFilterPortalAccess] = useState<'all' | 'with' | 'without'>('all');

  const { data, isLoading } = useClients(businessId, { page, limit: 20, search });
  const deleteClient = useDeleteClient(businessId);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.clients) return { total: 0, withPortal: 0, withoutPortal: 0 };
    return {
      total: data.total || 0,
      withPortal: data.clients.filter(c => c.has_portal_access).length,
      withoutPortal: data.clients.filter(c => !c.has_portal_access).length,
    };
  }, [data]);

  // Filter clients based on portal access
  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    if (filterPortalAccess === 'all') return data.clients;
    if (filterPortalAccess === 'with') return data.clients.filter(c => c.has_portal_access);
    return data.clients.filter(c => !c.has_portal_access);
  }, [data?.clients, filterPortalAccess]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${name || 'ce client'}" ?`)) {
      await deleteClient.mutateAsync(id);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Gérez vos clients et envoyez des invitations</p>
        </div>
        <div className="flex gap-3">
          {canCreateClient && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Ajouter manuellement
            </button>
          )}
          {canInviteClient && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <UserPlus className="h-5 w-5" />
              Inviter un client
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Clients</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Avec Accès Portail</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.withPortal}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg border border-purple-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Sans Accès Portail</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats.withoutPortal}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-7 w-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client par nom, email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterPortalAccess}
              onChange={(e) => setFilterPortalAccess(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">Tous les clients</option>
              <option value="with">Avec accès portail</option>
              <option value="without">Sans accès portail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !filteredClients?.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun client trouvé</h3>
          <p className="text-gray-600 mb-6">Commencez par inviter ou ajouter votre premier client</p>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Inviter votre premier client
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200"
              >
                {/* Client Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                      {client.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{client.name || 'Sans nom'}</h3>
                      {client.has_portal_access ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded mt-1">
                          <UserCheck className="h-3 w-3" />
                          Accès portail
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded mt-1">
                          Sans accès
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="space-y-2.5 mb-4">
                  {client.email && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
                  {client.payment_terms && (
                    <div className="bg-gray-50 rounded-md p-2.5 mt-3">
                      <p className="text-xs text-gray-500 mb-0.5">Conditions de paiement</p>
                      <p className="text-sm font-medium text-gray-900">{client.payment_terms}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  {canUpdateClient && (
                    <button
                      onClick={() => handleEdit(client)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </button>
                  )}
                  {canDeleteClient && (
                    <button
                      onClick={() => handleDelete(client.id, client.name)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > 20 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {filteredClients.length} sur {data.total} clients
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Précédent
                </button>
                <div className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm">
                  Page {page}
                </div>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= data.total}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invitation Modal */}
      {inviteModalOpen && (
        <ClientInvitationModal
          businessId={businessId}
          onClose={() => setInviteModalOpen(false)}
        />
      )}

      {/* Create/Edit Modal */}
      {createModalOpen && (
        <ClientFormModal
          businessId={businessId}
          client={editingClient}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
