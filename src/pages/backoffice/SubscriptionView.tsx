// src/pages/backoffice/SubscriptionView.tsx
import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SubscriptionInfo {
  plan: {
    name: string;
    slug: string;
    ai_enabled: boolean;
    price_monthly: number;
    price_annual: number;
  };
  subscription: {
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
    trial_ends_at?: string;
    created_at: string;
  };
  tenant: {
    id: string;
    name: string;
  };
}

export default function SubscriptionView() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });

      if (response.data.tenant && response.data.plan) {
        setSubscriptionInfo({
          plan: response.data.plan,
          subscription: response.data.tenant.subscription,
          tenant: {
            id: response.data.tenant.id,
            name: response.data.tenant.name,
          },
        });
      }
    } catch (error) {
      console.error('Error loading subscription info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!subscriptionInfo?.subscription) return null;

    const { trial_ends_at, current_period_end, status } = subscriptionInfo.subscription;
    
    // For free plans, use trial_ends_at
    // For paid plans, use current_period_end
    const endDate = trial_ends_at || current_period_end;
    
    if (!endDate) return null;

    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: 'Actif',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      trial: {
        label: 'Période d\'essai',
        icon: Clock,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      expired: {
        label: 'Expiré',
        icon: AlertCircle,
        className: 'bg-red-100 text-red-800 border-red-200',
      },
      cancelled: {
        label: 'Annulé',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const getPlanBadge = (slug: string, aiEnabled: boolean) => {
    const planConfig = {
      free: {
        label: 'Gratuit',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
      },
      standard: {
        label: 'Standard',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      premium: {
        label: 'Premium',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      },
    };

    const config = planConfig[slug as keyof typeof planConfig] || planConfig.free;

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
          {config.label}
        </span>
        {aiEnabled && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
            <Sparkles className="h-3 w-3" />
            IA
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!subscriptionInfo) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune information d'abonnement
          </h3>
          <p className="text-gray-500">
            Impossible de charger les informations de votre abonnement.
          </p>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining();
  const { plan, subscription } = subscriptionInfo;

  return (
    <div className="space-y-6">
      {/* Plan Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Votre abonnement</h2>

        <div className="space-y-6">
          {/* Plan Name & Status */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-2">Plan actuel</p>
              {getPlanBadge(plan.slug, plan.ai_enabled)}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">Statut</p>
              {getStatusBadge(subscription.status)}
            </div>
          </div>

          {/* Days Remaining */}
          {daysRemaining !== null && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Clock className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-indigo-600 font-medium mb-1">
                    Temps restant
                  </p>
                  <p className="text-3xl font-bold text-indigo-900">
                    {daysRemaining > 0 ? (
                      <>
                        {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                      </>
                    ) : (
                      <span className="text-red-600">Expiré</span>
                    )}
                  </p>
                  {daysRemaining > 0 && daysRemaining <= 7 && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Votre abonnement expire bientôt
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Cycle de facturation
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-gray-900 font-medium">
                  {subscription.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Date de début
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-gray-900 font-medium">
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {subscription.trial_ends_at ? 'Fin de la période d\'essai' : 'Fin de la période'}
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-gray-900 font-medium">
                  {formatDate(subscription.trial_ends_at || subscription.current_period_end)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Membre depuis
                </div>
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-gray-900 font-medium">
                  {formatDate(subscription.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          {plan.ai_enabled && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">
                    Fonctionnalités IA activées
                  </h3>
                  <p className="text-sm text-purple-700">
                    Vous avez accès à toutes les fonctionnalités d'intelligence artificielle : 
                    prédictions ML, OCR, recommandations intelligentes, et plus encore.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
