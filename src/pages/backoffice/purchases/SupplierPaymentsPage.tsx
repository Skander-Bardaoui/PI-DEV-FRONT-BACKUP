// src/pages/backoffice/purchases/SupplierPaymentsPage.tsx
import { useState } from 'react';
import { Plus, CreditCard, ChevronUp, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth }       from '../../../hooks/useAuth';
import { useSuppliers }  from '@/hooks/useSuppliers';
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import axiosInstance     from '@/api/axiosInstance';
import { formatAmount, formatDate, InvoiceStatus } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────
export enum PaymentMethod {
  VIREMENT = 'VIREMENT',
  CHEQUE   = 'CHEQUE',
  ESPECES  = 'ESPECES',
  TRAITE   = 'TRAITE',
  CARTE    = 'CARTE',
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  VIREMENT: 'Virement bancaire',
  CHEQUE:   'Chèque',
  ESPECES:  'Espèces',
  TRAITE:   'Traite',
  CARTE:    'Carte bancaire',
};

const METHOD_COLORS: Record<PaymentMethod, string> = {
  VIREMENT: 'bg-blue-100 text-blue-800',
  CHEQUE:   'bg-purple-100 text-purple-800',
  ESPECES:  'bg-green-100 text-green-800',
  TRAITE:   'bg-orange-100 text-orange-800',
  CARTE:    'bg-indigo-100 text-indigo-800',
};

// ─── Schéma Zod ──────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  supplier_id:          z.string().uuid('Fournisseur requis'),
  purchase_invoice_id:  z.string().uuid().optional().or(z.literal('')),
  payment_date:         z.string().min(1, 'Date requise'),
  amount:               z.coerce.number().min(0.001, 'Montant > 0'),
  payment_method:       z.nativeEnum(PaymentMethod),
  reference:            z.string().optional(),
  bank_name:            z.string().optional(),
  notes:                z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// ─── API ─────────────────────────────────────────────────────────────────────
const paymentsApi = {
  findAll: (businessId: string, params?: any) =>
    axiosInstance.get(`/businesses/${businessId}/supplier-payments`, { params }).then(r => r.data),
  create: (businessId: string, dto: any) =>
    axiosInstance.post(`/businesses/${businessId}/supplier-payments`, dto).then(r => r.data),
};

