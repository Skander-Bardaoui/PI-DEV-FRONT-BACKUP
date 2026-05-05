import { useState } from 'react';
import {
  Building2,
  User,
  Building,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ProfileSettings from './ProfileSettings';
import BusinessManagement from './BusinessManagement';
import BusinessView from './BusinessView';
import TenantSettings from './TenantSettings';
import TenantView from './TenantView';
import SubscriptionView from './SubscriptionView';

const tabs = [
  { id: 'profile', label: 'Mon Profil', icon: User },
  { id: 'business', label: 'Mes Entreprises', icon: Building2 },
  { id: 'tenant', label: 'Mon Organisation', icon: Building },
  { id: 'subscription', label: 'Mon Abonnement', icon: CreditCard, ownerOnly: true },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Check if user is BUSINESS_OWNER
  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => !tab.ownerOnly || isBusinessOwner);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500">Gérez votre profil, vos entreprises et votre organisation</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <nav className="p-2">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'business' && (
            isBusinessOwner ? <BusinessManagement /> : <BusinessView />
          )}
          {activeTab === 'tenant' && (
            isBusinessOwner ? <TenantSettings /> : <TenantView />
          )}
          {activeTab === 'subscription' && isBusinessOwner && <SubscriptionView />}
        </div>
      </div>
    </div>
  );
}
