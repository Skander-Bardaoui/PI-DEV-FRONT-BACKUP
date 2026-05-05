// src/pages/backoffice/TenantSettings.tsx
import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Loader2, Building2, Mail, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ImageCropModal from '../../components/profile/ImageCropModal';
import imageCompression from 'browser-image-compression';
import { getMyTenant, updateMyTenant, uploadTenantLogo } from '../../api/tenant.api';
import { getAssetUrl } from '@/config/api.config';

export default function TenantSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tenant, setTenant] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contactEmail: '',
    description: '',
  });

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      const data = await getMyTenant();
      setTenant(data);
      setFormData({
        name: data.name || '',
        domain: data.domain || '',
        contactEmail: data.contactEmail || '',
        description: data.description || '',
      });
    } catch (error: any) {
      toast.error('Erreur lors du chargement du tenant');
      console.error('Error loading tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateMyTenant(formData);
      await loadTenant();
      toast.success('Tenant mis à jour avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      console.error('Error updating tenant:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setShowCropModal(false);
      setIsUploadingLogo(true);

      const compressedFile = await imageCompression(croppedBlob as File, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 200,
        useWebWorker: true,
      });

      await uploadTenantLogo(compressedFile);
      await loadTenant();
      toast.success('Logo mis à jour avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement du logo');
      console.error('Error uploading logo:', error);
    } finally {
      setIsUploadingLogo(false);
      setImageToCrop(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Logo de l'organisation</h2>
        
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-gray-200">
              {tenant?.logoUrl ? (
                <img
                  src={getAssetUrl(tenant.logoUrl)}
                  alt="Logo"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-indigo-400" />
                </div>
              )}
              
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            <button
              onClick={handleLogoClick}
              disabled={isUploadingLogo}
              className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div>
            <button
              onClick={handleLogoClick}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Changer le logo
            </button>
            <p className="text-sm text-gray-500 mt-2">PNG, JPG, SVG jusqu'à 5MB</p>
          </div>
        </div>
      </div>

      {/* Tenant Information */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations de l'organisation</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                Nom de l'organisation
              </div>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Nom de votre organisation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                Domaine
              </div>
            </label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Email de contact
              </div>
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="contact@example.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Description
              </div>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Description de votre organisation"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>

      {imageToCrop && (
        <ImageCropModal
          isOpen={showCropModal}
          imageSrc={imageToCrop}
          onClose={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
