// src/components/sales/SalesOcrModal.tsx
import { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SalesOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: any) => void;
  documentType?: 'invoice' | 'quote' | 'delivery_note' | 'order';
  businessId: string;
}

export default function SalesOcrModal({
  isOpen,
  onClose,
  onScanComplete,
  documentType,
  businessId,
}: SalesOcrModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Maximum 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setScanResult(null);
  };

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = documentType
        ? `/businesses/${businessId}/sales/ocr/scan-${documentType}`
        : `/businesses/${businessId}/sales/ocr/scan`;

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        credentials: 'include', // Send cookies automatically
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du scan');
      }

      const result = await response.json();
      setScanResult(result.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du scan du document');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = () => {
    if (scanResult) {
      onScanComplete(scanResult);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setScanResult(null);
    setError(null);
    setDragActive(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Scanner un document</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Upload Area */}
            {!scanResult && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Glissez-déposez votre document ici
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                >
                  Sélectionner un fichier
                </label>
                <p className="text-xs text-gray-400 mt-4">
                  Formats acceptés: JPG, PNG, PDF (max 10MB)
                </p>
              </div>
            )}

            {/* Selected File */}
            {file && !scanResult && (
              <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Erreur</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Scan réussi!</p>
                    <p className="text-sm text-green-700">
                      Confiance: {scanResult.confidence}% | Type: {scanResult.document_type}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Données extraites:</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {scanResult.document_number && (
                      <div>
                        <p className="text-sm text-gray-500">Numéro</p>
                        <p className="font-medium">{scanResult.document_number}</p>
                      </div>
                    )}
                    {scanResult.document_date && (
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{new Date(scanResult.document_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                    {scanResult.client_name && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-medium">{scanResult.client_name}</p>
                      </div>
                    )}
                    {scanResult.subtotal_ht !== null && (
                      <div>
                        <p className="text-sm text-gray-500">Total HT</p>
                        <p className="font-medium">{scanResult.subtotal_ht?.toFixed(3)} TND</p>
                      </div>
                    )}
                    {scanResult.tax_amount !== null && (
                      <div>
                        <p className="text-sm text-gray-500">TVA</p>
                        <p className="font-medium">{scanResult.tax_amount?.toFixed(3)} TND</p>
                      </div>
                    )}
                    {scanResult.total_ttc !== null && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Total TTC</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {scanResult.total_ttc?.toFixed(3)} TND
                        </p>
                      </div>
                    )}
                  </div>

                  {scanResult.items && scanResult.items.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Articles ({scanResult.items.length})</p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {scanResult.items.map((item: any, index: number) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-gray-600">
                              Qté: {item.quantity} × {item.unit_price?.toFixed(3)} = {item.total?.toFixed(3)} TND
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              
              {!scanResult && file && (
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scan en cours...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Scanner le document
                    </>
                  )}
                </button>
              )}

              {scanResult && (
                <button
                  onClick={handleUseData}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Utiliser ces données
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
