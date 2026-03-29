// src/hooks/useSupplierPOs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] }),
  });
};

export const useUpdateSupplierPO = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSupplierPODto) => updateSupplierPO(businessId, id, dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] }),
  });
};

export const useSendSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendSupplierPO(businessId, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] }),
  });
};

export const useConfirmSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmSupplierPO(businessId, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] }),
  });
};

export const useCancelSupplierPO = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSupplierPO(businessId, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [SUPPLIER_POS_KEY, businessId] }),
  });
};
