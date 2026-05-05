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
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
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
    try {
      // Prepare the DTO with proper data structure
      const dto: any = {
        name: values.name,
        matricule_fiscal: values.matricule_fiscal,
        email: values.email,
        phone: values.phone,
        rib: values.rib,
        bank_name: values.bank_name,
        payment_terms: values.payment_terms,
        category: values.category,
      };

      // Only add notes if not empty
      if (values.notes && values.notes.trim()) {
        dto.notes = values.notes;
      }

      // Only add address if all required fields are present
      if (values.address && 
          values.address.street && 
          values.address.city && 
          values.address.postal_code && 
          values.address.country) {
        dto.address = {
          street: values.address.street,
          city: values.address.city,
          postal_code: values.address.postal_code,
          country: values.address.country,
        };
      }

      if (isEdit) await update.mutateAsync(dto);
      else        await create.mutateAsync(dto);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Déclencher la validation de tous les champs
    const isValid = await trigger();
    if (!isValid) {
      // Scroll vers la première erreur
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else {
      handleSubmit(onSubmit)();
    }
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

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4" noValidate>

          {/* Message d'erreur global */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Erreurs de validation
                  </h3>
                  <p className="text-sm text-red-700">
                    Veuillez corriger les erreurs ci-dessous avant de continuer.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Field label={t('suppliers.name')} error={errors.name?.message} required>
            <input {...register('name')} className={inputCls(errors.name?.message)}
              placeholder="Société Exemple SARL" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('suppliers.taxId')} error={errors.matricule_fiscal?.message} required>
              <input {...register('matricule_fiscal')} className={inputCls(errors.matricule_fiscal?.message)}
                placeholder="1234567/A/B/C/000" style={{ fontFamily: 'monospace' }} />
            </Field>
            <Field label={t('suppliers.category')} error={errors.category?.message} required>
              <input {...register('category')} className={inputCls(errors.category?.message)}
                placeholder={t('suppliers.categoryPlaceholder', { defaultValue: 'Matières premières, IT...' })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('suppliers.email')} error={errors.email?.message} required>
              <input {...register('email')} type="email" className={inputCls(errors.email?.message)}
                placeholder="contact@fournisseur.tn" />
            </Field>
            <Field label={t('suppliers.phone')} error={errors.phone?.message} required>
              <input {...register('phone')} className={inputCls(errors.phone?.message)}
                placeholder="+216 71 000 000" />
            </Field>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('suppliers.address')} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <div>
                <input {...register('address.street')} className={inputCls(errors.address?.street?.message)} placeholder={t('suppliers.street', { defaultValue: 'Rue' })} />
                {errors.address?.street && (
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-600 text-xs font-medium">{errors.address.street.message}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input {...register('address.city')} className={inputCls(errors.address?.city?.message)} placeholder={t('suppliers.city', { defaultValue: 'Ville' })} />
                  {errors.address?.city && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-600 text-xs font-medium">{errors.address.city.message}</p>
                    </div>
                  )}
                </div>
                <div>
                  <input {...register('address.postal_code')} className={inputCls(errors.address?.postal_code?.message)} placeholder={t('suppliers.postalCode', { defaultValue: 'Code postal' })} />
                  {errors.address?.postal_code && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-600 text-xs font-medium">{errors.address.postal_code.message}</p>
                    </div>
                  )}
                </div>
                <div>
                  <input {...register('address.country')} className={inputCls(errors.address?.country?.message)} placeholder={t('suppliers.country', { defaultValue: 'Pays' })} />
                  {errors.address?.country && (
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-600 text-xs font-medium">{errors.address.country.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('suppliers.rib')} error={errors.rib?.message} required>
              <input {...register('rib')} className={inputCls(errors.rib?.message)}
                placeholder="07 123 0123456789 12" style={{ fontFamily: 'monospace' }} />
            </Field>
            <Field label={t('suppliers.bank')} error={errors.bank_name?.message} required>
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