// src/components/sales/RecurringInvoiceBulkActions.tsx
import { CheckCircle, Pause, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  selectedCount: number;
  onActivate: () => void;
  onPause: () => void;
  onDelete: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

export default function RecurringInvoiceBulkActions({
  selectedCount,
  onActivate,
  onPause,
  onDelete,
  onClear,
  isLoading = false,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-600">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <div className="flex items-center gap-2">
            <button
              onClick={onActivate}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Activer"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Activer</span>
            </button>

            <button
              onClick={onPause}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mettre en pause"
            >
              <Pause className="h-4 w-4" />
              <span className="text-sm font-medium">Pause</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm font-medium">Supprimer</span>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          <button
            onClick={onClear}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Annuler la sélection"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600">
                  Êtes-vous sûr de vouloir supprimer {selectedCount} facture{selectedCount > 1 ? 's' : ''} récurrente{selectedCount > 1 ? 's' : ''} ?
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Cette action est irréversible. Les factures déjà générées ne seront pas supprimées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
