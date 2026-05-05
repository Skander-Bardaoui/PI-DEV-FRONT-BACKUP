// src/components/sales/SalesOcrModal.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X, Upload, FileText, CheckCircle, AlertTriangle,
  AlertCircle, Zap, RefreshCw, Sparkles, Brain,
  Shield, TrendingUp, Eye, ChevronRight,
} from 'lucide-react';

interface SalesOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: any) => void;
  documentType?: 'invoice' | 'quote' | 'delivery_note' | 'order';
  businessId: string;
}

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not_found';

interface OcrResult {
  document_type: string;
  document_number: string | null;
  document_date: string | null;
  client_name: string | null;
  subtotal_ht: number | null;
  tax_amount: number | null;
  timbre_fiscal: number | null;
  total_ttc: number | null;
  items: any[];
  raw_text: string;
  confidence: number;
  processing_time_ms: number;
  file_url: string;
  file_name: string;
  file_size: number;
  ai_enrichment?: {
    confidence: number;
    documentType: string;
    mappedFields: any;
  };
}

// ─── Config confiance ─────────────────────────────────────────────────────────
const CONF_CONFIG: Record<ConfidenceLevel, {
  icon: 'ok' | 'warn' | 'err';
  color: string; bg: string; border: string; label: string;
}> = {
  high:      { icon: 'ok',   color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', label: 'Haute confiance'  },
  medium:    { icon: 'warn', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', label: 'Confiance moyenne' },
  low:       { icon: 'err',  color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', label: 'Faible confiance'  },
  not_found: { icon: 'err',  color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', label: 'Non détecté'       },
};

function ConfIcon({ level }: { level: ConfidenceLevel }) {
  const { icon, color } = CONF_CONFIG[level];
  if (icon === 'ok')   return <CheckCircle  size={12} color={color} />;
  if (icon === 'warn') return <AlertTriangle size={12} color={color} />;
  return <AlertCircle size={12} color={color} />;
}

function AIBadge({ text }: { text: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: 'linear-gradient(135deg, #EDE9FE, #DBEAFE)',
      border: '1px solid #C4B5FD', fontSize: 11, fontWeight: 600, color: '#5B21B6',
    }}>
      <Sparkles size={10} />
      {text}
    </div>
  );
}

function StepIndicator({ step }: { step: 'upload' | 'review' | 'done' }) {
  const steps = [
    { key: 'upload', label: 'Importer', icon: <Upload size={14} /> },
    { key: 'review', label: 'Vérification', icon: <Brain size={14} /> },
    { key: 'done',   label: 'Terminé',  icon: <CheckCircle size={14} /> },
  ];
  const idx = steps.findIndex(s => s.key === step);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0 20px 16px' }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 20,
            background: i === idx ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : i < idx ? '#F0FDF4' : '#F9FAFB',
            border: `1.5px solid ${i === idx ? '#4F46E5' : i < idx ? '#86EFAC' : '#E5E7EB'}`,
            color: i === idx ? '#fff' : i < idx ? '#16A34A' : '#9CA3AF',
            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
            transition: 'all 0.3s',
          }}>
            {i < idx ? <CheckCircle size={14} /> : s.icon}
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 4px',
              background: i < idx ? '#86EFAC' : '#E5E7EB',
              transition: 'background 0.3s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function DropZone({ onFile, isPending }: { onFile: (f: File) => void; isPending: boolean }) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onFile(files[0]); }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [], 'image/*': [] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
    disabled: isPending,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? '#4F46E5' : '#C4B5FD'}`,
        borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        cursor: isPending ? 'not-allowed' : 'pointer',
        background: isDragActive
          ? 'linear-gradient(135deg, #EEF2FF, #F5F3FF)'
          : 'linear-gradient(135deg, #FAFAFA, #F5F3FF)',
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <input {...getInputProps()} />

      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, #EDE9FE40, transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
        background: isDragActive
          ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
          : 'linear-gradient(135deg, #EDE9FE, #DBEAFE)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        <Upload size={28} color={isDragActive ? '#fff' : '#4F46E5'} />
      </div>

      <p style={{ fontSize: 15, fontWeight: 600, color: isDragActive ? '#4F46E5' : '#1F2937', marginBottom: 6 }}>
        {isDragActive ? 'Déposez ici !' : 'Glissez votre document ici'}
      </p>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        ou cliquez pour sélectionner un fichier
      </p>
      <p style={{ fontSize: 11, color: '#9CA3AF' }}>PDF, JPG, PNG — max 10 Mo</p>
    </div>
  );
}

function AiLoader() {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #EDE9FE, #DBEAFE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <Sparkles size={32} color="#4F46E5" />
        </div>
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#4F46E5', borderRightColor: '#7C3AED',
          animation: 'spin 1s linear infinite',
        }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
      `}</style>

      <p style={{ fontWeight: 700, fontSize: 16, color: '#1F2937', marginBottom: 8 }}>
        Analyse en cours
      </p>
      <p style={{ fontSize: 13, color: '#7C3AED', marginBottom: 24, fontWeight: 500 }}>
        L'assistant extrait automatiquement toutes les données
      </p>
    </div>
  );
}

function AiScoreCard({ ocrData }: { ocrData: OcrResult }) {
  const score = ocrData.confidence;
  const aiConf = ocrData.ai_enrichment?.confidence ?? 0;
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Correct' : 'Partiel';

  const fields = [
    { name: 'N° Document', ok: !!ocrData.document_number },
    { name: 'Date',        ok: !!ocrData.document_date },
    { name: 'Client',      ok: !!ocrData.client_name },
    { name: 'Montant HT',  ok: !!ocrData.subtotal_ht },
    { name: 'TVA',         ok: !!ocrData.tax_amount },
    { name: 'Total TTC',   ok: !!ocrData.total_ttc },
  ];
  const extracted = fields.filter(f => f.ok).length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F5F3FF, #EEF2FF)',
      border: '1.5px solid #C4B5FD', borderRadius: 16, padding: 16, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Brain size={22} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1F2937' }}>
              Rapport d'extraction automatique
            </p>
            <AIBadge text="Assistant IA" />
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
            {ocrData.file_name} · Traité en {ocrData.processing_time_ms}ms
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Score Lecture</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `conic-gradient(${color} ${score * 3.6}deg, #F3F4F6 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color,
              }}>
                {score}%
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color }}>{label}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Qualité lecture</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Score Assistant</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `conic-gradient(#7C3AED ${aiConf * 3.6}deg, #F3F4F6 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#7C3AED',
              }}>
                {aiConf}%
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED' }}>
                {aiConf >= 80 ? 'Fiable' : aiConf >= 60 ? 'Correct' : 'Vérifier'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Confiance assistant</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Champs extraits ({extracted}/{fields.length})
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {fields.map(f => (
            <div key={f.name} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 20, fontSize: 11,
              background: f.ok ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${f.ok ? '#86EFAC' : '#FCA5A5'}`,
              color: f.ok ? '#16A34A' : '#DC2626',
            }}>
              {f.ok ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
              {f.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SalesOcrModal({
  isOpen,
  onClose,
  onScanComplete,
  documentType,
  businessId,
}: SalesOcrModalProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload');
  const [ocrData, setOcrData] = useState<OcrResult | null>(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError('');
    setIsScanning(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = documentType
        ? `/businesses/${businessId}/sales/ocr/scan-${documentType}`
        : `/businesses/${businessId}/sales/ocr/scan`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du scan');
      }

      const result = await response.json();
      setOcrData(result);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du scan du document');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = () => {
    if (ocrData) {
      onScanComplete(ocrData);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('upload');
    setOcrData(null);
    setError('');
    setIsScanning(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, maxWidth: 620, width: '100%', maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)',
          borderRadius: '20px 20px 0 0', position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Scanner un Document</h2>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                Importez votre document et laissez l'assistant extraire les données automatiquement
              </p>
            </div>
            <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 0 0' }}>
          <StepIndicator step={step} />
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {step === 'upload' && (
            <>
              {error && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#DC2626" /> {error}
                </div>
              )}

              {isScanning ? (
                <AiLoader />
              ) : (
                <>
                  <DropZone onFile={handleFile} isPending={isScanning} />

                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { icon: <Brain size={16} color="#4F46E5" />, title: 'Assistant intelligent', desc: 'Extraction automatique' },
                      { icon: <Eye size={16} color="#7C3AED" />,   title: 'Analyse visuelle',     desc: 'Lecture de l\'image' },
                      { icon: <Shield size={16} color="#2563EB" />, title: 'Vérification',        desc: 'Contrôle des montants' },
                      { icon: <Zap size={16} color="#D97706" />,    title: 'Gain de temps',       desc: 'Formulaire pré-rempli' },
                    ].map(item => (
                      <div key={item.title} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: '#FAFAFA', border: '1px solid #E5E7EB',
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{item.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {step === 'review' && ocrData && (
            <>
              <AiScoreCard ocrData={ocrData} />

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#991B1B' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUseData}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Utiliser ces données
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
