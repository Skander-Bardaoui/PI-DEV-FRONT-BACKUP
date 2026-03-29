// src/hooks/useGoodsReceipts.ts
// ANOMALIE 10 FIX: Validation UUID et gestion d'erreur améliorée

import { CreateGoodsReceiptDto } from '@/types';
import { createGoodsReceipt, getGoodsReceipt, getGoodsReceiptsByPO } from '@/api/goods-receipts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Validation UUID v4 stricte
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (v: string | undefined | null): v is string =>
  !!v && UUID_REGEX.test(v);

// ─── Clés de cache ─────────────────────────────────────────────────────────────
export const grKeys = {
  byPO: (businessId: string, poId: string) => ['goods-receipts', businessId, poId] as const,
  one:  (businessId: string, id: string)   => ['goods-receipt',  businessId, id]   as const,
};

// ─── Récupérer les BRs d'un BC ─────────────────────────────────────────────────
export function useGoodsReceiptsByPO(businessId: string, poId: string) {
  return useQuery({
    queryKey: grKeys.byPO(businessId, poId),
    queryFn:  () => getGoodsReceiptsByPO(businessId, poId),
    enabled:  isValidUUID(businessId) && isValidUUID(poId),
    staleTime: 30_000,
  });
}

// ─── Récupérer un BR par ID ──────────────────────────────────────────────────
export function useGoodsReceipt(businessId: string, id: string) {
  return useQuery({
    queryKey: grKeys.one(businessId, id),
    queryFn:  () => getGoodsReceipt(businessId, id), // FIX: était goodsReceiptsApi.findOne
    enabled:  isValidUUID(businessId) && isValidUUID(id),
    staleTime: 60_000,
  });
}

// ─── Créer un BR ─────────────────────────────────────────────────────────────
export function useCreateGoodsReceipt(businessId: string, poId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGoodsReceiptDto) =>
      createGoodsReceipt(businessId, poId, dto),
    onSuccess: () => {
      // Invalider le cache des BRs pour ce BC spécifique
      qc.invalidateQueries({ queryKey: grKeys.byPO(businessId, poId) });
      // Invalider TOUS les caches des BCs (avec ou sans params)
      qc.invalidateQueries({ queryKey: ['supplier-pos', businessId] });
      qc.invalidateQueries({ queryKey: ['supplier-po', businessId, poId] });
      // Invalider le cache de la liste globale des bons de réception
      qc.invalidateQueries({ queryKey: ['goods-receipts', businessId] });
      // Forcer le refetch immédiat des données
      qc.refetchQueries({ queryKey: ['supplier-pos', businessId] });
    },
  });
}