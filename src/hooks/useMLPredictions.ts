/**
 * Hook React Query pour les prédictions ML
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';
import {
  PredictionRequest,
  PredictionResponse,
  BatchPredictionRequest,
  BatchPredictionResponse,
  RecommendationsResponse,
  MLHealthStatus,
} from '../types/ml-predictions';

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const mlApi = {
  // Health check
  checkHealth: async (): Promise<MLHealthStatus> => {
    const { data } = await axiosInstance.get('/purchases/ml/health');
    return data;
  },

  // Prédiction pour un produit (avec données personnalisées)
  predictDemand: async (request: PredictionRequest): Promise<PredictionResponse> => {
    const { data } = await axiosInstance.post('/purchases/ml/predict', request);
    return data;
  },

  // Prédictions en batch
  predictBatch: async (request: BatchPredictionRequest): Promise<BatchPredictionResponse> => {
    const { data } = await axiosInstance.post('/purchases/ml/predict/batch', request);
    return data;
  },

  // Prédiction pour un produit (utilise l'historique de la BDD)
  predictForProduct: async (
    productId: string,
    predictionDays?: number,
  ): Promise<PredictionResponse> => {
    const params = predictionDays ? { prediction_days: predictionDays } : {};
    const { data } = await axiosInstance.get(
      `/purchases/ml/predict/product/${productId}`,
      { params },
    );
    return data;
  },

  // Recommandations d'achat
  getRecommendations: async (predictionDays?: number): Promise<RecommendationsResponse> => {
    const params = predictionDays ? { prediction_days: predictionDays } : {};
    const { data } = await axiosInstance.get('/purchases/ml/recommendations', { params });
    return data;
  },

  // Historique d'achat d'un produit
  getProductHistory: async (productId: string) => {
    const { data } = await axiosInstance.get(`/purchases/ml/history/${productId}`);
    return data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook pour vérifier la santé du service ML
 */
export const useMLHealth = () => {
  return useQuery({
    queryKey: ['ml', 'health'],
    queryFn: mlApi.checkHealth,
    refetchInterval: 60000, // Vérifier toutes les minutes
    retry: 3,
  });
};

/**
 * Hook pour obtenir les recommandations d'achat
 */
export const useMLRecommendations = (predictionDays?: number) => {
  return useQuery({
    queryKey: ['ml', 'recommendations', predictionDays],
    queryFn: () => mlApi.getRecommendations(predictionDays),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook pour prédire la demande d'un produit
 */
export const useProductPrediction = (productId: string, predictionDays?: number) => {
  return useQuery({
    queryKey: ['ml', 'prediction', productId, predictionDays],
    queryFn: () => mlApi.predictForProduct(productId, predictionDays),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Hook pour obtenir l'historique d'achat d'un produit
 */
export const useProductHistory = (productId: string) => {
  return useQuery({
    queryKey: ['ml', 'history', productId],
    queryFn: () => mlApi.getProductHistory(productId),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook pour prédire avec des données personnalisées
 */
export const usePredictDemand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mlApi.predictDemand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml'] });
    },
  });
};

/**
 * Hook pour prédictions en batch
 */
export const usePredictBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mlApi.predictBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml'] });
    },
  });
};