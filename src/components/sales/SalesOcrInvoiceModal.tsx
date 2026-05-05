// src/components/sales/SalesOcrInvoiceModal.tsx
// Modal OCR pour factures clients - Version alignée avec purchases
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X, Upload, CheckCircle, AlertTriangle, AlertCircle, Sparkles, Brain, Eye, Shield, Zap,
} from 'lucide-react';
import { useSalesOcrExtract, SalesOcrResult, ConfidenceLevel } from '@/hooks/useSalesOcr';
import { useClients } from '@/hooks/useClients';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

const CONF_CONFIG: Record<ConfidenceLevel, {
  icon: 'ok' | 'warn' | 'err'; color: string; bg: string; border: string; label: string;
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

function OcrField({
  label, value, confidence, onChange, type = 'text', required = false,
}: {
  label: string; value: string; confidence: ConfidenceLevel;
  onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  const cfg = CONF_CONFIG[confidence];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
        </label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 20,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          fontSize: 10, color: cfg.color, fontWeight: 500,
        }}>
          <ConfIcon level={confidence} />
          {cfg.label}
        </div>
      </div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', fontSize: 13,
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 8, outline: 'none', boxSizing: 'border-box',
          background: confidence === 'not_found' ? '#FEF2F2' : confidence === 'high' ? '#F0FDF4' : '#fff',
        }}
      />
    </div>
  );
}

function AiLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: <Upload size={16} />,    label: 'Lecture du document...',       delay: 0 },
    { icon: <Eye size={16} />,       label: 'Analyse OCR en cours...',      delay: 800 },
    { icon: <Brain size={16} />,     label: 'IA Gemini extrait les données...', delay: 2000 },
    { icon: <Shield size={16} />,    label: 'Validation et structuration...', delay: 4000 },
    { icon: <Zap size={16} />,       label: 'Calcul des niveaux de confiance...', delay: 5500 },
  ];

  useState(() => {
    steps.forEach((step, idx) => {
      setTimeout(() => setCurrentStep(idx), step.delay);
    });
  });

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px' }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
          border: '3px solid #C4B5FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <Sparkles size={40} color="#7C3AED" />
        </div>
        <div style={{
          position: 'absolute', top: -5, right: -5,
          width: 110, height: 110, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#4F46E5',
          animation: 'spin 1.5s linear infinite',
        }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1F2937' }}>
        Analyse IA en cours
      </h3>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#7C3AED', fontWeight: 500 }}>
        Gemini extrait automatiquement toutes les données
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, margin: '0 auto' }}>
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          
          return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: isDone ? '#F0FDF4' : isActive ? '#EEF2FF' : '#F9FAFB',
              border: `1.5px solid ${isDone ? '#86EFAC' : isActive ? '#C4B5FD' : '#E5E7EB'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isDone ? '#16A34A' : isActive ? '#7C3AED' : '#E5E7EB',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                {isDone ? <CheckCircle size={16} /> : step.icon}
              </div>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 500,
                color: isDone ? '#166534' : isActive ? '#5B21B6' : '#9CA3AF',
                transition: 'color 0.3s',
              }}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: 'upload' | 'review' | 'done' }) {
  const steps = [
    { key: 'upload', label: 'Upload', icon: <Upload size={14} /> },
    { key: 'review', label: 'Vérification IA', icon: <Brain size={14} /> },
    { key: 'done',   label: 'Créée',  icon: <CheckCircle size={14} /> },
  ];
  const idx = steps.findIndex(s => s.key === step);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0 0 20px' }}>
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
        background: isDragActive ? 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' : 'linear-gradient(135deg, #FAFAFA, #F5F3FF)',
      }}
    >
      <input {...getInputProps()} />
      <Upload size={40} color={isDragActive ? '#4F46E5' : '#9CA3AF'} style={{ margin: '0 auto 16px' }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: isDragActive ? '#4F46E5' : '#374151', marginBottom: 6 }}>
        {isDragActive ? 'Déposez le fichier ici' : 'Glissez votre facture ici'}
      </p>
      <p style={{ fontSize: 12, color: '#9CA3AF' }}>ou cliquez pour sélectionner un fichier</p>
      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>PDF, JPG, PNG — max 10 Mo</p>
    </div>
  );
}

function AiScoreCard({ ocrData }: { ocrData: SalesOcrResult }) {
  const score = ocrData.ocr_confidence;
  const aiConf = ocrData.ai_enrichment?.confidence ?? 0;
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Correct' : 'Partiel';

  const fields = [
    { name: 'N° Facture',  ok: !!ocrData.document_number.value },
    { name: 'Date',        ok: !!ocrData.document_date.value },
    { name: 'Client',      ok: !!ocrData.client_name.value },
    { name: 'Montant HT',  ok: !!ocrData.subtotal_ht.value },
    { name: 'TVA',         ok: !!ocrData.tax_amount.value },
    { name: 'Total TTC',   ok: !!ocrData.total_ttc.value },
  ];
  const extracted = fields.filter(f => f.ok).length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F0FDF4, #DBEAFE)',
      border: '1.5px solid #86EFAC', borderRadius: 16, padding: 16, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `conic-gradient(${color} ${score}%, #E5E7EB 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color,
          }}>
            {score}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#166534' }}>
            Extraction {label}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
            {ocrData.file_name} · Traité en {ocrData.processing_time_ms}ms
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#6B7280' }}>Score OCR</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{score}%</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>{label}</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#6B7280' }}>IA Gemini</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#7C3AED" />
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7C3AED' }}>{aiConf}%</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff', borderRadius: 10 }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
          Champs extraits : {extracted}/{fields.length}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {fields.map(f => (
            <div key={f.name} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10,
              background: f.ok ? '#F0FDF4' : '#F9FAFB',
              color: f.ok ? '#16A34A' : '#9CA3AF',
              border: `1px solid ${f.ok ? '#86EFAC' : '#E5E7EB'}`,
            }}>
              {f.ok ? '✓' : '○'} {f.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  businessId: string;
  onClose: () => void;
  onCreated?: () => void;
}

export default function SalesOcrInvoiceModal({ businessId, onClose, onCreated }: Props) {
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload');
  const [ocrData, setOcrData] = useState<SalesOcrResult | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    invoice_number: '',
    date: '',
    due_date: '',
    client_id: '',
    subtotal_ht: '',
    tax_amount: '',
    discount: '0',
    net_amount: '',
    notes: '',
  });

  const [conf, setConf] = useState<Record<string, ConfidenceLevel>>({
    invoice_number: 'not_found',
    date: 'not_found',
    client_name: 'not_found',
    subtotal_ht: 'not_found',
    tax_amount: 'not_found',
    total_ttc: 'not_found',
  });

  const ocr = useSalesOcrExtract(businessId, 'invoice');
  const queryClient = useQueryClient();
  
  const { data: clientsData, isLoading: clientsLoading } = useClients(businessId, { limit: 100 });

  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(`/businesses/${businessId}/invoices`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices', businessId] });
    },
  });

  const handleFile = async (file: File) => {
    setError('');
    try {
      const result = await ocr.mutateAsync(file);
      setOcrData(result);

      const invoiceDate = result.document_date.value || new Date().toISOString().split('T')[0];
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      setForm({
        invoice_number: result.document_number.value ?? '',
        date: invoiceDate,
        due_date: dueDate.toISOString().split('T')[0],
        client_id: '',
        subtotal_ht: result.subtotal_ht.value?.toString() ?? '',
        tax_amount: result.tax_amount.value?.toString() ?? '',
        discount: '0',
        net_amount: result.total_ttc.value?.toString() ?? '',
        notes: result.notes.value ?? '',
      });

      setConf({
        invoice_number: result.document_number.confidence,
        date: result.document_date.confidence,
        client_name: result.client_name.confidence,
        subtotal_ht: result.subtotal_ht.confidence,
        tax_amount: result.tax_amount.confidence,
        total_ttc: result.total_ttc.confidence,
      });

      setStep('review');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erreur OCR');
    }
  };

  const handleCreate = async () => {
    if (!form.invoice_number || !form.date || !form.client_id) {
      setError('Veuillez remplir les champs obligatoires : N° facture, date, client.');
      return;
    }
    setError('');
    try {
      const items = ocrData?.items && ocrData.items.length > 0
        ? ocrData.items.map(item => ({
            description: item.description || 'Article',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            tax_rate_value: 19,
          }))
        : [{
            description: 'Article',
            quantity: 1,
            unit_price: parseFloat(form.subtotal_ht) || 0,
            tax_rate_value: 19,
          }];

      await createInvoice.mutateAsync({
        invoice_number: form.invoice_number,
        date: form.date,
        due_date: form.due_date,
        client_id: form.client_id,
        subtotal_ht: parseFloat(form.subtotal_ht) || 0,
        tax_amount: parseFloat(form.tax_amount) || 0,
        discount: parseFloat(form.discount) || 0,
        net_amount: parseFloat(form.net_amount) || 0,
        notes: form.notes || undefined,
        status: 'DRAFT',
        items,
      });
      setStep('done');
      onCreated?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la création.');
    }
  };

  const upd = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={20} color="#fff" />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Scanner une Facture</h2>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                Importez votre facture et laissez l'IA extraire les données automatiquement
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 8, padding: 6 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <StepIndicator step={step} />

          {step === 'upload' && (
            <>
              {error && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#991B1B' }}>
                  {error}
                </div>
              )}
              {ocr.isPending ? (
                <AiLoader />
              ) : (
                <>
                  <DropZone onFile={handleFile} isPending={ocr.isPending} />
                  
                  {/* Capacités IA */}
                  <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', border: '1px solid #C4B5FD', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Brain size={18} color="#7C3AED" />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#5B21B6' }}>Gemini AI</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Extraction intelligente</p>
                    </div>
                    
                    <div style={{ background: 'linear-gradient(135deg, #DBEAFE, #E0E7FF)', border: '1px solid #93C5FD', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Eye size={18} color="#2563EB" />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>Vision IA</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Analyse de l'image</p>
                    </div>
                    
                    <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FEF9C3)', border: '1px solid #FCD34D', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Shield size={18} color="#D97706" />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#92400E' }}>Validation</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Contrôle des montants</p>
                    </div>
                    
                    <div style={{ background: 'linear-gradient(135deg, #DCFCE7, #D1FAE5)', border: '1px solid #86EFAC', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Zap size={18} color="#16A34A" />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#166534' }}>Pré-remplissage</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>Formulaire automatique</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'review' && ocrData && (
            <>
              <AiScoreCard ocrData={ocrData} />

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#991B1B' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <OcrField label="N° Facture" value={form.invoice_number}
                  confidence={conf.invoice_number} onChange={upd('invoice_number')} required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <OcrField label="Date" value={form.date}
                    confidence={conf.date} onChange={upd('date')} type="date" required />
                  <OcrField label="Échéance" value={form.due_date}
                    confidence="medium" onChange={upd('due_date')} type="date" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                      Client <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 20,
                      background: CONF_CONFIG[conf.client_name].bg,
                      border: `1px solid ${CONF_CONFIG[conf.client_name].border}`,
                      fontSize: 10, color: CONF_CONFIG[conf.client_name].color, fontWeight: 500,
                    }}>
                      <ConfIcon level={conf.client_name} />
                      {ocrData.client_name.value ? `Détecté : "${ocrData.client_name.value}"` : 'Non détecté'}
                    </div>
                  </div>
                  
                  <select 
                    value={form.client_id} 
                    onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                    style={{ 
                      width: '100%', padding: '9px 12px', fontSize: 13, 
                      border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none',
                      background: '#fff', cursor: 'pointer',
                    }}
                  >
                    <option value="">— Sélectionner un client —</option>
                    {(clientsData?.clients ?? []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <OcrField label="HT" value={form.subtotal_ht} confidence={conf.subtotal_ht}
                    onChange={upd('subtotal_ht')} type="number" />
                  <OcrField label="TVA" value={form.tax_amount} confidence={conf.tax_amount}
                    onChange={upd('tax_amount')} type="number" />
                  <OcrField label="Remise" value={form.discount} confidence="not_found"
                    onChange={upd('discount')} type="number" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={onClose}
                  style={{ flex: 1, padding: '11px', border: '1px solid #D1D5DB', borderRadius: 10, cursor: 'pointer', background: '#fff', fontSize: 14 }}>
                  Annuler
                </button>
                <button onClick={handleCreate} disabled={createInvoice.isPending}
                  style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: createInvoice.isPending ? 0.6 : 1 }}>
                  {createInvoice.isPending ? 'Création...' : 'Créer la facture'}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Facture créée !</h3>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
                La facture <strong>{form.invoice_number}</strong> a été créée automatiquement.
              </p>
              <button onClick={onClose}
                style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
