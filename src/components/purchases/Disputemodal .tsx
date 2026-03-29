// src/components/purchases/DisputeModal.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, X, FileText, DollarSign, Package, CheckCircle, Clock } from 'lucide-react';
import { z } from 'zod';
import { formatAmount, formatDate, PurchaseInvoice } from '@/types';

const schema = z.object({
  dispute_reason: z.string().min(1, 'Veuillez sélectionner un motif'),
});
type FormValues = z.infer<typeof schema>;

const DISPUTE_REASONS = [
  { value: 'Montant incorrect', icon: DollarSign, description: 'Le montant facturé ne correspond pas' },
  { value: 'Produit non conforme', icon: Package, description: 'Les produits reçus ne correspondent pas à la commande' },
  { value: 'Facture déjà réglée', icon: CheckCircle, description: 'Cette facture a déjà été payée' },
  { value: 'Double facturation', icon: FileText, description: 'Facture en double' },
  { value: 'Prestation non réalisée', icon: Clock, description: 'Service non fourni ou incomplet' },
  { value: 'Autre', icon: AlertTriangle, description: 'Autre motif à préciser' },
];

interface Props {
  invoice:   PurchaseInvoice;
  onClose:   () => void;
  onConfirm: (reason: string) => void;
}

export function DisputeModal({ invoice, onClose, onConfirm }: Props) {
  const [customReason, setCustomReason] = useState('');
  const [customError,  setCustomError]  = useState('');

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dispute_reason: '' },
  });

  const selected = watch('dispute_reason');

  const onSubmit = ({ dispute_reason }: FormValues) => {
    if (dispute_reason === 'Autre') {
      const trimmed = customReason.trim();
      if (trimmed.length < 10) {
        setCustomError('Veuillez préciser le motif (minimum 10 caractères)');
        return;
      }
      onConfirm(`Autre : ${trimmed}`);
    } else {
      onConfirm(dispute_reason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Signaler un litige</h2>
              <p className="text-xs text-gray-500">Cette facture sera marquée comme contestée</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Info facture */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-orange-600 font-medium mb-1">Facture</p>
                <p className="font-bold text-gray-900">{invoice.invoice_number_supplier}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-orange-600 font-medium mb-1">Montant</p>
                <p className="font-bold text-gray-900">{formatAmount(invoice.net_amount)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-orange-200">
              <span>{invoice.supplier?.name}</span>
              <span>{formatDate(invoice.invoice_date)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            
            {/* Motifs de litige */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Quel est le problème ? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {DISPUTE_REASONS.map(reason => {
                  const Icon = reason.icon;
                  const isSelected = selected === reason.value;
                  return (
                    <label 
                      key={reason.value} 
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={reason.value}
                        {...register('dispute_reason')}
                        onChange={(e) => {
                          if (e.target.value !== 'Autre') {
                            setCustomReason('');
                            setCustomError('');
                          }
                          register('dispute_reason').onChange(e);
                        }}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          isSelected ? 'text-orange-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          isSelected ? 'text-orange-900' : 'text-gray-900'
                        }`}>
                          {reason.value}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          isSelected ? 'text-orange-700' : 'text-gray-500'
                        }`}>
                          {reason.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
              {errors.dispute_reason && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.dispute_reason.message}
                </p>
              )}
            </div>

            {/* Champ texte libre pour "Autre" */}
            {selected === 'Autre' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Précisez le motif <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (e.target.value.trim().length >= 10) setCustomError('');
                  }}
                  placeholder="Décrivez en détail le motif du litige (minimum 10 caractères)..."
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none ${
                    customError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {customError ? (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {customError}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs">
                      {customReason.trim().length} / 10 caractères minimum
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Info importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>ℹ️ Important :</strong> Cette facture sera marquée comme "En litige" et ne pourra pas être payée tant que le litige n'est pas résolu. Le fournisseur sera notifié.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
              >
                {isSubmitting ? 'Enregistrement...' : 'Confirmer le litige'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DisputeModal;