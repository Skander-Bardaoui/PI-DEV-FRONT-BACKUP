// src/hooks/usePurchaseAlerts.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (v: string | undefined | null): v is string => !!v && UUID_REGEX.test(v);

const base = (businessId: string) => `/businesses/${businessId}/purchase-alerts`;

export const alertKeys = {
  list:  (businessId: string) => ['purchase-alerts', businessId] as const,
  count: (businessId: string) => ['purchase-alerts-count', businessId] as const,
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type AlertSeverity = 'INFO' | 'WARNING' | 'DANGER';
export type AlertStatus   = 'UNREAD' | 'READ' | 'RESOLVED' | 'SNOOZED';
export type AlertType     =
  | 'INVOICE_DUE_SOON'
  | 'INVOICE_OVERDUE'
  | 'PO_NOT_RECEIVED'
  | 'SUPPLIER_HIGH_DEBT'
  | 'INVOICE_HIGH_AMOUNT'
  | 'PO_AWAITING_CONFIRM';

export interface PurchaseAlertItem {
  id:           string;
  business_id:  string;
  type:         AlertType;
  severity:     AlertSeverity;
  status:       AlertStatus;
  title:        string;
  message:      string;
  entity_type:  string;
  entity_id:    string;
  entity_label: string;
  metadata:     Record<string, any>;
  email_sent:   boolean;
  created_at:   string;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function usePurchaseAlerts(businessId: string) {
  return useQuery({
    queryKey: alertKeys.list(businessId),
    queryFn:  () => axiosInstance.get(base(businessId)).then(r => r.data as PurchaseAlertItem[]),
    enabled:  isValidUUID(businessId),
    // Rafraîchir toutes les 2 minutes pour avoir les alertes en temps réel
    refetchInterval: 2 * 60 * 1000,
    staleTime:       60_000,
  });
}

export function useAlertUnreadCount(businessId: string) {
  return useQuery({
    queryKey: alertKeys.count(businessId),
    queryFn:  () => axiosInstance.get(`${base(businessId)}/count`).then(r => r.data.count as number),
    enabled:  isValidUUID(businessId),
    refetchInterval: 60_000,
  });
}

export function useMarkAlertRead(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`${base(businessId)}/${id}/read`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: alertKeys.list(businessId) });
      qc.invalidateQueries({ queryKey: alertKeys.count(businessId) });
      
      toast.success('Alerte marquée comme lue', {
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Erreur', {
        description: 'Impossible de marquer l\'alerte comme lue',
        duration: 3000,
      });
    },
  });
}

export function useMarkAllAlertsRead(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => axiosInstance.patch(`${base(businessId)}/read-all`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: alertKeys.list(businessId) });
      qc.invalidateQueries({ queryKey: alertKeys.count(businessId) });
      
      toast.success('Toutes les alertes marquées comme lues', {
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Erreur', {
        description: 'Impossible de marquer toutes les alertes',
        duration: 3000,
      });
    },
  });
}

export function useResolveAlert(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`${base(businessId)}/${id}/resolve`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: alertKeys.list(businessId) });
      qc.invalidateQueries({ queryKey: alertKeys.count(businessId) });
      
      toast.success('Alerte résolue', {
        description: 'L\'alerte a été marquée comme résolue',
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Erreur', {
        description: 'Impossible de résoudre l\'alerte',
        duration: 3000,
      });
    },
  });
}

export function useSnoozeAlert(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: number }) =>
      axiosInstance.patch(`${base(businessId)}/${id}/snooze?hours=${hours}`),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: alertKeys.list(businessId) });
      qc.invalidateQueries({ queryKey: alertKeys.count(businessId) });
      
      const duration = variables.hours < 24 
        ? `${variables.hours}h` 
        : variables.hours < 168 
          ? `${Math.round(variables.hours / 24)}j`
          : `${Math.round(variables.hours / 168)} semaine(s)`;
      
      toast.info('Alerte reportée', {
        description: `L'alerte sera rappelée dans ${duration}`,
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Erreur', {
        description: 'Impossible de reporter l\'alerte',
        duration: 3000,
      });
    },
  });
}

export function useTriggerAlertScan(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => axiosInstance.post(`${base(businessId)}/scan`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: alertKeys.list(businessId) });
      
      toast.success('Scan terminé', {
        description: 'Les alertes ont été mises à jour',
        duration: 3000,
      });
    },
    onError: () => {
      toast.error('Erreur', {
        description: 'Impossible de scanner les alertes',
        duration: 3000,
      });
    },
  });
}