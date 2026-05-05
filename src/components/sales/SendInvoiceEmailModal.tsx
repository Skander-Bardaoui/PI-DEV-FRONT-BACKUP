// src/components/sales/SendInvoiceEmailModal.tsx
import { useState } from 'react';
import { X, Mail, Send, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useEmailDraft } from '../../hooks/useEmailDraft';
import { API_URL } from '@/config/api.config';

interface SendInvoiceEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  businessId: string;
  onSuccess?: () => void;
}

export default function SendInvoiceEmailModal({
  isOpen,
  onClose,
  invoice,
  businessId,
  onSuccess,
}: SendInvoiceEmailModalProps) {
  const [email, setEmail] = useState(invoice?.client?.email || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isReminder, setIsReminder] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAndSending, setIsGeneratingAndSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { generateDraft, isGenerating, error: draftError } = useEmailDraft();

  if (!isOpen) return null;

  const handleGenerateDraft = async () => {
    const draft = await generateDraft({
      businessId,
      invoiceId: invoice.id,
      isReminder,
      language,
    });

    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
    }
  };

  const handleGenerateAndSend = async () => {
    if (!email || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setIsGeneratingAndSending(true);
    setError(null);

    try {
      // Generate AI draft
      const draft = await generateDraft({
        businessId,
        invoiceId: invoice.id,
        isReminder,
        language,
      });

      if (!draft) {
        setError('Impossible de générer le brouillon');
        return;
      }

      // Send email immediately with AI-generated content
      const response = await fetch(
        `${API_URL}/businesses/${businessId}/invoices/${invoice.id}/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email,
            subject: draft.subject,
            body: draft.body,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération et l\'envoi');
    } finally {
      setIsGeneratingAndSending(false);
    }
  };

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/businesses/${businessId}/invoices/${invoice.id}/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Send cookies automatically

          body: JSON.stringify({ 
            email,
            subject: subject || undefined,  // Send custom subject if available
            body: body || undefined,        // Send custom body if available
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail(invoice?.client?.email || '');
    setSubject('');
    setBody('');
    setIsReminder(false);
    setLanguage('fr');
    setSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Envoyer la facture par email</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Invoice Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Facture:</span>
                <span className="font-semibold">{invoice?.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Client:</span>
                <span className="font-semibold">{invoice?.client?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Montant:</span>
                <span className="font-semibold text-indigo-600">
                  {Number(invoice?.net_amount || 0).toFixed(3)} TND
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email du destinataire
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSending || success}
              />
            </div>

            {/* AI Email Generator */}
            <div className="border border-purple-200 rounded-lg p-3 bg-gradient-to-br from-purple-50 to-pink-50 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <p className="font-semibold text-purple-900">Générer avec Gemini AI</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Type d'email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type d'email
                  </label>
                  <select
                    value={isReminder ? 'reminder' : 'first'}
                    onChange={(e) => setIsReminder(e.target.value === 'reminder')}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                  >
                    <option value="first">Premier envoi</option>
                    <option value="reminder">Rappel</option>
                  </select>
                </div>

                {/* Langue */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'ar')}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                  >
                    <option value="fr">🇫🇷 FR</option>
                    <option value="ar">🇹🇳 AR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-1.5 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Brouillon
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAndSend}
                  disabled={isGeneratingAndSending || isSending}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-1.5 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  {isGeneratingAndSending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
                      Générer & Envoyer
                    </>
                  )}
                </button>
              </div>

              {draftError && (
                <p className="text-red-600 text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {draftError}
                </p>
              )}
            </div>

            {/* Email Fields */}
            {(subject || body) && (
              <div className="space-y-2 border-t pt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objet de l'email
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Objet de l'email..."
                    disabled={isSending || success}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corps du message
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Corps de l'email..."
                    disabled={isSending || success}
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Email envoyé avec succès!</p>
                  <p className="text-sm text-green-700">
                    La facture a été envoyée à {email}
                  </p>
                </div>
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

            {/* Info */}
            {!success && !subject && !body && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  💡 Utilisez l'IA pour générer automatiquement un email professionnel, ou la facture sera envoyée avec un email standard.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-3 border-t mt-4">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSending}
              >
                {success ? 'Fermer' : 'Annuler'}
              </button>
              
              {!success && (
                <button
                  onClick={handleSend}
                  disabled={isSending || !email}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