// ─── Modal création paiement ─────────────────────────────────────────────────
function CreatePaymentModal({
  businessId, onClose,
}: { businessId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: suppliersData } = useSuppliers(businessId, { is_active: true, limit: 100 });

  const [selectedSupplier, setSelectedSupplier] = useState('');

  const { data: invoicesData } = usePurchaseInvoices(
    businessId,
    { supplier_id: selectedSupplier || undefined, limit: 100 },
    { enabled: !!selectedSupplier },
  );

  const payableInvoices = invoicesData?.data?.filter(i =>
    [InvoiceStatus.APPROVED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE].includes(i.status),
  ) ?? [];

  const create = useMutation({
    mutationFn: (dto: any) => paymentsApi.create(businessId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-payments', businessId] });
      qc.invalidateQueries({ queryKey: ['purchase-invoices', businessId] });
      onClose();
    },
  });

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date:   new Date().toISOString().split('T')[0],
      payment_method: PaymentMethod.VIREMENT,
      amount:         0,
    },
  });

  const selectedInvoiceId = watch('purchase_invoice_id');
  const selectedInvoice = payableInvoices.find(i => i.id === selectedInvoiceId);

  const handleInvoiceChange = (invoiceId: string) => {
    setValue('purchase_invoice_id', invoiceId);
    const inv = payableInvoices.find(i => i.id === invoiceId);
    if (inv) {
      const remaining = Math.round((Number(inv.net_amount) - Number(inv.paid_amount)) * 1000) / 1000;
      setValue('amount', remaining);
    }
  };

  const onSubmit = async (values: PaymentFormValues) => {
    await create.mutateAsync({
      ...values,
      purchase_invoice_id: values.purchase_invoice_id || undefined,
    });
  };

  const inputCls = (err?: string) =>
    `w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Enregistrer un paiement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>

          {/* Fournisseur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fournisseur <span className="text-red-500">*</span>
            </label>
            <select
              {...register('supplier_id')}
              onChange={e => { setValue('supplier_id', e.target.value); setSelectedSupplier(e.target.value); }}
              className={inputCls(errors.supplier_id?.message)}
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliersData?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.supplier_id && <p className="text-red-500 text-xs mt-1">{errors.supplier_id.message}</p>}
          </div>

          {/* Facture liée (optionnel) */}
          {selectedSupplier && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facture associée <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
              </label>
              <select
                value={selectedInvoiceId}
                onChange={e => handleInvoiceChange(e.target.value)}
                className={inputCls()}
              >
                <option value="">Paiement sans facture</option>
                {payableInvoices.map(inv => {
                  const rem = Math.round((Number(inv.net_amount) - Number(inv.paid_amount)) * 1000) / 1000;
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number_supplier} — Reste : {rem.toFixed(3)} TND
                    </option>
                  );
                })}
              </select>
              {selectedInvoice && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800">
                  Net TTC : {formatAmount(selectedInvoice.net_amount)} —
                  Déjà payé : {formatAmount(selectedInvoice.paid_amount)} —
                  Reste : {formatAmount(Math.round((Number(selectedInvoice.net_amount) - Number(selectedInvoice.paid_amount)) * 1000) / 1000)}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register('payment_date')} className={inputCls(errors.payment_date?.message)} />
              {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (TND) <span className="text-red-500">*</span>
              </label>
              <input type="number" step="0.001" min="0.001"
                {...register('amount', { valueAsNumber: true })}
                className={inputCls(errors.amount?.message) + ' text-right font-mono'} />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PaymentMethod).map(m => (
                <label key={m} className="cursor-pointer">
                  <input type="radio" value={m} {...register('payment_method')} className="sr-only" />
                  <div className={`px-3 py-2 text-center text-xs border rounded-lg transition-colors ${
                    watch('payment_method') === m
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}>
                    {METHOD_LABELS[m]}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Référence + Banque */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
              <input {...register('reference')} placeholder="N° virement, chèque..."
                className={inputCls()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banque</label>
              <input {...register('bank_name')} placeholder="STB, BNA..."
                className={inputCls()} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} {...register('notes')}
              className={inputCls() + ' resize-none'}
              placeholder="Observations..." />
          </div>

          {create.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {(create.error as any)?.response?.data?.message ?? 'Erreur lors de l\'enregistrement'}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting || create.isPending}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium">
              {create.isPending ? 'Enregistrement...' : 'Valider le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function SupplierPaymentsPage() {
  const { user }   = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  const [createOpen,      setCreateOpen]      = useState(false);
  const [supplierFilter,  setSupplierFilter]  = useState('');
  const [methodFilter,    setMethodFilter]    = useState('');
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');
  const [page,            setPage]            = useState(1);

  const { data: suppliersData } = useSuppliers(businessId, { is_active: true, limit: 100 });

  const { data, isLoading } = useQuery({
    queryKey: ['supplier-payments', businessId, { supplierFilter, methodFilter, dateFrom, dateTo, page }],
    queryFn:  () => paymentsApi.findAll(businessId, {
      supplier_id:    supplierFilter || undefined,
      payment_method: methodFilter   || undefined,
      date_from:      dateFrom       || undefined,
      date_to:        dateTo         || undefined,
      page, limit: 20,
    }),
    enabled: !!businessId,
  });

  // ✅ Fix : data?.data peut être undefined pendant le chargement
  const totalAmount = data?.data?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements Fournisseurs</h1>
          <p className="text-gray-500 text-sm">{data?.total ?? 0} règlement(s)</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" /> Enregistrer un paiement
        </button>
      </div>

      {/* KPI total */}
      {data && (data.total ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total payé (page)</p>
            <p className="text-xl font-bold text-green-600">{formatAmount(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Nombre de règlements</p>
            <p className="text-xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Moyenne par règlement</p>
            <p className="text-xl font-bold text-gray-900">
              {/* ✅ Fix : data.data?.length au lieu de data.data.length */}
              {(data.total ?? 0) > 0 && data.data?.length
                ? formatAmount(totalAmount / data.data.length)
                : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fournisseur</label>
            <select value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="">Tous</option>
              {suppliersData?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mode de paiement</label>
            <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="">Tous les modes</option>
              {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['N° Paiement', 'Date', 'Fournisseur', 'Facture liée', 'Montant', 'Mode', 'Référence'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-sm font-semibold text-gray-900">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* ✅ Fix principal : data?.data?.length au lieu de data?.data.length */}
                {!data?.data?.length ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-500">Aucun paiement trouvé</td></tr>
                ) : data.data.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-sm font-medium text-gray-900">{p.payment_number}</td>
                    <td className="px-4 py-4 text-gray-600 text-sm">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-4 text-gray-700 text-sm">{p.supplier?.name}</td>
                    <td className="px-4 py-4 text-gray-600 text-sm font-mono">
                      {p.purchase_invoice?.invoice_number_supplier ?? <span className="text-gray-400 italic">Sans facture</span>}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-green-700 text-sm">
                      {formatAmount(p.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${METHOD_COLORS[p.payment_method as PaymentMethod]}`}>
                        {METHOD_LABELS[p.payment_method as PaymentMethod]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-sm">{p.reference ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (data.total_pages ?? 1) > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {data.total} paiements — page {page} / {data.total_pages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">
                Précédent
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= (data.total_pages ?? 1)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <CreatePaymentModal businessId={businessId} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}