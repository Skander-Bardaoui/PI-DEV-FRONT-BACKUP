// src/pages/SupplierRegisterPage.tsx
// Page publique — le fournisseur remplit sa fiche d'inscription
// Accessible via /supplier-register?token=xxx

import { useState, useEffect } from 'react';
import { useSearchParams }      from 'react-router-dom';
import {
  Building2, Mail, Phone, MapPin, CreditCard, FileText,
  CheckCircle, AlertTriangle, ChevronRight, ChevronLeft,
  User, Banknote, Tag, Clock, Sparkles,
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvitationData {
  email:         string;
  name?:         string;
  business_name: string;
}

interface FormData {
  name:             string;
  phone:            string;
  matricule_fiscal: string;
  rib:              string;
  bank_name:        string;
  category:         string;
  payment_terms:    string;
  notes:            string;
  address: {
    street:      string;
    city:        string;
    postal_code: string;
    country:     string;
  };
}

// ─── Étapes du formulaire ─────────────────────────────────────────────────────
const STEPS = [
  { id: 'identity',  label: 'Identité',   icon: User       },
  { id: 'contact',   label: 'Contact',    icon: Phone      },
  { id: 'banking',   label: 'Bancaire',   icon: Banknote   },
  { id: 'commercial',label: 'Commercial', icon: Tag        },
];

const BANKS_TN = [
  'STB', 'BNA', 'BIAT', 'Attijari Bank', 'UIB', 'BH Bank',
  'Amen Bank', 'ABC Bank', 'Arab Tunisian Bank', 'Zitouna Bank',
  'Al Baraka Bank', 'QNB Tunisie', 'Wifak International Bank', 'Autre',
];

const CATEGORIES = [
  'Fournitures de bureau', 'Matières premières', 'Équipements',
  'Services informatiques', 'Logistique & Transport', 'Maintenance',
  'Marketing & Communication', 'Consulting', 'Formation', 'Autre',
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function SupplierRegisterPage() {
  const [params]       = useSearchParams();
  const token          = params.get('token') ?? '';

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [fieldErrors,setFieldErrors]= useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    name: '', phone: '', matricule_fiscal: '',
    rib: '', bank_name: '', category: '',
    payment_terms: '30', notes: '',
    address: { street: '', city: '', postal_code: '', country: 'Tunisie' },
  });

  useEffect(() => {
    if (!token) { setError('Lien invalide.'); setLoading(false); return; }
    axiosInstance.get(`/businesses/any/supplier-onboarding/invitation/${token}`)
      .then(r => {
        setInvitation(r.data);
        if (r.data.name) setForm(f => ({ ...f, name: r.data.name }));
        setLoading(false);
      })
      .catch(e => {
        setError(e?.response?.data?.message ?? 'Lien invalide ou expiré.');
        setLoading(false);
      });
  }, [token]);

  const set = (field: keyof FormData, val: string) =>
    setForm(f => ({ ...f, [field]: val }));

  const setAddr = (field: keyof FormData['address'], val: string) =>
    setForm(f => ({ ...f, address: { ...f.address, [field]: val } }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0 && !form.name.trim()) errs.name = 'Nom obligatoire';
    if (step === 0 && form.matricule_fiscal && !/^.{5,30}$/.test(form.matricule_fiscal))
      errs.matricule_fiscal = 'Format invalide';
    if (step === 1 && form.phone && !/^[+]?[\d\s\-().]{8,20}$/.test(form.phone))
      errs.phone = 'Numéro invalide';
    if (step === 2 && form.rib && !/^[A-Z0-9\s]{10,30}$/.test(form.rib.replace(/\s/g, '')))
      errs.rib = 'Format RIB invalide';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/businesses/any/supplier-onboarding/invitation/${token}/complete`,
        {
          name:             form.name.trim(),
          phone:            form.phone || undefined,
          matricule_fiscal: form.matricule_fiscal || undefined,
          rib:              form.rib || undefined,
          bank_name:        form.bank_name || undefined,
          category:         form.category || undefined,
          payment_terms:    parseInt(form.payment_terms) || 30,
          notes:            form.notes || undefined,
          address: Object.values(form.address).some(v => v)
            ? form.address : undefined,
        },
      );
      setDone(true);
    } catch (e: any) {
      setFieldErrors({ submit: e?.response?.data?.message ?? 'Erreur lors de l\'inscription.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── États de chargement ────────────────────────────────────────────────────
  if (loading) return (
    <PageShell>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E5E7EB', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: 14 }}>Chargement de votre invitation...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </PageShell>
  );

  if (error) return (
    <PageShell>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 60, height: 60, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={28} color="#EF4444" />
        </div>
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Lien invalide</h2>
        <p style={{ color: '#6B7280', fontSize: 14, maxWidth: 300, margin: '0 auto' }}>{error}</p>
      </div>
    </PageShell>
  );

  // ── Succès ────────────────────────────────────────────────────────────────
  if (done) return (
    <PageShell businessName={invitation?.business_name}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#EAF3DE,#DCFCE7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} color="#16A34A" />
          </div>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 24, height: 24, background: '#FCD34D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            ✨
          </div>
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
          Bienvenue, {form.name} !
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 24px' }}>
          Votre fiche fournisseur a été créée avec succès.<br />
          <strong>{invitation?.business_name}</strong> peut maintenant vous envoyer
          des bons de commande par email.
        </p>
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left', maxWidth: 340, margin: '0 auto 24px' }}>
          {[
            { icon: '📧', label: 'Bons de commande',  desc: 'Vous recevrez les BC par email avec un lien de confirmation' },
            { icon: '🔍', label: 'Portail fournisseur',desc: 'Accédez à vos commandes et paiements en ligne' },
            { icon: '📄', label: 'Factures',           desc: 'Envoyez vos factures directement par email' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#166534' }}>{item.label}</p>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: '#4B7A53' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>
          Vous pouvez fermer cette page. Vous recevrez un email pour chaque bon de commande.
        </p>
      </div>
    </PageShell>
  );

  // ── Formulaire principal ───────────────────────────────────────────────────
  const currentStep = STEPS[step];

  return (
    <PageShell businessName={invitation?.business_name}>
      {/* Bannière invitation */}
      <div style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', padding: '16px 24px', borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Sparkles size={16} color="#E0E7FF" />
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invitation de</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
              {invitation?.business_name}
            </p>
          </div>
        </div>
        <p style={{ margin: '0', fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
          Bonjour{invitation?.name ? ` ${invitation.name}` : ''} — Complétez votre fiche fournisseur en 4 étapes simples.
        </p>
      </div>

      {/* Stepper */}
      <div style={{ padding: '16px 24px 0', background: '#FAFBFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive   = i === step;
            const isComplete = i < step;
            return (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: 16, left: '55%', right: '-45%', height: 2,
                    background: isComplete ? '#4F46E5' : '#E5E7EB', transition: 'background .3s' }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isComplete ? '#4F46E5' : isActive ? '#EEF2FF' : '#F3F4F6',
                  border: `2px solid ${isComplete || isActive ? '#4F46E5' : '#E5E7EB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1, transition: 'all .3s',
                }}>
                  {isComplete
                    ? <CheckCircle size={14} color="#fff" />
                    : <Icon size={14} color={isActive ? '#4F46E5' : '#9CA3AF'} />}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#4F46E5' : isComplete ? '#374151' : '#9CA3AF' }}>
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
        <div style={{ height: 12 }} />
      </div>

      {/* Contenu de l'étape */}
      <div style={{ padding: '20px 24px' }}>

        {/* Étape 0 — Identité */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <StepTitle icon={<User size={16} />} title="Identité de votre entreprise"
              subtitle="Ces informations apparaîtront sur les bons de commande" />
            <Field label="Nom de l'entreprise *" error={fieldErrors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="SARL Ali Commerce, Entreprise Hassan..."
                style={inp(!!fieldErrors.name)} />
            </Field>
            <Field label="Matricule fiscal" hint="Format tunisien : 1234567A/P/A/000">
              <input value={form.matricule_fiscal} onChange={e => set('matricule_fiscal', e.target.value)}
                placeholder="1234567A/P/A/000"
                style={inp(!!fieldErrors.matricule_fiscal)} />
            </Field>
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#6B7280' }}>
              📧 Email enregistré : <strong>{invitation?.email}</strong>
            </div>
          </div>
        )}

        {/* Étape 1 — Contact */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <StepTitle icon={<Phone size={16} />} title="Coordonnées de contact"
              subtitle="Pour recevoir les bons de commande et notifications" />
            <Field label="Téléphone" error={fieldErrors.phone}>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+216 71 123 456"
                style={inp(!!fieldErrors.phone)} />
            </Field>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} /> Adresse (optionnel)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={form.address.street} onChange={e => setAddr('street', e.target.value)}
                  placeholder="Rue / Avenue" style={inp()} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={form.address.city} onChange={e => setAddr('city', e.target.value)}
                    placeholder="Ville" style={inp()} />
                  <input value={form.address.postal_code} onChange={e => setAddr('postal_code', e.target.value)}
                    placeholder="Code postal" style={inp()} />
                </div>
                <input value={form.address.country} onChange={e => setAddr('country', e.target.value)}
                  placeholder="Pays" style={inp()} />
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 — Bancaire */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <StepTitle icon={<Banknote size={16} />} title="Coordonnées bancaires"
              subtitle="Pour recevoir vos paiements" />
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400E', display: 'flex', gap: 8 }}>
              <span>🔒</span>
              <span>Vos informations bancaires sont chiffrées et sécurisées. Elles ne seront utilisées que pour vos paiements avec <strong>{invitation?.business_name}</strong>.</span>
            </div>
            <Field label="RIB" hint="Ex: TN59 1234 5678 9012 3456 7890" error={fieldErrors.rib}>
              <input value={form.rib} onChange={e => set('rib', e.target.value)}
                placeholder="TN59 XXXX XXXX XXXX XXXX XXXX"
                style={inp(!!fieldErrors.rib)} />
            </Field>
            <Field label="Banque">
              <select value={form.bank_name} onChange={e => set('bank_name', e.target.value)}
                style={{ ...inp(), color: form.bank_name ? '#111' : '#9CA3AF' }}>
                <option value="">Sélectionnez votre banque</option>
                {BANKS_TN.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* Étape 3 — Commercial */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <StepTitle icon={<Tag size={16} />} title="Informations commerciales"
              subtitle="Pour mieux vous classer dans le système" />
            <Field label="Catégorie d'activité">
              <select value={form.category} onChange={e => set('category', e.target.value)}
                style={{ ...inp(), color: form.category ? '#111' : '#9CA3AF' }}>
                <option value="">Sélectionnez une catégorie</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Délai de paiement souhaité (jours)" hint="Par défaut : 30 jours">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {['15', '30', '45', '60'].map(d => (
                  <button key={d} onClick={() => set('payment_terms', d)}
                    style={{ padding: '10px 0', border: `2px solid ${form.payment_terms === d ? '#4F46E5' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: form.payment_terms === d ? '#EEF2FF' : '#fff', fontWeight: form.payment_terms === d ? 700 : 400, color: form.payment_terms === d ? '#4F46E5' : '#374151', fontSize: 14 }}>
                    {d}j
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notes (optionnel)" hint="Informations complémentaires pour votre client">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Horaires de livraison, contacts spécifiques..."
                rows={3}
                style={{ ...inp(), resize: 'none' }} />
            </Field>

            {/* Récap avant envoi */}
            <div style={{ background: '#F8F9FF', border: '1px solid #E0E7FF', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>
                ✅ Récapitulatif de votre fiche
              </p>
              {[
                { label: 'Entreprise',    val: form.name },
                { label: 'Email',         val: invitation?.email },
                { label: 'Téléphone',     val: form.phone || '—' },
                { label: 'MF',            val: form.matricule_fiscal || '—' },
                { label: 'RIB',           val: form.rib || '—' },
                { label: 'Banque',        val: form.bank_name || '—' },
                { label: 'Catégorie',     val: form.category || '—' },
                { label: 'Délai paiement',val: `${form.payment_terms} jours` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, borderBottom: '1px solid #E0E7FF' }}>
                  <span style={{ color: '#6B7280' }}>{r.label}</span>
                  <span style={{ fontWeight: 500, color: '#111', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.val}</span>
                </div>
              ))}
            </div>

            {fieldErrors.submit && (
              <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#991B1B' }}>
                {fieldErrors.submit}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 8, borderTop: '1px solid #F3F4F6' }}>
        {step > 0 && (
          <button onClick={prev}
            style={{ padding: '11px 18px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
            <ChevronLeft size={15} /> Retour
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={next}
            style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Continuer <ChevronRight size={15} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            style={{ flex: 1, padding: '11px', background: submitting ? '#A5B4FC' : 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', border: 'none', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting
              ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Enregistrement...</>
              : <><CheckCircle size={16} />Créer ma fiche fournisseur</>}
          </button>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageShell>
  );
}

// ─── Composants helpers ────────────────────────────────────────────────────────

function PageShell({ children, businessName }: { children: React.ReactNode; businessName?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 50%,#EDE9FE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo plateforme */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', padding: '8px 16px', borderRadius: 20, boxShadow: '0 2px 8px rgba(79,70,229,0.15)' }}>
            <Building2 size={18} color="#4F46E5" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>NovaEntra</span>
          </div>
        </div>
        {/* Carte principale */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(79,70,229,0.12)', overflow: 'hidden' }}>
          {children}
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#9CA3AF' }}>
          Plateforme sécurisée — Vos données sont protégées
        </p>
      </div>
    </div>
  );
}

function StepTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{ color: '#4F46E5' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>{subtitle}</p>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: error ? '#DC2626' : '#374151', marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {hint && !error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>{hint}</p>}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

const inp = (hasError = false) => ({
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${hasError ? '#FCA5A5' : '#E5E7EB'}`,
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
  background: '#fff',
});