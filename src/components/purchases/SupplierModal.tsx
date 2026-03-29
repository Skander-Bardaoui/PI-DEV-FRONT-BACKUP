// src/components/purchases/SupplierModal.tsx — avec Zod + React Hook Form
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { supplierSchema, SupplierFormValues } from '@/schemas/purchases.schemas';
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';
import { Supplier } from '@/types';
import { useTranslation } from 'react-i18next';

// ── Composant champ avec erreur ───────────────────────────────────────────────
const Field = ({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const inputCls = (error?: string) =>
  `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;

interface Props {
  businessId: string;
  supplier:   Supplier | null;
  onClose:    () => void;
}

export default function SupplierModal({ businessId, supplier, onClose }: Props) {
  const { t } = useTranslation();
  const isEdit = !!supplier;
  const create = useCreateSupplier(businessId);
  const update = useUpdateSupplier(businessId, supplier?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name:             '',
      matricule_fiscal: '',
      email:            '',
      phone:            '',
      rib:              '',
      bank_name:        '',
      payment_terms:    30,
      category:         '',
      notes:            '',
      address: { street: '', city: '', postal_code: '', country: 'Tunisie' },
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name:             supplier.name,
        matricule_fiscal: supplier.matricule_fiscal ?? '',
        email:            supplier.email ?? '',
        phone:            supplier.phone ?? '',
        rib:              supplier.rib ?? '',
        bank_name:        supplier.bank_name ?? '',
        payment_terms:    supplier.payment_terms,
        category:         supplier.category ?? '',
        notes:            supplier.notes ?? '',
        address: {
          street:      supplier.address?.street      ?? '',
          city:        supplier.address?.city        ?? '',
          postal_code: supplier.address?.postal_code ?? '',
          country:     supplier.address?.country     ?? 'Tunisie',
        },
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (values: SupplierFormValues) => {
    // Nettoyer les champs vides
    const dto = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
    );
    if (isEdit) await update.mutateAsync(dto as any);
    else        await create.mutateAsync(dto as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? t('suppliers.edit', { defaultValue: 'Modifier le fournisseur' }) : t('suppliers.new')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>

          <Field label={t('suppliers.name')} error={errors.name?.message} required>
            <input {...register('name')} className={inputCls(errors.name?.message)}
              placeholder="Société Exemple SARL" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('suppliers.taxId')} error={errors.matricule_fiscal?.message}>
              <input {...register('matricule_fiscal')} className={inputCls(errors.matricule_fiscal?.message)}
                placeholder="1234567/A/B/C/000" style={{ fontFamily: 'monospace' }} />
            </Field>
            <Field label={t('suppliers.category')} error={errors.category?.message}>
              <input {...register('category')} className={inputCls(errors.category?.message)}
                placeholder={t('suppliers.categoryPlaceholder', { defaultValue: 'Matières premières, IT...' })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('suppliers.email')} error={errors.email?.message}>
              <input {...register('email')} type="email" className={inputCls(errors.email?.message)}
                placeholder="contact@fournisseur.tn" />
            </Field>
            <Field label={t('suppliers.phone')} error={errors.phone?.message}>
              <input {...register('phone')} className={inputCls(errors.phone?.message)}
                placeholder="+216 71 000 000" />
            </Field>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.address')}</label>
            <input {...register('address.street')} className={`${inputCls()} mb-2`} placeholder={t('suppliers.street', { defaultValue: 'Rue' })} />
            <div className="grid grid-cols-3 gap-2">
              <input {...register('address.city')}        className={inputCls()} placeholder={t('suppliers.city', { defaultValue: 'Ville' })} />
              <input {...register('address.postal_code')} className={inputCls()} placeholder={t('suppliers.postalCode', { defaultValue: 'Code postal' })} />
              <input {...register('address.country')}     className={inputCls()} placeholder={t('suppliers.country', { defaultValue: 'Pays' })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('suppliers.rib')} error={errors.rib?.message}>
              <input {...register('rib')} className={inputCls(errors.rib?.message)}
                placeholder="07 123 0123456789 12" style={{ fontFamily: 'monospace' }} />
            </Field>
            <Field label={t('suppliers.bank')} error={errors.bank_name?.message}>
              <input {...register('bank_name')} className={inputCls(errors.bank_name?.message)}
                placeholder="STB, BNA, BIAT..." />
            </Field>
          </div>

          <Field label={t('suppliers.paymentTerms')} error={errors.payment_terms?.message} required>
            <input {...register('payment_terms')} type="number" min={0} max={365}
              className={inputCls(errors.payment_terms?.message)} />
          </Field>

          <Field label={t('suppliers.notes')} error={errors.notes?.message}>
            <textarea {...register('notes')} rows={3}
              className={inputCls(errors.notes?.message)}
              placeholder={t('suppliers.notesPlaceholder', { defaultValue: 'Informations complémentaires...' })} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {isSubmitting ? t('common.saving', { defaultValue: 'Enregistrement...' }) : isEdit ? t('common.edit') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}