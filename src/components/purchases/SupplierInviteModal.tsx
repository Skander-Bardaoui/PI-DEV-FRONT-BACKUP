// src/components/purchases/SupplierInviteModal.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Mail, User, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteSupplier } from '@/api/suppliers';
import { supplierInviteSchema, SupplierInviteFormValues } from '@/schemas/purchases.schemas';

interface Props {
  businessId: string;
  onClose: () => void;
}

const inputCls = (error?: string) =>
  `w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;

export default function SupplierInviteModal({ businessId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplierInviteFormValues>({
    resolver: zodResolver(supplierInviteSchema),
    defaultValues: {
      email: '',
      supplier_name: '',
      message: '',
    },
  });

  const emailValue = watch('email');

  const mutation = useMutation({
    mutationFn: (data: SupplierInviteFormValues) => 
      inviteSupplier(businessId, { 
        email: data.email, 
        name: data.supplier_name || undefined,
      }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['suppliers', businessId] });
      setTimeout(() => onClose(), 2500);
    },
  });

  const onSubmit = (data: SupplierInviteFormValues) => {
    mutation.mutate(data);
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
            Un email d'invitation a été envoyé à <strong>{emailValue}</strong>
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Info box */}
          <div style={{ background: '#EEF2FF', border: '2px solid #C7D2FE', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail className="h-5 w-5" style={{ color: '#fff' }} />
              </div>
              <div className="text-sm">
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>Comment ça marche ?</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4338CA', lineHeight: 1.8 }}>
                  <li>Le fournisseur reçoit un email avec un lien sécurisé</li>
                  <li>Il remplit sa fiche en quelques minutes</li>
                  <li>Vous recevez une notification automatique</li>
                  <li>Le fournisseur est ajouté à votre liste</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email du fournisseur <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="fournisseur@exemple.com"
                className={inputCls(errors.email?.message)}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du fournisseur
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('supplier_name')}
                placeholder="Nom de l'entreprise"
                className={inputCls(errors.supplier_name?.message)}
                disabled={isSubmitting}
              />
            </div>
            {errors.supplier_name && (
              <p className="text-red-500 text-xs mt-1">{errors.supplier_name.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Le nom sera pré-rempli dans le formulaire d'inscription
            </p>
          </div>

          {/* Message field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message personnalisé (optionnel)
            </label>
            <textarea
              {...register('message')}
              placeholder="Ajoutez un message pour le fournisseur..."
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                errors.message ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Error message */}
          {mutation.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{(mutation.error as any)?.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation'}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
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