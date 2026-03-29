// src/pages/backoffice/TenantView.tsx
import { useState, useEffect } from 'react';
import { Loader2, Building2, Mail, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getMyTenant } from '../../api/tenant.api';

export default function TenantView() {
  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      const data = await getMyTenant();
      setTenant(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement du tenant');
      console.error('Error loading tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune organisation trouvée
        </h3>
        <p className="text-gray-500">
          Vous n'êtes pas associé à une organisation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Logo de l'organisation</h2>
        
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-gray-200">
            {tenant?.logoUrl ? (
              <img
                src={`http://localhost:3001${tenant.logoUrl}`}
                alt="Logo"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Building2 className="h-12 w-12 text-indigo-400" />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
            <p className="text-sm text-gray-500 mt-1">Logo de l'organisation</p>
          </div>
        </div>
      </div>

      {/* Tenant Information Card (Read-only) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations de l'organisation</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Nom de l'organisation</p>
            </div>
            <p className="text-base font-semibold text-gray-900 ml-11">
              {tenant.name || '-'}
            </p>
          </div>

          {/* Domain */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Domaine</p>
            </div>
            <p className="text-base font-semibold text-gray-900 ml-11">
              {tenant.domain || '-'}
            </p>
          </div>

          {/* Contact Email */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Email de contact</p>
            </div>
            <p className="text-base font-semibold text-gray-900 ml-11">
              {tenant.contactEmail || '-'}
            </p>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Description</p>
            </div>
            <p className="text-base text-gray-900 ml-11">
              {tenant.description || '-'}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Information:</span> Seul le propriétaire de l'organisation peut modifier ces informations.
          </p>
        </div>
      </div>
    </div>
  );
}
