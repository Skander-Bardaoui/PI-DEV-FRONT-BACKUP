// src/hooks/useSalesMatching.ts
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export interface SalesMatchResult {
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  status: string;
  can_auto_validate: boolean;
  should_alert: boolean;
  quote_total: number | null;
  order_total: number;
  delivered_total: number;
  invoiced_total: number;
  total_discrepancy: number;
  discrepancy_pct: number;
  line_discrepancies: any[];
  issues: string[];
  recommendations: string[];
  quote_number: string | null;
  order_number: string | null;
  delivery_note_numbers: string[];
  matching_date: string;
}

const base = (businessId: string) => `/businesses/${businessId}/sales-matching`;

export const useSalesMatching = (businessId: string, invoiceId: string) => {
  return useQuery({
    queryKey: ['sales-matching', businessId, invoiceId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<SalesMatchResult>(
        `${base(businessId)}/invoice/${invoiceId}`,
      );
      return data;
    },
    enabled: !!businessId && !!invoiceId,
  });
};

export const useSalesMatchingDraft = (businessId: string) => {
  return useQuery({
    queryKey: ['sales-matching-draft', businessId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<SalesMatchResult[]>(`${base(businessId)}/draft`);
      return data;
    },
    enabled: !!businessId,
  });
};
