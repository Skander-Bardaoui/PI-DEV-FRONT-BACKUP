// src/hooks/useSupplierScoring.ts
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ScoreCriteria {
  name:     string;
  score:    number;
  weight:   number;
  weighted: number;
  label:    string;
  detail:   string;
}

export interface SupplierScore {
  supplier_id:   string;
  supplier_name: string;
  total_score:   number;
  grade:         ScoreGrade;
  criteria:      ScoreCriteria[];
  stats:         Record<string, number>;
  computed_at:   string;
}

export interface SupplierRanking {
  rank:          number;
  supplier_id:   string;
  supplier_name: string;
  total_score:   number;
  grade:         ScoreGrade;
  trend:         'up' | 'down' | 'stable';
}

const base = (bId: string) => `/businesses/${bId}/supplier-scoring`;

export function useSupplierRanking(businessId: string) {
  return useQuery({
    queryKey: ['supplier-ranking', businessId],
    queryFn:  () => axiosInstance.get(`${base(businessId)}/ranking`).then(r => r.data as SupplierRanking[]),
    enabled:  !!businessId,
    staleTime: 5 * 60_000,
  });
}

export function useSupplierScore(businessId: string, supplierId: string) {
  return useQuery({
    queryKey: ['supplier-score', businessId, supplierId],
    queryFn:  () => axiosInstance.get(`${base(businessId)}/${supplierId}`).then(r => r.data as SupplierScore),
    enabled:  !!businessId && !!supplierId,
    staleTime: 5 * 60_000,
  });
}