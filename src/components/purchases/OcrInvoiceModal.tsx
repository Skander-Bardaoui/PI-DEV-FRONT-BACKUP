// src/components/purchases/OcrInvoiceModal.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X, Upload, FileText, CheckCircle, AlertTriangle,
  AlertCircle, Zap, RefreshCw, Sparkles, Brain,
  Shield, TrendingUp, Eye, ChevronRight,
} from 'lucide-react';
import { useOcrExtract, OcrResult, ConfidenceLevel } from '@/hooks/useOcr';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreatePurchaseInvoice } from '@/hooks/usePurchaseInvoices';

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

// ─── Composant champ OCR ──────────────────────────────────────────────────────
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
          border: `1.5px solid ${confidence === 'not_found' ? '#FCA5A5' : confidence === 'low' ? '#FCD34D' : confidence === 'high' ? '#86EFAC' : '#E5E7EB'}`,
          borderRadius: 8, outline: 'none', boxSizing: 'border-box',
          background: confidence === 'not_found' ? '#FEF2F2' : confidence === 'high' ? '#F0FDF4' : '#fff',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  );
}

// ─── Badge IA ─────────────────────────────────────────────────────────────────
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 'upload' | 'review' | 'done' }) {
  const steps = [
    { key: 'upload', label: 'Upload', icon: <Upload size={14} /> },
    { key: 'review', label: 'Vérification IA', icon: <Brain size={14} /> },
    { key: 'done',   label: 'Créée',  icon: <CheckCircle size={14} /> },
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

// ─── Zone de drop ─────────────────────────────────────────────────────────────
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

      {/* Décoration fond */}
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
        {isDragActive ? 'Déposez ici !' : 'Glissez votre facture ici'}
      </p>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        ou cliquez pour sélectionner un fichier
      </p>
      <p style={{ fontSize: 11, color: '#9CA3AF' }}>PDF, JPG, PNG — max 10 Mo</p>
    </div>
  );
}

