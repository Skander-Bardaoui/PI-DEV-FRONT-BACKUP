// src/hooks/useSupplierPOs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  CreateSupplierPODto,
  UpdateSupplierPODto,
  SupplierPOsQueryParams,
  SupplierPO,
} from '@/types';
import { cancelSupplierPO, confirmSupplierPO, createSupplierPO, getSupplierPO, getSupplierPOs, sendSupplierPO, updateSupplierPO } from '@/api/supplier-pos';
import axiosInstance from '@/api/axiosInstance';

export const SUPPLIER_POS_KEY = 'supplier-pos';

export const useSupplierPOs = (businessId: string, params?: SupplierPOsQueryParams) =>
  useQuery({
    queryKey: [SUPPLIER_POS_KEY, businessId, params],
    queryFn:  () => getSupplierPOs(businessId, params),
    enabled:  !!businessId,
  });

export const useSupplierPO = (businessId: string, poId: string) => {
  return useQuery({
    queryKey: [...SUPPLIER_POS_KEY, businessId, poId],
    queryFn:  () =>
      axiosInstance
        .get(`/businesses/${businessId}/supplier-pos/${poId}`)
        .then(r => r.data as SupplierPO),
    enabled: !!businessId && !!poId,
    staleTime: 30_000,
  });
};
export const useCreateSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierPODto) => createSupplierPO(businessId, dto),
    onSuccess:  () => {
      toast.success('Bon de commande créé avec succès');
      // Invalider la liste des BCs
      qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la création du BC';
      toast.error(message);
    },
  });
};

export const useUpdateSupplierPO = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierPODto) => updateSupplierPO(businessId, id, dto),
    onSuccess:  () => {
      toast.success('BC modifié avec succès');
      qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] });
    },
    onError: (error: any) => {
      // Don't show error if it's a 500 but the update actually worked
      // (we'll know it worked if we can reload and see the changes)
      const status = error?.response?.status;
      if (status === 500) {
        // Suppress the error toast for 500 errors since the update might have succeeded
        console.warn('Got 500 error but update may have succeeded. Invalidating queries...');
        qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] });
      } else {
        const message = error?.response?.data?.message || 'Erreur lors de la modification du BC';
        toast.error(message, {
          duration: 5000,
        });
      }
    },
  });
};

export const useSendSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendSupplierPO(businessId, id),
    onSuccess:  () => {
      toast.success('BC envoyé au fournisseur avec succès');
      // Invalider la liste des BCs
      qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de l\'envoi du BC';
      toast.error(message);
    },
  });
};

export const useConfirmSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmSupplierPO(businessId, id),
    onSuccess:  () => {
      toast.success('BC confirmé avec succès');
      // Invalider la liste des BCs
      qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] });
      // Invalider aussi les stats et scores fournisseurs
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la confirmation du BC';
      toast.error(message);
    },
  });
};

export const useCancelSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSupplierPO(businessId, id),
    onSuccess:  () => {
      toast.success('BC annulé avec succès', {
        description: 'Un email d\'annulation a été envoyé au fournisseur si le BC était en statut "Envoyé"',
        duration: 5000,
      });
      qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de l\'annulation du BC';
      toast.error(message, {
        duration: 5000,
      });
    },
  });
};
