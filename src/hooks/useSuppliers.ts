// src/hooks/useSuppliers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { SuppliersQueryParams, CreateSupplierDto, UpdateSupplierDto } from '@/types';
import { archiveSupplier, createSupplier, getSupplier, getSuppliers, restoreSupplier, updateSupplier } from '@/api/suppliers';

export const SUPPLIERS_KEY = 'suppliers';

export const useSuppliers = (businessId: string, params?: SuppliersQueryParams) =>
  useQuery({
    queryKey: [SUPPLIERS_KEY, businessId, params],
    queryFn:  () => getSuppliers(businessId, params),
    enabled:  !!businessId,
  });

export const useSupplier = (businessId: string, id: string) =>
  useQuery({
    queryKey: [SUPPLIERS_KEY, businessId, id],
    queryFn:  () => getSupplier(businessId, id),
    enabled:  !!businessId && !!id,
  });

export const useCreateSupplier = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupplierDto) => createSupplier(businessId, dto),
    onSuccess:  () => {
      toast.success('Fournisseur créé avec succès');
      // Invalider la liste des fournisseurs
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] });
      // Invalider aussi les rankings et scores
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la création du fournisseur';
      toast.error(message);
    },
  });
};

export const useUpdateSupplier = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierDto) => updateSupplier(businessId, id, dto),
    onSuccess:  () => {
      toast.success('Fournisseur modifié avec succès');
      // Invalider la liste des fournisseurs
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] });
      // Invalider aussi les rankings et scores
      qc.invalidateQueries({ queryKey: ['supplier-ranking', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-score', businessId, id] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la modification du fournisseur';
      toast.error(message);
    },
  });
};

export const useArchiveSupplier = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveSupplier(businessId, id),
    onSuccess:  (data) => {
      toast.success(data.message || 'Fournisseur archivé avec succès');
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de l\'archivage du fournisseur';
      toast.error(message, {
        duration: 5000, // Afficher plus longtemps pour les erreurs de validation
      });
    },
  });
};

export const useRestoreSupplier = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreSupplier(businessId, id),
    onSuccess:  () => {
      toast.success('Fournisseur restauré avec succès');
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la restauration du fournisseur';
      toast.error(message);
    },
  });
};