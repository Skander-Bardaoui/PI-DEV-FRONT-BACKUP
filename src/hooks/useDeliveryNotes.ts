// src/hooks/useDeliveryNotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateDeliveryNoteDto,
  UpdateDeliveryNoteDto,
  DeliveryNotesQueryParams,
} from '@/types/delivery-note';
import {
  getDeliveryNotes,
  getDeliveryNote,
  createDeliveryNote,
  updateDeliveryNote,
  markDelivered,
  cancelDeliveryNote,
  deleteDeliveryNote,
  getDeliveryNotesBySalesOrder,
  cleanDuplicates,
} from '@/api/delivery-notes';

export const DELIVERY_NOTES_KEY = 'delivery-notes';

export const useDeliveryNotes = (businessId: string, params?: DeliveryNotesQueryParams) =>
  useQuery({
    queryKey: [DELIVERY_NOTES_KEY, businessId, params],
    queryFn: () => getDeliveryNotes(businessId, params),
    enabled: !!businessId,
  });

export const useDeliveryNote = (businessId: string, id: string) =>
  useQuery({
    queryKey: [DELIVERY_NOTES_KEY, businessId, id],
    queryFn: () => getDeliveryNote(businessId, id),
    enabled: !!businessId && !!id,
  });

export const useCreateDeliveryNote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeliveryNoteDto) => createDeliveryNote(businessId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] }),
  });
};

export const useUpdateDeliveryNote = (businessId: string, id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateDeliveryNoteDto) => updateDeliveryNote(businessId, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] }),
  });
};

export const useMarkDelivered = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markDelivered(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] });
      // Also invalidate sales orders since they might be updated
      qc.invalidateQueries({ queryKey: ['sales-orders', businessId] });
    },
  });
};

export const useCancelDeliveryNote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelDeliveryNote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] }),
  });
};

export const useDeleteDeliveryNote = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeliveryNote(businessId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] }),
  });
};

export const useCleanDuplicates = (businessId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cleanDuplicates(businessId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] });
    },
  });
};

export const useDeliveryNotesBySalesOrder = (businessId: string, salesOrderId: string) =>
  useQuery({
    queryKey: [DELIVERY_NOTES_KEY, businessId, 'by-sales-order', salesOrderId],
    queryFn: () => getDeliveryNotesBySalesOrder(businessId, salesOrderId),
    enabled: !!businessId && !!salesOrderId,
  });

export const useCreateDeliveryNoteFromSalesOrder = (businessId: string, salesOrderId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeliveryNoteDto) => createDeliveryNote(businessId, { ...dto, salesOrderId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [DELIVERY_NOTES_KEY, businessId] });
      qc.invalidateQueries({ queryKey: ['sales-orders', businessId] });
      qc.invalidateQueries({ queryKey: ['sales-order', businessId, salesOrderId] });
    },
  });
};
