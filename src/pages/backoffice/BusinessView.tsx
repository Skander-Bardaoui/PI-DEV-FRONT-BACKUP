// src/pages/backoffice/BusinessView.tsx
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
} from 'lucide-react';
import { getMyBusinesses } from '../../api/business.api';
import { toast } from 'sonner';
import { getAssetUrl } from '@/config/api.config';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface Business {
  id: string;
  name: string;
  logo?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  currency?: string;
  tax_rate?: number;
  address?: Address;
}

export default function BusinessView() {
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await getMyBusinesses();
      setBusinesses(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des entreprises');
      console.error('Error loading businesses:', error);
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

  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune entreprise
        </h3>
        <p className="text-gray-500">
          Vous n'êtes pas associé à une entreprise
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Mon Entreprise</h2>
        <p className="text-sm text-gray-500">Informations de votre entreprise</p>
      </div>

      {/* Business Cards (Read-only) */}
      <div className="space-y-4">
        {businesses.map((business) => (
          <div
            key={business.id}
            className="bg-white rounded-2xl border border-gray-200 p-8"
          >
            {/* Header with Logo */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-gray-100 shadow-sm">
                  {business.logo ? (
                    <img
                      src={getAssetUrl(business.logo)}
                      alt={business.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {business.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {business.name}
                </h3>
                {business.tax_id && (
                  <p className="text-sm text-gray-500">
                    Matricule Fiscal: {business.tax_id}
                  </p>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {business.email && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      <Mail className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900 ml-11 truncate">
                    {business.email}
                  </p>
                </div>
              )}

              {business.phone && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Téléphone</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900 ml-11">
                    {business.phone}
                  </p>
                </div>
              )}

              {business.currency && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      <DollarSign className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Devise</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900 ml-11">
                    {business.currency}
                  </p>
                </div>
              )}

              {business.tax_rate !== null && business.tax_rate !== undefined && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Taux de TVA</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900 ml-11">
                    {business.tax_rate}%
                  </p>
                </div>
              )}

              {business.address?.city && (
                <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      <MapPin className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Adresse</p>
                  </div>
                  <p className="text-base text-gray-900 ml-11">
                    {business.address.street && `${business.address.street}, `}
                    {business.address.postal_code && `${business.address.postal_code} `}
                    {business.address.city}
                    {business.address.state && `, ${business.address.state}`}
                    {business.address.country && ` - ${business.address.country}`}
                  </p>
                </div>
              )}
            </div>

            {/* Info Banner */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Information:</span> Seul le propriétaire de l'organisation peut modifier ces informations.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
