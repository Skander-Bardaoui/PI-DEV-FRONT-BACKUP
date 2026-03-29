
import { PaymentMethod } from '@/types/PaymentMethod';
import { z } from 'zod';

const amountTND = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} doit être un nombre` })
    .min(0, `${label} ne peut pas être négatif`)
    .multipleOf(0.001, `${label} doit avoir au maximum 3 décimales`);

const optionalString = z.string().trim().optional().or(z.literal(''));

const tunisianPhone = z
  .string()
  .trim()
  .regex(/^[+]?[\d\s\-().]{8,20}$/, 'Numéro de téléphone invalide (ex: +216 71 000 000)')
  .optional()
  .or(z.literal(''));

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : JJ/MM/AAAA)')
  .optional()
  .or(z.literal(''));

// ══════════════════════════════════════════════════════════════════════════════
// 1. FOURNISSEUR
// ══════════════════════════════════════════════════════════════════════════════
export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  matricule_fiscal: z
    .string()
    .trim()
    .max(30, 'Matricule fiscal trop long')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .trim()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),

  phone: tunisianPhone,

  rib: z
    .string()
    .trim()
    .max(30, 'RIB trop long')
    .optional()
    .or(z.literal('')),

  bank_name: z
    .string()
    .trim()
    .max(100, 'Nom de banque trop long')
    .optional()
    .or(z.literal('')),

  payment_terms: z.coerce
    .number({ invalid_type_error: 'Le délai doit être un nombre' })
    .int('Le délai doit être un nombre entier')
    .min(0,   'Le délai ne peut pas être négatif')
    .max(365, 'Le délai ne peut pas dépasser 365 jours')
    .default(30),

  category: z
    .string()
    .trim()
    .max(100, 'Catégorie trop longue')
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .trim()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),

  address: z.object({
    street:      optionalString,
    city:        optionalString,
    postal_code: optionalString,
    country:     z.string().trim().default('Tunisie'),
  }).optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 2. LIGNE DE BON DE COMMANDE
// ══════════════════════════════════════════════════════════════════════════════
export const poItemSchema = z.object({
  product_id:       z.string().uuid('Produit invalide').optional().or(z.literal('')),

  description: z
    .string()
    .trim()
    .min(1, 'La description est obligatoire')
    .max(500, 'Description trop longue'),

  quantity_ordered: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre' })
    .positive('La quantité doit être supérieure à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  unit_price_ht: amountTND('Le prix unitaire'),

  tax_rate_value: z.coerce
    .number()
    .refine(v => [0, 7, 13, 19].includes(v), 'Taux TVA invalide (0, 7, 13 ou 19%)'),

  sort_order: z.coerce.number().int().min(0).optional(),
});

export type POItemFormValues = z.infer<typeof poItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 3. BON DE COMMANDE
// ══════════════════════════════════════════════════════════════════════════════
export const supplierPOSchema = z.object({
  supplier_id: z
    .string()
    .uuid('Veuillez sélectionner un fournisseur')
    .min(1, 'Le fournisseur est obligatoire'),

  expected_delivery: isoDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(poItemSchema)
    .min(1, 'Le bon de commande doit contenir au moins une ligne')
    .max(100, 'Maximum 100 lignes par bon de commande'),
});

export type SupplierPOFormValues = z.infer<typeof supplierPOSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 4. BON DE RÉCEPTION
// ══════════════════════════════════════════════════════════════════════════════
export const goodsReceiptItemSchema = z.object({
  supplier_po_item_id: z
    .string()
    .uuid('Ligne de BC invalide')
    .min(1),

  quantity_received: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre' })
    .min(0, 'La quantité ne peut pas être négative')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),
});

export const goodsReceiptSchema = z.object({
  receipt_date: isoDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(goodsReceiptItemSchema)
    .min(1)
    .refine(
      items => items.some(i => Number(i.quantity_received) > 0),
      'Au moins une quantité reçue doit être supérieure à 0',
    ),
});

export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 5. FACTURE FOURNISSEUR
// ══════════════════════════════════════════════════════════════════════════════
export const purchaseInvoiceSchema = z.object({
  invoice_number_supplier: z
    .string()
    .trim()
    .min(1,   'Le numéro de facture est obligatoire')
    .max(100, 'Numéro de facture trop long'),

  supplier_id: z
    .string()
    .uuid('Veuillez sélectionner un fournisseur')
    .min(1, 'Le fournisseur est obligatoire'),

  supplier_po_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('')),

  invoice_date: z
    .string()
    .trim()
    .min(1, 'La date de facture est obligatoire')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),

  due_date: isoDate,

  subtotal_ht: amountTND('Le sous-total HT'),
  tax_amount:  amountTND('La TVA'),
  timbre_fiscal: z.coerce
    .number()
    .min(0)
    .default(1.000),

  receipt_url: z
    .string()
    .trim()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
});

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 6. PAIEMENT FACTURE
// ══════════════════════════════════════════════════════════════════════════════
export const paymentSchema = (maxAmount: number) =>
  z.object({
    amount: z.coerce
      .number({ invalid_type_error: 'Le montant doit être un nombre' })
      .positive('Le montant doit être supérieur à 0')
      .max(maxAmount, `Le montant ne peut pas dépasser ${maxAmount.toFixed(3)} TND`)
      .multipleOf(0.001, 'Précision maximale : 3 décimales'),
  });

export type PaymentFormValues = { amount: number };

// ══════════════════════════════════════════════════════════════════════════════
// 7. LITIGE FACTURE
// ══════════════════════════════════════════════════════════════════════════════
export const disputeSchema = z.object({
  dispute_reason: z
    .string()
    .trim()
    .min(5,   'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),
});

export type DisputeFormValues = z.infer<typeof disputeSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 8. CORRECTION LITIGE (montants)
// ══════════════════════════════════════════════════════════════════════════════
export const correctInvoiceSchema = z.object({
  subtotal_ht:   amountTND('Le sous-total HT'),
  tax_amount:    amountTND('La TVA'),
  timbre_fiscal: z.coerce.number().min(0).default(1.000),
  invoice_date:  isoDate,
  due_date:      isoDate,
});

export type CorrectInvoiceFormValues = z.infer<typeof correctInvoiceSchema>;






