export enum StockMovementType {
  ENTREE_ACHAT = 'ENTREE_ACHAT',
  SORTIE_VENTE = 'SORTIE_VENTE',
  AJUSTEMENT_POSITIF = 'AJUSTEMENT_POSITIF',
  AJUSTEMENT_NEGATIF = 'AJUSTEMENT_NEGATIF',
}

export interface StockMovement {
  id: string;
  product_id: string;
  business_id: string;
  type: StockMovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  source_type: string | null;
  source_id: string | null;
  warehouse_id?: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    reference: string;
  };
}

export interface CreateStockMovementDto {
  product_id: string;
  type: StockMovementType;
  quantity: number;
  source_type?: string;
  source_id?: string;
  warehouse_id?: string;
  note?: string;
}

export interface QueryStockMovementsDto {
  product_id?: string;
  type?: StockMovementType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface StockMovementResponse {
  data: StockMovement[];
  total: number;
}

export interface ProductStockSummary {
  current_stock: number;
  total_entries: number;
  total_exits: number;
  last_movement: StockMovement | null;
}

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  [StockMovementType.ENTREE_ACHAT]: 'Entrée Achat',
  [StockMovementType.SORTIE_VENTE]: 'Sortie Vente',
  [StockMovementType.AJUSTEMENT_POSITIF]: 'Ajustement +',
  [StockMovementType.AJUSTEMENT_NEGATIF]: 'Ajustement -',
};

export const STOCK_MOVEMENT_TYPE_COLORS: Record<StockMovementType, string> = {
  [StockMovementType.ENTREE_ACHAT]: 'bg-blue-100 text-blue-800',
  [StockMovementType.SORTIE_VENTE]: 'bg-red-100 text-red-800',
  [StockMovementType.AJUSTEMENT_POSITIF]: 'bg-purple-100 text-purple-800',
  [StockMovementType.AJUSTEMENT_NEGATIF]: 'bg-orange-100 text-orange-800',
};
