// src/types/common.types.ts
// Types partagés utilisés dans tout le Module 3

// ── Réponse paginée générique ─────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:         T[];
  total:        number;
  page:         number;
  limit:        number;
  total_pages?: number;
}

// ── Réponse API simple ────────────────────────────────────────────────────
export interface ApiMessage {
  message: string;
}

// ── Erreur API ────────────────────────────────────────────────────────────
export interface ApiError {
  message:    string | string[];
  error:      string;
  statusCode: number;
}

// ── Paramètres de pagination communs ─────────────────────────────────────
export interface PaginationParams {
  page?:  number;
  limit?: number;
}

// ── Taux TVA tunisiens ────────────────────────────────────────────────────
export const TVA_RATES = [0, 7, 13, 19] as const;
export type TVARate = typeof TVA_RATES[number];

export const TVA_RATE_LABELS: Record<TVARate, string> = {
  0:  'Exonéré (0%)',
  7:  'Réduit (7%)',
  13: 'Intermédiaire (13%)',
  19: 'Standard (19%)',
};

// ── Timbre fiscal tunisien ────────────────────────────────────────────────
export const TIMBRE_FISCAL = 1.000;

// ── Devise par défaut ─────────────────────────────────────────────────────
export const DEFAULT_CURRENCY = 'TND';

// ── Helper : arrondir à 3 décimales ───────────────────────────────────────
export const round3 = (value: number): number =>
  Math.round(value * 1000) / 1000;

// ── Helper : formatter un montant ─────────────────────────────────────────
export const formatAmount = (amount: number): string =>
  `${round3(amount).toLocaleString('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} TND`;

// ── Helper : formatter une date ───────────────────────────────────────────
export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });