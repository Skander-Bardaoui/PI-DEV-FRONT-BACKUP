// src/pages/console/PlansManagementPage.tsx
import { useState, useEffect } from 'react';
import { 
  Shield, 
  LogOut, 
  CreditCard, 
  Edit2, 
  Lock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { usePlatformAdmin } from '../../hooks/usePlatformAdmin';
import { 
  getPlatformPlans, 
  updatePlatformPlan, 
  seedPlatformPlans,
  Plan,
  UpdatePlanDto 
} from '../../api/platform-admin.api';

export default function PlansManagementPage() {
  const { admin, logout } = usePlatformAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [editFormData, setEditFormData] = useState<UpdatePlanDto>({
    name: '',
    price_monthly: 0,
    price_annual: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedPlans = await getPlatformPlans();
      setPlans(fetchedPlans);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPlans = async () => {
    setSeeding(true);
    setError('');
    setSuccess('');
    try {
      await seedPlatformPlans();
      setSuccess('Default plans created successfully!');
      await fetchPlans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to seed plans');
    } finally {
      setSeeding(false);
    }
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setEditFormData({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_annual: plan.price_annual,
      is_active: plan.is_active,
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPlan(null);
    setEditFormData({
      name: '',
      price_monthly: 0,
      price_annual: 0,
      is_active: true,
    });
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    setError('');
    setSuccess('');

    try {
      await updatePlatformPlan(editingPlan.id, editFormData);
      setSuccess(`Plan "${editFormData.name}" updated successfully!`);
      await fetchPlans();
      closeEditModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update plan');
    }
  };

  // Get plan features based on slug
  const getPlanFeatures = (slug: string, aiEnabled: boolean, trialDays?: number) => {
    switch (slug) {
      case 'free':
        return {
          badge: { text: 'Gratuit', color: 'bg-green-500' },
          features: [
            { icon: '✅', text: 'Accès complet à la plateforme' },
            { icon: '✅', text: 'Toutes les fonctionnalités' },
            { icon: '⏱', text: `Durée: ${trialDays || 7} jours` },
            { icon: '❌', text: 'IA non incluse' },
          ]
        };
      case 'standard':
        return {
          badge: { text: 'Standard', color: 'bg-blue-500' },
          features: [
            { icon: '✅', text: 'Accès complet à la plateforme' },
            { icon: '✅', text: 'Toutes les fonctionnalités' },
            { icon: '❌', text: 'IA non incluse' },
          ]
        };
      case 'premium':
        return {
          badge: { text: 'Premium', color: 'bg-purple-500' },
          features: [
            { icon: '✅', text: 'Accès complet à la plateforme' },
            { icon: '✅', text: 'Toutes les fonctionnalités' },
            { icon: aiEnabled ? '✅' : '❌', text: 'IA illimitée incluse' },
          ]
        };
      default:
        return {
          badge: { text: slug, color: 'bg-gray-500' },
          features: []
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Platform Console</h1>
                <p className="text-sm text-purple-200">Plans Management</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Plans Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Subscription Plans</h2>
              <p className="text-purple-200">Manage pricing and plan configurations</p>
            </div>
            <button
              onClick={fetchPlans}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Empty State - Seed Plans */}
        {!loading && plans.length === 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
            <CreditCard className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Plans Found</h3>
            <p className="text-purple-200 mb-6">
              Create the default plans (Free, Standard, Premium) to get started.
            </p>
            <button
              onClick={handleSeedPlans}
              disabled={seeding}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              {seeding ? 'Creating Plans...' : 'Create Default Plans'}
            </button>
          </div>
        )}

        {/* Plans Grid */}
        {!loading && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const planFeatures = getPlanFeatures(plan.slug, plan.ai_enabled, plan.trial_days);
              
              return (
                <div
                  key={plan.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all"
                >
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <span className={`${planFeatures.badge.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                        {planFeatures.badge.text}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      plan.is_active 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-purple-300">
                        {plan.price_monthly.toFixed(3)}
                      </span>
                      <span className="text-purple-200">TND/mois</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-purple-300">
                        {plan.price_annual.toFixed(3)}
                      </span>
                      <span className="text-purple-200">TND/an</span>
                    </div>
                  </div>

                  {/* Features (Locked) */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-purple-300" />
                      <span className="text-sm font-semibold text-purple-200">Features (Fixed)</span>
                    </div>
                    <ul className="space-y-2">
                      {planFeatures.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-purple-100">
                          <span>{feature.icon}</span>
                          <span>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Status */}
                  <div className="mb-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${plan.ai_enabled ? 'text-yellow-400' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-purple-200">
                        AI Access: {plan.ai_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {plan.trial_days && (
                      <div className="mt-2 text-xs text-purple-300">
                        Trial: {plan.trial_days} days
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(plan)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Plan
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-purple-500/50 p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Edit Plan</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Plan name"
                />
              </div>

              {/* Monthly Price */}
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Monthly Price (TND)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={editFormData.price_monthly}
                  onChange={(e) => setEditFormData({ ...editFormData, price_monthly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="0.000"
                />
              </div>

              {/* Annual Price */}
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">
                  Annual Price (TND)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={editFormData.price_annual}
                  onChange={(e) => setEditFormData({ ...editFormData, price_annual: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="0.000"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm font-semibold text-purple-200">Active</span>
                <button
                  onClick={() => setEditFormData({ ...editFormData, is_active: !editFormData.is_active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    editFormData.is_active ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    editFormData.is_active ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-purple-300 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-200">
                    Features, AI access, and trial days are fixed and cannot be modified. Only name, prices, and active status can be changed.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdatePlan}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={closeEditModal}
                className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
