/**
 * Types TypeScript pour les prédictions ML
 */

export interface PurchaseHistoryItem {
  date: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  supplier?: string;
  category?: string;
}

export interface PredictionRequest {
  product_id: string;
  history: PurchaseHistoryItem[];
  prediction_days?: number;
}

export interface PredictionResponse {
  product_id: string;
  product_name: string;
  predicted_quantity: number;
  predicted_date: string;
  confidence: number;
  recommendation: string;
  historical_avg: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  days_until_order: number;
  estimated_value?: number;
  urgency_level: 'urgent' | 'soon' | 'planned';
  data_quality: Record<string, any>;
  seasonality_detected: boolean;
  // Statut de traitement
  is_processed?: boolean;
  processed_at?: string;
  supplier_po_id?: string;
  supplier_po_number?: string;
}

export interface BatchPredictionRequest {
  products: Array<{
    product_id: string;
    history: PurchaseHistoryItem[];
  }>;
  prediction_days?: number;
}

export interface BatchPredictionResponse {
  predictions: PredictionResponse[];
  errors: Array<{ product_id: string; error: string }>;
  total_processed: number;
  successful: number;
  failed: number;
}

export interface RecommendationsResponse {
  recommendations: PredictionResponse[];
  total_recommendations: number;
  urgent_count: number;
  total_estimated_value: number;
  generated_at: string;
}

export interface MLHealthStatus {
  status: string;
  model_loaded: boolean;
  version: string;
}