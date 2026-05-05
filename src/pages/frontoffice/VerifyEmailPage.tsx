// src/pages/frontoffice/VerifyEmailPage.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, XCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setError('Token de vérification manquant');
      setIsLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post('/auth/verify-email', { token });
      setIsSuccess(true);
      toast.success('Email vérifié avec succès !');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Token invalide ou expiré';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative inline-block mb-6">
            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
            <Sparkles className="h-6 w-6 text-purple-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-gray-600 text-lg font-medium">Vérification de votre email...</p>
          <p className="text-gray-400 text-sm mt-2">Veuillez patienter un instant</p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              NovEntra
            </span>
          </Link>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="relative inline-block mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Email vérifié ! 🎉</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Votre adresse email a été vérifiée avec succès. Vous allez être redirigé vers votre tableau de bord...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirection en cours...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            NovEntra
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          <div className="relative inline-block mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Vérification échouée</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
