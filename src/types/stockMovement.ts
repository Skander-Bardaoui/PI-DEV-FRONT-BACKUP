// src/types/stockMovement.ts
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reference?: string;
  note?: string;
  createdAt: Date;
}
