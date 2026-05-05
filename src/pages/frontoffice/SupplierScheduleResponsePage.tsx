// src/pages/frontoffice/SupplierScheduleResponsePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

type Status = 'loading' | 'accepted' | 'rejected' | 'error';

export default function SupplierScheduleResponsePage() {
  const { token, action } = useParams<{ token: string; action: 'accept' | 'reject' }>();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') ?? undefined;

  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token || !action) return;

    // ✅ now hits the public controller — no businessId needed
    const url = action === 'accept'
      ? `/supplier-schedule/${token}/accept`
      : `/supplier-schedule/${token}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`;

    axiosInstance
      .get(url)
      .then(() => {
        setStatus(action === 'accept' ? 'accepted' : 'rejected');
      })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Une erreur est survenue.';
        if (msg.includes('ACTIVE')) {
          setStatus('accepted');
        } else if (msg.includes('REJECTED')) {
          setStatus('rejected');
        } else {
          setStatus('error');
          setErrorMsg(msg);
        }
      });
  }, [token, action]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-10 text-center">

        {/* LOADING */}
        {status === 'loading' && (
          <>
            <Loader2 className="h-14 w-14 text-indigo-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">
              Traitement en cours…
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Veuillez patienter quelques instants.
            </p>
          </>
        )}

        {/* ACCEPTED */}
        {status === 'accepted' && (
          <>
            <div className="flex items-center justify-center w-20 h-20 rounded-full
                            bg-green-100 mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Réponse enregistrée
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Vous avez <span className="font-semibold text-green-600">accepté</span> le
              plan de paiement échelonné. Les paiements seront effectués
              conformément au calendrier convenu.
            </p>
            <div className="mt-8 px-4 py-3 bg-green-50 border border-green-200
                            rounded-xl text-xs text-green-700">
              Vous pouvez fermer cette page en toute sécurité.
            </div>
          </>
        )}

        {/* REJECTED */}
        {status === 'rejected' && (
          <>
            <div className="flex items-center justify-center w-20 h-20 rounded-full
                            bg-red-100 mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Réponse enregistrée
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Vous avez <span className="font-semibold text-red-600">refusé</span> le
              plan de paiement échelonné. L'équipe sera notifiée
              de votre décision.
            </p>
            <div className="mt-8 px-4 py-3 bg-red-50 border border-red-200
                            rounded-xl text-xs text-red-700">
              Vous pouvez fermer cette page en toute sécurité.
            </div>
          </>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <>
            <div className="flex items-center justify-center w-20 h-20 rounded-full
                            bg-amber-100 mx-auto mb-6">
              <XCircle className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Lien invalide
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {errorMsg}
            </p>
            <div className="mt-8 px-4 py-3 bg-amber-50 border border-amber-200
                            rounded-xl text-xs text-amber-700">
              Ce lien est peut-être expiré ou déjà utilisé.
            </div>
          </>
        )}

      </div>
    </div>
  );
}
