// src/pages/backoffice/Team.tsx
import { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Mail,
  Shield,
  UserPlus,
  X,
  Check,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import {
  getBusinessMembers,
  getBusinessInvitations,
  sendInvitation,
  cancelInvitation,
  removeMember,
  updateMemberRole,
  type BusinessMember,
  type Invitation,
} from '../../api/invitations.api';
import { getMyBusinesses } from '../../api/business.api';

const roles = [
  {
    value: 'BUSINESS_ADMIN',
    label: 'BUSINESS_ADMIN',
    description: 'Accès complet sauf suppression entreprise',
  },
  {
    value: 'ACCOUNTANT',
    label: 'ACCOUNTANT',
    description: 'Gestion financière, factures, dépenses',
  },
  {
    value: 'TEAM_MEMBER',
    label: 'TEAM_MEMBER',
    description: 'Accès limité selon permissions',
  },
];

const roleColors: Record<string, string> = {
  BUSINESS_OWNER: 'bg-purple-100 text-purple-700',
  BUSINESS_ADMIN: 'bg-blue-100 text-blue-700',
  ACCOUNTANT: 'bg-green-100 text-green-700',
  TEAM_MEMBER: 'bg-gray-100 text-gray-700',
};

const roleLabels: Record<string, string> = {
  BUSINESS_OWNER: 'Propriétaire',
  BUSINESS_ADMIN: 'Administrateur',
  ACCOUNTANT: 'Comptable',
  TEAM_MEMBER: 'Membre',
};

export default function Team() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BusinessMember | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Data
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('TEAM_MEMBER');
  const [editRole, setEditRole] = useState('');

  // Load businesses on mount
  useEffect(() => {
    loadBusinesses();
  }, []);

  // Load members and invitations when business is selected
  useEffect(() => {
    if (selectedBusinessId) {
      loadMembersAndInvitations();
    }
  }, [selectedBusinessId]);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await getMyBusinesses();
      setBusinesses(data);
      if (data.length > 0) {
        setSelectedBusinessId(data[0].id);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des entreprises');
      console.error('Error loading businesses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembersAndInvitations = async () => {
    if (!selectedBusinessId) return;

    try {
      setIsLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        getBusinessMembers(selectedBusinessId),
        getBusinessInvitations(selectedBusinessId),
      ]);
      setMembers(membersData);
      // Filter to only show pending invitations
      setInvitations(invitationsData.filter(inv => inv.status === 'pending'));
    } catch (error: any) {
      toast.error('Erreur lors du chargement des membres');
      console.error('Error loading members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    if (!selectedBusinessId) {
      toast.error('Veuillez sélectionner une entreprise');
      return;
    }

    try {
      setIsSending(true);
      await sendInvitation(selectedBusinessId, inviteEmail, inviteRole);
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('TEAM_MEMBER');
      await loadMembersAndInvitations();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation';
      toast.error(errorMsg);
      console.error('Error sending invitation:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!selectedBusinessId) return;

    try {
      await cancelInvitation(selectedBusinessId, invitationId);
      toast.success('Invitation annulée');
      await loadMembersAndInvitations();
    } catch (error: any) {
      toast.error('Erreur lors de l\'annulation de l\'invitation');
      console.error('Error cancelling invitation:', error);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!selectedBusinessId) return;

    if (!confirm(`Êtes-vous sûr de vouloir retirer ${userName} de l'équipe ?`)) {
      return;
    }

    try {
      await removeMember(selectedBusinessId, userId);
      toast.success(`${userName} a été retiré de l'équipe`);
      await loadMembersAndInvitations();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression du membre');
      console.error('Error removing member:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !selectedBusinessId) return;

    try {
      setIsUpdating(true);
      await updateMemberRole(selectedBusinessId, selectedMember.user_id, editRole);
      toast.success('Rôle mis à jour avec succès');
      setSelectedMember(null);
      await loadMembersAndInvitations();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du rôle');
      console.error('Error updating role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (member: BusinessMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
  };

  const filteredMembers = members.filter(
    (member) => {
      // Exclude current user from the list
      if (member.user_id === user?.id) {
        return false;
      }
      
      // Apply search filter
      return (
        member.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

  const activeMembers = members.filter((m) => m.is_active && m.user_id !== user?.id).length;
  const pendingInvites = invitations.filter((i) => i.status === 'pending').length;

  // Check if user can manage team (OWNER or ADMIN)
  const canManageTeam =
    user?.role === 'BUSINESS_OWNER' || user?.role === 'BUSINESS_ADMIN';

  if (isLoading && businesses.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune entreprise
        </h2>
        <p className="text-gray-500">
          Vous devez d'abord créer une entreprise pour gérer une équipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipe</h1>
          <p className="text-gray-500">
            Gérez les membres de votre équipe et leurs permissions
          </p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            Inviter un membre
          </button>
        )}
      </div>

      {/* Business Selector */}
      {businesses.length > 1 && user?.role === 'BUSINESS_OWNER' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entreprise
          </label>
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total membres</p>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Membres actifs</p>
          <p className="text-2xl font-bold text-green-600">{activeMembers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Invitations en attente</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingInvites}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un membre..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Membre
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Rôle
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Poste
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Date d'ajout
                </th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">
                  Statut
                </th>
                {canManageTeam && (
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => {
                const fullName = `${member.user.firstName} ${member.user.lastName}`;
                const initials = `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase();

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                          {member.user.avatarUrl ? (
                            <img
                              src={`http://localhost:3001${member.user.avatarUrl}`}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium text-sm">
                              {initials}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{fullName}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          roleColors[member.role] || roleColors.TEAM_MEMBER
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {member.user.jobTitle || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          member.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {member.is_active ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Actif
                          </>
                        ) : (
                          <>Inactif</>
                        )}
                      </span>
                    </td>
                    {canManageTeam && member.role !== 'BUSINESS_OWNER' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier le rôle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleRemoveMember(member.user_id, fullName)
                            }
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Retirer du groupe"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invitations en attente
          </h2>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      {invitation.role} • Expire le{' '}
                      {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {canManageTeam && (
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Rôles et permissions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.value} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-gray-900">{role.label}</span>
              </div>
              <p className="text-sm text-gray-500">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Inviter un membre
              </h2>
              <button
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="email@exemple.com"
                  disabled={isSending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={isSending}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                  Un email d'invitation sera envoyé à l'adresse indiquée. Le membre
                  devra créer un compte ou se connecter pour rejoindre l'équipe.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowInvite(false)}
                disabled={isSending}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={isSending}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    Envoyer l'invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Modifier le membre
              </h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {selectedMember.user.avatarUrl ? (
                    <img
                      src={`http://localhost:3001${selectedMember.user.avatarUrl}`}
                      alt={`${selectedMember.user.firstName} ${selectedMember.user.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xl font-medium">
                      {`${selectedMember.user.firstName[0]}${selectedMember.user.lastName[0]}`.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedMember.user.firstName} {selectedMember.user.lastName}
                  </p>
                  <p className="text-gray-500">{selectedMember.user.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={isUpdating}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedMember(null)}
                disabled={isUpdating}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isUpdating}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
