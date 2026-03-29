// src/components/purchases/SupplierInviteModal.tsx
import { useState } from 'react';
import { X, Mail, User, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteSupplier } from '@/api/suppliers';
import { useTranslation } from 'react-i18next';

interface Props {
  businessId: string;
  onClose: () => void;
}

export default function SupplierInviteModal({ businessId, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => inviteSupplier(businessId, { email, name: name || undefined }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['suppliers', businessId] });
      setTimeout(() => onClose(), 2500);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('L\'email est obligatoire');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      return;
    }

    mutation.mutate();
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Invitation envoyée !</h3>
          <p className="text-gray-600 text-sm mb-4">
            Un email d'invitation a été envoyé à <strong>{email}</strong>
          </p>
          <p className="text-xs text-gray-500">
            Le fournisseur recevra un lien pour compléter sa fiche. Vous serez notifié par email une fois qu'il aura terminé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Inviter un fournisseur</h2>
            <p className="text-sm text-gray-500 mt-1">Envoyez une invitation par email</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-900">
                <p className="font-medium mb-1">Comment ça marche ?</p>
                <ul className="space-y-1 text-indigo-700 text-xs">
                  <li>• Le fournisseur reçoit un email avec un lien sécurisé</li>
                  <li>• Il remplit sa fiche en quelques minutes</li>
                  <li>• Vous recevez une notification automatique</li>
                  <li>• Le fournisseur est ajouté à votre liste</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email du fournisseur *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fournisseur@exemple.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={mutation.isPending}
              />
            </div>
          </div>

          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du fournisseur (optionnel)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de l'entreprise"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={mutation.isPending}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Le nom sera pré-rempli dans le formulaire d'inscription
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer l'invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
