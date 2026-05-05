import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';

interface EmailDraftParams {
  businessId: string;
  invoiceId: string;
  isReminder?: boolean;   // false = 1er envoi, true = rappel
  language?: 'fr' | 'ar';
}

interface DraftResult {
  subject: string;
  body: string;
}

export function useEmailDraft() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDraft = async (params: EmailDraftParams): Promise<DraftResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await axiosInstance.post(
        `/businesses/${params.businessId}/invoices/${params.invoiceId}/generate-email-draft`,
        {
          isReminder: params.isReminder || false,
          language: params.language || 'fr',
        }
      );

      return response.data;

    } catch (err: any) {
      console.error('Error generating email draft:', err);
      setError(
        err.response?.data?.message || 
        'Impossible de générer le brouillon. Vérifiez votre connexion.'
      );
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateDraft, isGenerating, error };
}
