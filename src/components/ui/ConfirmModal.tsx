// src/components/ui/ConfirmModal.tsx
// Modal de confirmation réutilisable pour remplacer window.confirm

import { AlertTriangle, Trash2, X } from 'lucide-react';

interface Props {
  title:      string;
  message:    string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:   'danger' | 'warning' | 'info';
  onConfirm:  () => void;
  onClose:    () => void;
  loading?:   boolean;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  variant      = 'danger',
  onConfirm,
  onClose,
  loading,
}: Props) {
  const colors = {
    danger:  { icon: 'text-red-600', bg: 'bg-red-50', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: 'text-yellow-600', bg: 'bg-yellow-50', btn: 'bg-yellow-600 hover:bg-yellow-700' },
    info:    { icon: 'text-blue-600', bg: 'bg-blue-50', btn: 'bg-blue-600 hover:bg-blue-700' },
  }[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-1 text-sm">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 ${colors.btn}`}
          >
            {loading ? 'En cours...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// src/hooks/useApiError.ts
// Hook pour parser les erreurs API et les afficher proprement
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useToast } from './Toast';

export const useApiError = () => {
  const toast = useToast();

  const handleError = useCallback((err: any, defaultMsg = 'Une erreur est survenue') => {
    const data = err?.response?.data;

    if (data?.details) {
      // Erreurs de validation NestJS (nouveau format)
      const firstField = data.details[0];
      const msg = firstField?.messages?.[0] ?? defaultMsg;
      toast.error('Erreur de validation', msg);
      return;
    }

    if (Array.isArray(data?.message)) {
      toast.error('Erreur de validation', data.message[0]);
      return;
    }

    if (typeof data?.message === 'string') {
      toast.error('Erreur', data.message);
      return;
    }

    toast.error('Erreur', defaultMsg);
  }, [toast]);

  return { handleError };
};