// src/hooks/useSalesOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesOrdersQueryParams,
} from '@/types/sales-order';
import {
  getSalesOrders,
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  startProgressSalesOrder,
  markDeliveredSalesOrder,
  markInvoicedSalesOrder,
  cancelSalesOrder,
  sendSalesOrderEmail,
} from '@/api/sales-orders';

export const SALES_ORDERS_KEY = 'sales-orders';

export const useSalesOrders = (businessId: string, params?: SalesOrdersQueryParams) =>
  useQuery({
    queryKey: [SALES_ORDERS_KEY, businessId, params],
    queryFn: () => getSalesOrders(businessId, params),
    enabled: !!businessId,
  });

export const useSalesOrder = (businessId: string, id: string) =>
  useQuery({
    queryKey: [SALES_ORDERS_KEY, businessId, id],
    queryFn: () => getSalesOrder(businessId, id),
    enabled: !!businessId && !!id,
  });

export const useCreateSalesOrder = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSalesOrderDto) => createSalesOrder(businessId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] }),
  });
};

export const useUpdateSalesOrder = (businessId: string, id: string) => {
  const qc = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (dto: UpdateSalesOrderDto) => updateSalesOrder(businessId, id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] });
      toast.success('Commande modifiée', 'La commande a été modifiée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de la modification de la commande';
      toast.error('Erreur de modification', errorMessage);
    },
  });
};

export const useStartProgressSalesOrder = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startProgressSalesOrder(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] }),
  });
};

export const useMarkDeliveredSalesOrder = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markDeliveredSalesOrder(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] }),
  });
};

export const useMarkInvoicedSalesOrder = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markInvoicedSalesOrder(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] }),
  });
};

export const useCancelSalesOrder = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSalesOrder(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] }),
  });
};

export const useConvertSalesOrderToInvoice = (businessId: string) => {
  // Don't use queryClient here - no automatic invalidation
  // The parent component will handle refresh manually
  return useMutation({
    mutationFn: (id: string) => import('@/api/sales-orders').then(m => m.convertSalesOrderToInvoice(businessId, id)),
  });
};

export const useDeleteSalesOrder = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => import('@/api/sales-orders').then(m => m.deleteSalesOrder(businessId, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SALES_ORDERS_KEY, businessId] }),
  });
};

export const useSendSalesOrderEmail = (businessId: string) => {
  const toast = useToast();
  
  return useMutation({
    mutationFn: (id: string) => sendSalesOrderEmail(businessId, id),
    onSuccess: (data) => {
      toast.success('Email envoyé', data.message || 'L\'email de confirmation a été envoyé au client');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Erreur lors de l\'envoi de l\'email';
      toast.error('Erreur d\'envoi', errorMessage);
    },
  });
};
