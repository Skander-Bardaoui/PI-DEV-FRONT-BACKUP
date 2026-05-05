// src/components/sales/ClientFormModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Building2, Mail, Phone, MapPin, FileText, Save, CreditCard, Landmark } from 'lucide-react';
import { clientSchema, ClientFormValues } from '@/schemas/sales.schemas';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import type { Client } from '@/api/clients';

// ── Composant champ avec erreur ───────────────────────────────────────────────
const Field = ({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-start gap-1.5 mt-1.5">
        <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-red-600 text-xs font-medium">{error}</p>
      </div>
    )}
  </div>
);

const inputCls = (error?: string) =>
  `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
    error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' : 'border-gray-300'
  }`;

const inputWithIconCls = (error?: string) =>
  `w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
    error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' : 'border-gray-300'
  }`;

interface ClientFormModalProps {
  businessId: string;
  client?: Client | null;
  onClose: () => void;
}

export default function ClientFormModal({ businessId, client, onClose }: ClientFormModalProps) {
  const isEdit = !!client;
  const create = useCreateClient(businessId);
  const update = useUpdateClient(businessId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      matricule_fiscal: '',
      email: '',
      phone: '',
      rib: '',
      bank_name: '',
      payment_terms: 30,
      category: '',
      notes: '',
      address: { street: '', city: '', postal_code: '', country: 'Tunisie' },
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name || '',
        matricule_fiscal: (client as any).matricule_fiscal || '',
        email: client.email || '',
        phone: client.phone || '',
        rib: (client as any).rib || '',
        bank_name: (client as any).bank_name || '',
        payment_terms: typeof client.payment_terms === 'string' ? 30 : (client.payment_terms as any) || 30,
        category: (client as any).category || '',
        notes: (client as any).notes || '',
        address: {
          street: (client as any).address?.street || '',
          city: (client as any).address?.city || '',
          postal_code: (client as any).address?.postal_code || '',
          country: (client as any).address?.country || 'Tunisie',
        },
      });
    }
  }, [client, reset]);

  const onSubmit = async (values: ClientFormValues) => {
    try {
      const dto = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
      );
      if (isEdit) await update.mutateAsync({ id: client!.id, dto: dto as any });
      else await create.mutateAsync(dto as any);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Modifier le client' : 'Ajouter un client'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Informations générales
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="Nom du client" error={errors.name?.message} required>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('name')}
                        className={inputWithIconCls(errors.name?.message)}
                        placeholder="Nom de l'entreprise ou du client"
                      />
                    </div>
                  </Field>
                </div>

                <Field label="Matricule fiscal" error={errors.matricule_fiscal?.message} required>
                  <input
                    {...register('matricule_fiscal')}
                    className={inputCls(errors.matricule_fiscal?.message)}
                    placeholder="1234567/A/B/C/000"
                  />
                </Field>

                <Field label="Catégorie" error={errors.category?.message}>
                  <input
                    {...register('category')}
                    className={inputCls(errors.category?.message)}
                    placeholder="Ex: Grossiste, Détaillant..."
                  />
                </Field>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" />
                Contact
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Email" error={errors.email?.message} required>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className={inputWithIconCls(errors.email?.message)}
                      placeholder="client@example.com"
                    />
                  </div>
                </Field>

                <Field label="Téléphone" error={errors.phone?.message} required>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('phone')}
                      type="tel"
                      className={inputWithIconCls(errors.phone?.message)}
                      placeholder="+216 71 000 000"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                Adresse
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="Rue" error={errors.address?.street?.message} required>
                    <input
                      {...register('address.street')}
                      className={inputCls(errors.address?.street?.message)}
                      placeholder="Numéro et nom de rue"
                    />
                  </Field>
                </div>

                <Field label="Ville" error={errors.address?.city?.message} required>
                  <input
                    {...register('address.city')}
                    className={inputCls(errors.address?.city?.message)}
                    placeholder="Tunis"
                  />
                </Field>

                <Field label="Code postal" error={errors.address?.postal_code?.message} required>
                  <input
                    {...register('address.postal_code')}
                    className={inputCls(errors.address?.postal_code?.message)}
                    placeholder="1000"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Pays" error={errors.address?.country?.message} required>
                    <input
                      {...register('address.country')}
                      className={inputCls(errors.address?.country?.message)}
                      placeholder="Tunisie"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Informations bancaires */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-indigo-600" />
                Informations bancaires
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="RIB" error={errors.rib?.message} required>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('rib')}
                      className={inputWithIconCls(errors.rib?.message)}
                      placeholder="20 chiffres minimum"
                    />
                  </div>
                </Field>

                <Field label="Nom de la banque" error={errors.bank_name?.message} required>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('bank_name')}
                      className={inputWithIconCls(errors.bank_name?.message)}
                      placeholder="Ex: BIAT, STB..."
                    />
                  </div>
                </Field>

                <Field label="Délai de paiement (jours)" error={errors.payment_terms?.message} required>
                  <input
                    {...register('payment_terms', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="365"
                    className={inputCls(errors.payment_terms?.message)}
                    placeholder="30"
                  />
                </Field>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Field label="Notes" error={errors.notes?.message}>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className={inputCls(errors.notes?.message)}
                  placeholder="Informations complémentaires..."
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || isSubmitting}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isPending || isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
