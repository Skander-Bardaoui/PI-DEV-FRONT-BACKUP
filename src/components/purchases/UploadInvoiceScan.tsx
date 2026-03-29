// src/components/purchases/UploadInvoiceScan.tsx
// Remplace le champ <input type="url"> dans PurchaseInvoiceModal et CorrectInvoiceModal.
// Usage :


import { useRef, useState } from 'react';
import { Upload, X, FileText, ExternalLink } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

interface Props {
  businessId: string;
  value?:     string;
  onChange:   (url: string) => void;
}

export default function UploadInvoiceScan({ businessId, value, onChange }: Props) {
  const inputRef     = useRef<HTMLInputElement>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [fileName,   setFileName]   = useState('');

  const handleFile = async (file: File) => {
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Format non supporté. Acceptés : PDF, JPG, PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux. Maximum : 10 Mo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/upload/invoice-scan`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      setFileName(file.name);
      onChange(data.url);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de l\'upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    onChange('');
    setFileName('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // Si une URL est déjà uploadée → afficher aperçu + bouton supprimer
  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800 truncate">
            {fileName || 'Scan uploadé'}
          </p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Voir le fichier
          </a>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 text-green-500 hover:text-red-500 transition-colors"
          title="Supprimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${loading
            ? 'border-indigo-300 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
          }
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            <p className="text-sm text-indigo-600">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Glisser-déposer ou cliquer pour choisir
            </p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG — max 10 Mo</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}