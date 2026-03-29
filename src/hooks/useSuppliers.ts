// src/hooks/useSuppliers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] }),
  });
};

export const useUpdateSupplier = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierDto) => updateSupplier(businessId, id, dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] }),
  });
};

export const useArchiveSupplier = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveSupplier(businessId, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] }),
  });
};

export const useRestoreSupplier = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreSupplier(businessId, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY, businessId] }),
  });
};