// ─── Loader IA animé ──────────────────────────────────────────────────────────
function AiLoader() {
  const steps = [
    { icon: <Upload size={16} />,    label: 'Lecture du document...',       delay: 0 },
    { icon: <Eye size={16} />,       label: 'Analyse OCR en cours...',      delay: 800 },
    { icon: <Brain size={16} />,     label: 'IA Gemini extrait les données...', delay: 2000 },
    { icon: <Shield size={16} />,    label: 'Validation et structuration...', delay: 4000 },
    { icon: <TrendingUp size={16} />, label: 'Calcul des niveaux de confiance...', delay: 6000 },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useState(() => {
    steps.forEach((s, i) => {
      setTimeout(() => setActiveStep(i), s.delay);
    });
  });

  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      {/* Animation principale */}
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <p style={{ fontWeight: 700, fontSize: 16, color: '#1F2937', marginBottom: 8 }}>
        Analyse IA en cours
      </p>
      <p style={{ fontSize: 13, color: '#7C3AED', marginBottom: 24, fontWeight: 500 }}>
        Gemini extrait automatiquement toutes les données
      </p>

      {/* Étapes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: i === activeStep ? 'linear-gradient(135deg, #EDE9FE, #DBEAFE)' : i < activeStep ? '#F0FDF4' : '#F9FAFB',
            border: `1px solid ${i === activeStep ? '#C4B5FD' : i < activeStep ? '#86EFAC' : '#E5E7EB'}`,
            opacity: i > activeStep ? 0.4 : 1,
            transition: 'all 0.4s ease',
            animation: i === activeStep ? 'fadeIn 0.3s ease' : 'none',
          }}>
            <div style={{ color: i === activeStep ? '#4F46E5' : i < activeStep ? '#16A34A' : '#9CA3AF' }}>
              {i < activeStep ? <CheckCircle size={16} color="#16A34A" /> : s.icon}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === activeStep ? 600 : 400, color: i === activeStep ? '#4F46E5' : i < activeStep ? '#16A34A' : '#6B7280' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score IA visuel ──────────────────────────────────────────────────────────
function AiScoreCard({ ocrData }: { ocrData: OcrResult }) {
  const score = ocrData.ocr_confidence;
  const aiConf = ocrData.ai_validation?.confidence ?? 0;
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#DC2626';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Correct' : 'Partiel';

  // Calcul des champs extraits
  const fields = [
    { name: 'N° Facture',  ok: !!ocrData.invoice_number_supplier.value },
    { name: 'Date',        ok: !!ocrData.invoice_date.value },
    { name: 'Fournisseur', ok: !!ocrData.supplier_name.value },
    { name: 'Montant HT',  ok: !!ocrData.subtotal_ht.value },
    { name: 'TVA',         ok: !!ocrData.tax_amount.value },
    { name: 'Total TTC',   ok: !!ocrData.net_amount.value },
  ];
  const extracted = fields.filter(f => f.ok).length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F5F3FF, #EEF2FF)',
      border: '1.5px solid #C4B5FD', borderRadius: 16, padding: 16, marginBottom: 16,
    }}>
      {/* Header */}
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
              Rapport d'extraction IA
            </p>
            <AIBadge text="Gemini AI" />
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
            {ocrData.file_name} · Traité en {ocrData.processing_time_ms}ms
          </p>
        </div>
        <button
          onClick={() => {/* reset handled by parent */}}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          <RefreshCw size={13} /> Nouveau
        </button>
      </div>

      {/* Scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {/* OCR Score */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Score OCR</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `conic-gradient(${color} ${score * 3.6}deg, #F3F4F6 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
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

        {/* AI Score */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Score IA</p>
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
              <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF' }}>Confiance IA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Champs extraits */}
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

      {/* Erreurs / avertissements AI */}
      {ocrData.ai_validation && (
        <>
          {ocrData.ai_validation.errors.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#FEE2E2', borderRadius: 10, border: '1px solid #FCA5A5' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#991B1B' }}>❌ Erreurs détectées</p>
              {ocrData.ai_validation.errors.map((e, i) => (
                <p key={i} style={{ margin: '2px 0', fontSize: 11, color: '#7F1D1D' }}>• {e}</p>
              ))}
            </div>
          )}
          {ocrData.ai_validation.warnings.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#FEF9C3', borderRadius: 10, border: '1px solid #FCD34D' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#92400E' }}>⚠️ Avertissements</p>
              {ocrData.ai_validation.warnings.map((w, i) => (
                <p key={i} style={{ margin: '2px 0', fontSize: 11, color: '#78350F' }}>• {w}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
interface Props { businessId: string; onClose: () => void; onCreated?: () => void; }

export default function OcrInvoiceModal({ businessId, onClose, onCreated }: Props) {
  const [step, setStep]       = useState<'upload' | 'review' | 'done'>('upload');
  const [ocrData, setOcrData] = useState<OcrResult | null>(null);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    invoice_date: '',
    supplier_id: '',
    subtotal_ht: '',
    tax_amount: '',
    timbre_fiscal: '1.000',
    net_amount: '',
    receipt_url: '',
  });

  const [conf, setConf] = useState<Record<string, ConfidenceLevel>>({
    invoice_date: 'not_found',
    supplier_name: 'not_found',
    subtotal_ht: 'not_found',
    tax_amount: 'not_found',
    timbre_fiscal: 'not_found',
    net_amount: 'not_found',
  });

  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierNotFound, setSupplierNotFound] = useState(false);

  const ocr    = useOcrExtract(businessId);
  const create = useCreatePurchaseInvoice(businessId);

  // Charger tous les fournisseurs actifs (sans filtre de recherche)
  const { data: allSuppliersData } = useSuppliers(businessId, { is_active: true, limit: 200 });
  // Charger les fournisseurs filtrés par recherche (quand l'utilisateur tape)
  const { data: filteredSuppliersData } = useSuppliers(businessId, { is_active: true, limit: 100, search: supplierSearch || undefined });

  // Liste affichée : si recherche active → filtrée, sinon tous
  const displayedSuppliers = supplierSearch
    ? (filteredSuppliersData?.data ?? [])
    : (allSuppliersData?.data ?? []);

  const handleFile = async (file: File) => {
    setError('');
    try {
      const result = await ocr.mutateAsync(file);
      setOcrData(result);
      setForm({
        invoice_date:            result.invoice_date.value ?? '',
        supplier_id:             '',
        subtotal_ht:             result.subtotal_ht.value?.toString() ?? '',
        tax_amount:              result.tax_amount.value?.toString()  ?? '',
        timbre_fiscal:           result.timbre_fiscal.value?.toString() ?? '1.000',
        net_amount:              result.net_amount.value?.toString()  ?? '',
        receipt_url:             result.file_url,
      });
      setConf({
        invoice_date:            result.invoice_date.confidence,
        supplier_name:           result.supplier_name.confidence,
        subtotal_ht:             result.subtotal_ht.confidence,
        tax_amount:              result.tax_amount.confidence,
        timbre_fiscal:           result.timbre_fiscal.confidence,
        net_amount:              result.net_amount.confidence,
      });
      if (result.supplier_name.value) {
        const detectedName = result.supplier_name.value.toLowerCase();
        const allSuppliers = allSuppliersData?.data ?? [];

        // Chercher une correspondance exacte ou partielle dans les fournisseurs existants
        const matched = allSuppliers.find(s =>
          s.name.toLowerCase().includes(detectedName) ||
          detectedName.includes(s.name.toLowerCase())
        );

        if (matched) {
          // Fournisseur trouvé → auto-sélectionner
          setForm(f => ({ ...f, supplier_id: matched.id }));
          setSupplierSearch(matched.name);
          setSupplierNotFound(false);
        } else {
          // Fournisseur non trouvé → afficher tous les fournisseurs, vider la recherche
          setSupplierSearch('');
          setSupplierNotFound(true);
        }
      } else {
        setSupplierSearch('');
        setSupplierNotFound(false);
      }
      setStep('review');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erreur OCR');
    }
  };

  const handleCreate = async () => {
    if (!form.invoice_date || !form.supplier_id) {
      setError('Veuillez remplir : date et fournisseur.');
      return;
    }
    setError('');
    try {
      await create.mutateAsync({
        invoice_date:   form.invoice_date,
        supplier_id:    form.supplier_id,
        subtotal_ht:    parseFloat(form.subtotal_ht)    || 0,
        tax_amount:     parseFloat(form.tax_amount)     || 0,
        timbre_fiscal:  parseFloat(form.timbre_fiscal)  || 1,
        net_amount:     parseFloat(form.net_amount)     || 0,
        receipt_url:    form.receipt_url || undefined,
      });
      setStep('done');
      onCreated?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la création.');
    }
  };

  const upd = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }));
  const net = (parseFloat(form.subtotal_ht) || 0)
            + (parseFloat(form.tax_amount)  || 0)
            + (parseFloat(form.timbre_fiscal) || 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 60, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, maxWidth: 620, width: '100%', maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

        {/* Header gradient */}
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
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Scanner une Facture</h2>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                Importez votre facture et laissez l'IA extraire les données automatiquement
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '12px 0 0' }}>
          <StepIndicator step={step} />
        </div>

        <div style={{ padding: '0 24px 24px' }}>

          {/* ── Étape 1 : Upload ── */}
          {step === 'upload' && (
            <>
              {error && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#DC2626" /> {error}
                </div>
              )}

              {ocr.isPending ? (
                <AiLoader />
              ) : (
                <>
                  <DropZone onFile={handleFile} isPending={ocr.isPending} />

                  {/* Capacités IA */}
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { icon: <Brain size={16} color="#4F46E5" />, title: 'Gemini AI',       desc: 'Extraction intelligente' },
                      { icon: <Eye size={16} color="#7C3AED" />,   title: 'Vision IA',        desc: 'Analyse de l\'image' },
                      { icon: <Shield size={16} color="#2563EB" />, title: 'Validation',      desc: 'Contrôle des montants' },
                      { icon: <Zap size={16} color="#D97706" />,    title: 'Pré-remplissage', desc: 'Formulaire automatique' },
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

          {/* ── Étape 2 : Vérification ── */}
          {step === 'review' && ocrData && (
            <>
              <AiScoreCard ocrData={ocrData} />

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#991B1B' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Section : Identification */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={12} /> Identification
                  </p>
                  
                  {/* Info message about auto-generated invoice number */}
                  <div style={{ 
                    padding: '10px 12px', 
                    background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', 
                    border: '1px solid #C7D2FE', 
                    borderRadius: 8, 
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <CheckCircle size={14} color="#4F46E5" />
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#4338CA' }}>
                        Numéro de facture auto-généré
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6366F1' }}>
                        Un numéro unique sera créé automatiquement (ex: FACT-2026-0001)
                      </p>
                    </div>
                  </div>

                  <OcrField label="Date de facture" value={form.invoice_date}
                    confidence={conf.invoice_date} onChange={upd('invoice_date')} type="date" required />
                </div>

                {/* Section : Fournisseur */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Fournisseur *
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 20, fontSize: 11,
                      background: CONF_CONFIG[conf.supplier_name].bg,
                      border: `1px solid ${CONF_CONFIG[conf.supplier_name].border}`,
                      color: CONF_CONFIG[conf.supplier_name].color,
                    }}>
                      <ConfIcon level={conf.supplier_name} />
                      {ocrData.supplier_name.value ? `IA a détecté : "${ocrData.supplier_name.value}"` : 'Fournisseur non détecté'}
                    </div>
                    {/* Badge si fournisseur non trouvé dans la base */}
                    {supplierNotFound && ocrData.supplier_name.value && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 20, fontSize: 11,
                        background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E',
                      }}>
                        ⚠️ Non trouvé — choisissez dans la liste
                      </div>
                    )}
                  </div>

                  {/* Message d'aide si fournisseur non trouvé */}
                  {supplierNotFound && (
                    <div style={{
                      padding: '8px 12px', marginBottom: 8,
                      background: '#FFFBEB', border: '1px solid #FCD34D',
                      borderRadius: 8, fontSize: 12, color: '#92400E',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>⚠️</span>
                      <span>
                        Le fournisseur <strong>"{ocrData.supplier_name.value}"</strong> n'existe pas dans votre base.
                        Sélectionnez un fournisseur existant ci-dessous.
                      </span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="🔍 Rechercher un fournisseur..."
                    value={supplierSearch}
                    onChange={e => {
                      setSupplierSearch(e.target.value);
                      setSupplierNotFound(false);
                      // Réinitialiser la sélection si l'utilisateur tape
                      if (form.supplier_id) setForm(f => ({ ...f, supplier_id: '' }));
                    }}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #E5E7EB', borderRadius: '8px 8px 0 0', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                  />
                  <select
                    value={form.supplier_id}
                    onChange={e => {
                      setForm(f => ({ ...f, supplier_id: e.target.value }));
                      setSupplierNotFound(false);
                      // Mettre à jour la recherche avec le nom sélectionné
                      const selected = displayedSuppliers.find(s => s.id === e.target.value);
                      if (selected) setSupplierSearch(selected.name);
                    }}
                    size={Math.min(5, Math.max(3, displayedSuppliers.length + 1))}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1.5px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 8px 8px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="">— Sélectionner un fournisseur —</option>
                    {displayedSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {/* Compteur de fournisseurs */}
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
                    {displayedSuppliers.length} fournisseur{displayedSuppliers.length !== 1 ? 's' : ''} disponible{displayedSuppliers.length !== 1 ? 's' : ''}
                    {supplierSearch && ` pour "${supplierSearch}"`}
                  </p>
                </div>

                {/* Section : Montants */}
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Montants
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <OcrField label="HT (TND)" value={form.subtotal_ht}
                      confidence={conf.subtotal_ht} onChange={upd('subtotal_ht')} type="number" />
                    <OcrField label="TVA (TND)" value={form.tax_amount}
                      confidence={conf.tax_amount} onChange={upd('tax_amount')} type="number" />
                    <OcrField label="Timbre (TND)" value={form.timbre_fiscal}
                      confidence={conf.timbre_fiscal} onChange={upd('timbre_fiscal')} type="number" />
                  </div>

                  {/* Total calculé */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
                    border: '1.5px solid #C4B5FD',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600 }}>Net TTC calculé</span>
                      <AIBadge text="Auto-calculé" />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5', fontFamily: 'monospace' }}>
                      {net.toFixed(3)} TND
                    </span>
                  </div>

                  {/* Alerte écart */}
                  {ocrData.net_amount.value && Math.abs(net - ocrData.net_amount.value) > 0.01 && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: '#92400E' }}>
                        <strong>Écart détecté :</strong> L'IA a lu {ocrData.net_amount.value.toFixed(3)} TND, le calcul donne {net.toFixed(3)} TND. Vérifiez les montants.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('upload')}
                  style={{ padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', background: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 500 }}>
                  <RefreshCw size={15} /> Nouveau scan
                </button>
                <button onClick={handleCreate} disabled={create.isPending}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, cursor: create.isPending ? 'not-allowed' : 'pointer', border: 'none',
                    background: create.isPending ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: create.isPending ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                    transition: 'all 0.2s',
                  }}>
                  <Zap size={16} />
                  {create.isPending ? 'Création...' : 'Créer la facture'}
                  {!create.isPending && <ChevronRight size={16} />}
                </button>
              </div>
            </>
          )}

          {/* ── Étape 3 : Succès ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                border: '2px solid #86EFAC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={36} color="#16A34A" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: '#1F2937' }}>Facture créée !</h3>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>
                La facture a été créée avec succès avec un <strong style={{ color: '#4F46E5' }}>numéro auto-généré</strong>
              </p>
              <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 28 }}>
                Extraite automatiquement par IA en {ocrData?.processing_time_ms}ms
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => { setStep('upload'); setOcrData(null); setForm({ invoice_date: '', supplier_id: '', subtotal_ht: '', tax_amount: '', timbre_fiscal: '1.000', net_amount: '', receipt_url: '' }); }}
                  style={{ padding: '11px 20px', border: '1.5px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  Importer une autre
                </button>
                <button onClick={onClose}
                  style={{ padding: '11px 24px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  Fermer
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}