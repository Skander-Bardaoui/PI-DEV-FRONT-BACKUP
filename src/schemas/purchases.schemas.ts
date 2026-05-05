
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

// Validation de date ISO avec vérifications avancées
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
  .refine((date) => {
    if (!date) return true; // Optionnel
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Date invalide (jour/mois incorrect)')
  .refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    const year = parsed.getFullYear();
    return year >= 1900 && year <= 2100;
  }, 'L\'année doit être entre 1900 et 2100')
  .optional()
  .or(z.literal(''));

// Date obligatoire avec validations
const requiredIsoDate = z
  .string({ required_error: 'La date est obligatoire' })
  .trim()
  .min(1, 'La date est obligatoire')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Date invalide (jour/mois incorrect)')
  .refine((date) => {
    const parsed = new Date(date);
    const year = parsed.getFullYear();
    return year >= 1900 && year <= 2100;
  }, 'L\'année doit être entre 1900 et 2100');

// Date future obligatoire (pour livraisons, échéances)
const requiredFutureDate = z
  .string({ required_error: 'La date est obligatoire' })
  .trim()
  .min(1, 'La date est obligatoire')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Date invalide (jour/mois incorrect)')
  .refine((date) => {
    const parsed = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed >= today;
  }, 'La date doit être supérieure ou égale à aujourd\'hui');

// Date future optionnelle (pour livraisons, échéances)
const futureDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
  .refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Date invalide (jour/mois incorrect)')
  .refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed >= today;
  }, 'La date doit être supérieure ou égale à aujourd\'hui')
  .optional()
  .or(z.literal(''));

// Date passée ou aujourd'hui (pour factures, réceptions)
const pastOrTodayDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
  .refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Date invalide (jour/mois incorrect)')
  .refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return parsed <= today;
  }, 'La date ne peut pas être dans le futur')
  .optional()
  .or(z.literal(''));

// ══════════════════════════════════════════════════════════════════════════════
// 1. FOURNISSEUR
// ══════════════════════════════════════════════════════════════════════════════
export const supplierSchema = z.object({
  name: z
    .string({ required_error: 'Le nom est obligatoire' })
    .trim()
    .min(1, 'Le nom est obligatoire')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&'.()]+$/, 'Le nom contient des caractères invalides'),

  matricule_fiscal: z
    .string({ required_error: 'Le matricule fiscal est obligatoire' })
    .trim()
    .min(1, 'Le matricule fiscal est obligatoire')
    .regex(/^[\d]{7}\/[A-Z]\/[A-Z]\/[A-Z]\/[\d]{3}$/, 'Format invalide (ex: 1234567/A/B/C/000)')
    .max(30, 'Matricule fiscal trop long'),

  email: z
    .string({ required_error: 'L\'email est obligatoire' })
    .trim()
    .min(1, 'L\'email est obligatoire')
    .email('Adresse email invalide'),

  phone: z
    .string({ required_error: 'Le téléphone est obligatoire' })
    .trim()
    .min(1, 'Le téléphone est obligatoire')
    .regex(/^[+]?[\d\s\-().]{8,20}$/, 'Numéro de téléphone invalide (ex: +216 71 000 000)'),

  rib: z
    .string({ required_error: 'Le RIB est obligatoire' })
    .trim()
    .min(1, 'Le RIB est obligatoire')
    .regex(/^[\d\s]{20,30}$/, 'RIB invalide (20-30 chiffres)')
    .max(30, 'RIB trop long'),

  bank_name: z
    .string({ required_error: 'Le nom de banque est obligatoire' })
    .trim()
    .min(1, 'Le nom de banque est obligatoire')
    .max(100, 'Nom de banque trop long')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&'.]+$/, 'Le nom de banque contient des caractères invalides'),

  payment_terms: z.coerce
    .number({ invalid_type_error: 'Le délai doit être un nombre', required_error: 'Le délai de paiement est obligatoire' })
    .int('Le délai doit être un nombre entier')
    .min(0,   'Le délai ne peut pas être négatif')
    .max(365, 'Le délai ne peut pas dépasser 365 jours')
    .default(30),

  category: z
    .string({ required_error: 'La catégorie est obligatoire' })
    .trim()
    .min(1, 'La catégorie est obligatoire')
    .max(100, 'Catégorie trop longue')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&',]+$/, 'La catégorie contient des caractères invalides'),

  notes: z
    .string()
    .trim()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),

  address: z.object({
    street: z
      .string({ required_error: 'La rue est obligatoire' })
      .trim()
      .min(1, 'La rue est obligatoire')
      .max(200, 'La rue ne peut pas dépasser 200 caractères'),
    city: z
      .string({ required_error: 'La ville est obligatoire' })
      .trim()
      .min(1, 'La ville est obligatoire')
      .max(100, 'La ville ne peut pas dépasser 100 caractères'),
    postal_code: z
      .string({ required_error: 'Le code postal est obligatoire' })
      .trim()
      .min(1, 'Le code postal est obligatoire')
      .regex(/^[\d\s-]{4,10}$/, 'Code postal invalide (4-10 chiffres)'),
    country: z
      .string({ required_error: 'Le pays est obligatoire' })
      .trim()
      .min(1, 'Le pays est obligatoire')
      .max(100, 'Le pays ne peut pas dépasser 100 caractères')
      .default('Tunisie'),
  }),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 2. LIGNE DE BON DE COMMANDE
// ══════════════════════════════════════════════════════════════════════════════
export const poItemSchema = z.object({
  product_id: z
    .string({ required_error: 'Le produit est obligatoire pour le suivi des stocks' })
    .uuid('Produit invalide')
    .min(1, 'Le produit est obligatoire pour le suivi des stocks'), // ✅ Made REQUIRED

  description: z
    .string({ required_error: 'La description est obligatoire' })
    .trim()
    .min(1, 'La description est obligatoire')
    .max(500, 'Description trop longue'),

  quantity_ordered: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre', required_error: 'La quantité est obligatoire' })
    .positive('La quantité doit être supérieure à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  unit_price_ht: z.coerce
    .number({ invalid_type_error: 'Le prix unitaire doit être un nombre', required_error: 'Le prix unitaire est obligatoire' })
    .positive('Le prix unitaire doit être supérieur à 0')
    .max(9999999.999, 'Le prix unitaire ne peut pas dépasser 9999999.999 TND')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  tax_rate_value: z.coerce
    .number({ invalid_type_error: 'Le taux de TVA doit être un nombre' })
    .refine(v => [0, 7, 13, 19].includes(v), 'Taux TVA invalide (0, 7, 13 ou 19%)'),

  sort_order: z.coerce.number().int().min(0).optional(),
});

export type POItemFormValues = z.infer<typeof poItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 3. BON DE COMMANDE
// ══════════════════════════════════════════════════════════════════════════════
export const supplierPOSchema = z.object({
  supplier_id: z
    .string({ required_error: 'Le fournisseur est obligatoire' })
    .trim()
    .min(1, 'Le fournisseur est obligatoire')
    .uuid('Veuillez sélectionner un fournisseur valide'),

  expected_delivery: requiredFutureDate,

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
    .string({ required_error: 'La ligne de BC est obligatoire' })
    .trim()
    .min(1, 'La ligne de BC est obligatoire')
    .uuid('Ligne de BC invalide'),

  quantity_received: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre' })
    .min(0, 'La quantité ne peut pas être négative')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),
});

// Schéma dynamique pour bon de réception avec validation de date par rapport au BC
export const createGoodsReceiptSchema = (poCreatedDate?: string) => z.object({
  receipt_date: z
    .string({ required_error: 'La date de réception est obligatoire' })
    .trim()
    .min(1, 'La date de réception est obligatoire')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : YYYY-MM-DD)')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Date invalide (jour/mois incorrect)')
    .refine((date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'La date de réception ne peut pas être dans le futur')
    .refine((date) => {
      if (!poCreatedDate) return true;
      const receiptDate = new Date(date);
      const poDate = new Date(poCreatedDate);
      return receiptDate >= poDate;
    }, `La date de réception doit être supérieure ou égale à la date du bon de commande${poCreatedDate ? ` (${poCreatedDate})` : ''}`),

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

// Schéma par défaut pour compatibilité
export const goodsReceiptSchema = createGoodsReceiptSchema();

export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 5. FACTURE FOURNISSEUR
// ══════════════════════════════════════════════════════════════════════════════
export const purchaseInvoiceSchema = z.object({
  supplier_id: z
    .string({ required_error: 'Le fournisseur est obligatoire' })
    .trim()
    .min(1, 'Le fournisseur est obligatoire')
    .uuid('Veuillez sélectionner un fournisseur valide'),

  supplier_po_id: z
    .string()
    .uuid('Bon de commande invalide')
    .optional()
    .or(z.literal('')),

  goods_receipt_id: z
    .string()
    .uuid('Bon de réception invalide')
    .optional()
    .or(z.literal('')),

  invoice_date: requiredIsoDate,

  due_date: isoDate,

  subtotal_ht: z.coerce
    .number({ required_error: 'Le sous-total HT est obligatoire', invalid_type_error: 'Le sous-total HT doit être un nombre' })
    .min(0, 'Le sous-total HT ne peut pas être négatif')
    .max(99999999.999, 'Le sous-total HT ne peut pas dépasser 99999999.999 TND')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  tax_amount: z.coerce
    .number({ required_error: 'La TVA est obligatoire', invalid_type_error: 'La TVA doit être un nombre' })
    .min(0, 'La TVA ne peut pas être négative')
    .max(99999999.999, 'La TVA ne peut pas dépasser 99999999.999 TND')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  timbre_fiscal: z.coerce
    .number({ invalid_type_error: 'Le timbre fiscal doit être un nombre' })
    .min(0, 'Le timbre fiscal ne peut pas être négatif')
    .max(10.000, 'Le timbre fiscal ne peut pas dépasser 10.000 TND')
    .default(1.000),

  receipt_url: z
    .string()
    .trim()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    if (!data.due_date || !data.invoice_date) return true;
    const invoiceDate = new Date(data.invoice_date);
    const dueDate = new Date(data.due_date);
    return dueDate >= invoiceDate;
  },
  {
    message: 'La date d\'échéance doit être postérieure ou égale à la date de facture',
    path: ['due_date'],
  }
);

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 6. PAIEMENT FACTURE
// ══════════════════════════════════════════════════════════════════════════════
export const paymentSchema = (maxAmount: number) =>
  z.object({
    amount: z.coerce
      .number({ required_error: 'Le montant est obligatoire', invalid_type_error: 'Le montant doit être un nombre' })
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
    .string({ required_error: 'Le motif du litige est obligatoire' })
    .trim()
    .min(1, 'Le motif du litige est obligatoire')
    .min(5, 'Le motif doit contenir au moins 5 caractères')
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







// ══════════════════════════════════════════════════════════════════════════════
// 9. INVITATION FOURNISSEUR
// ══════════════════════════════════════════════════════════════════════════════
export const supplierInviteSchema = z.object({
  email: z
    .string({ required_error: 'L\'email est obligatoire' })
    .trim()
    .min(1, 'L\'email est obligatoire')
    .email('Adresse email invalide'),

  supplier_name: z
    .string({ required_error: 'Le nom du fournisseur est obligatoire' })
    .trim()
    .min(1, 'Le nom du fournisseur est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  message: z
    .string()
    .trim()
    .max(1000, 'Le message ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
});

export type SupplierInviteFormValues = z.infer<typeof supplierInviteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 10. GÉNÉRATION BC PAR IA (texte naturel)
// ══════════════════════════════════════════════════════════════════════════════
export const aiPOGeneratorSchema = z.object({
  text: z
    .string({ required_error: 'Le texte est obligatoire' })
    .trim()
    .min(10, 'Le texte de commande est trop court (minimum 10 caractères).')
    .max(5000, 'Le texte ne peut pas dépasser 5000 caractères'),
});

export type AiPOGeneratorFormValues = z.infer<typeof aiPOGeneratorSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 11. MISE À JOUR BON DE COMMANDE
// ══════════════════════════════════════════════════════════════════════════════
export const updateSupplierPOSchema = z.object({
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
    .max(100, 'Maximum 100 lignes par bon de commande')
    .optional(),
});

export type UpdateSupplierPOFormValues = z.infer<typeof updateSupplierPOSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 12. RÉPONSE À UN LITIGE (fournisseur)
// ══════════════════════════════════════════════════════════════════════════════
export const disputeResponseSchema = z.object({
  response_text: z
    .string({ required_error: 'La réponse est obligatoire' })
    .trim()
    .min(1, 'La réponse est obligatoire')
    .min(10, 'La réponse doit contenir au moins 10 caractères')
    .max(2000, 'La réponse ne peut pas dépasser 2000 caractères'),

  proposed_resolution: z
    .enum(['accept_correction', 'partial_credit', 'full_refund', 'reject'], {
      invalid_type_error: 'Type de résolution invalide',
    })
    .optional(),

  proposed_amount: z.coerce
    .number({ invalid_type_error: 'Le montant proposé doit être un nombre' })
    .min(0, 'Le montant proposé ne peut pas être négatif')
    .multipleOf(0.001, 'Précision maximale : 3 décimales')
    .optional(),
});

export type DisputeResponseFormValues = z.infer<typeof disputeResponseSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 13. RÉSOLUTION FINALE D'UN LITIGE (admin)
// ══════════════════════════════════════════════════════════════════════════════
export const resolveDisputeSchema = z.object({
  resolution_type: z.enum(['accept_correction', 'partial_credit', 'full_refund', 'reject'], {
    required_error: 'Le type de résolution est obligatoire',
    invalid_type_error: 'Type de résolution invalide',
  }),

  final_amount: z.coerce
    .number({ required_error: 'Le montant final est obligatoire', invalid_type_error: 'Le montant final doit être un nombre' })
    .min(0, 'Le montant final ne peut pas être négatif')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  resolution_notes: z
    .string()
    .trim()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
});

export type ResolveDisputeFormValues = z.infer<typeof resolveDisputeSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 14. UPLOAD SCAN FACTURE (OCR)
// ══════════════════════════════════════════════════════════════════════════════
export const uploadInvoiceScanSchema = z.object({
  file: z
    .instanceof(File, { message: 'Veuillez sélectionner un fichier' })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'La taille du fichier ne peut pas dépasser 10 MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
      'Format de fichier invalide (JPEG, PNG, WEBP ou PDF uniquement)'
    ),

  supplier_id: z
    .string()
    .uuid('Fournisseur invalide')
    .optional()
    .or(z.literal('')),
});

export type UploadInvoiceScanFormValues = z.infer<typeof uploadInvoiceScanSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 15. RÉSERVATION STOCK (pour BC)
// ══════════════════════════════════════════════════════════════════════════════
export const reservationSchema = z.object({
  product_id: z
    .string({ required_error: 'Le produit est obligatoire' })
    .trim()
    .min(1, 'Le produit est obligatoire')
    .uuid('Produit invalide'),

  quantity: z.coerce
    .number({ required_error: 'La quantité est obligatoire', invalid_type_error: 'La quantité doit être un nombre' })
    .positive('La quantité doit être supérieure à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  notes: z
    .string()
    .trim()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 16. PAIEMENT FACTURE AVEC MÉTHODE
// ══════════════════════════════════════════════════════════════════════════════
export const paymentWithMethodSchema = (maxAmount: number) =>
  z.object({
    amount: z.coerce
      .number({ invalid_type_error: 'Le montant doit être un nombre' })
      .positive('Le montant doit être supérieur à 0')
      .max(maxAmount, `Le montant ne peut pas dépasser ${maxAmount.toFixed(3)} TND`)
      .multipleOf(0.001, 'Précision maximale : 3 décimales'),

    payment_method: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: 'Méthode de paiement invalide' }),
    }),

    payment_date: pastOrTodayDate,

    reference: z
      .string()
      .trim()
      .max(100, 'La référence ne peut pas dépasser 100 caractères')
      .optional()
      .or(z.literal('')),

    notes: z
      .string()
      .trim()
      .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
      .optional()
      .or(z.literal('')),
  });

export type PaymentWithMethodFormValues = z.infer<ReturnType<typeof paymentWithMethodSchema>>;

// ══════════════════════════════════════════════════════════════════════════════
// 17. CRÉATION FACTURE DEPUIS BC
// ══════════════════════════════════════════════════════════════════════════════
export const createInvoiceFromPOSchema = z.object({
  invoice_number_supplier: z
    .string()
    .trim()
    .max(100, 'Numéro de facture trop long')
    .optional()
    .or(z.literal('')),

  invoice_date: requiredIsoDate,

  due_date: isoDate,

  receipt_url: z
    .string()
    .trim()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .trim()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    if (!data.due_date || !data.invoice_date) return true;
    const invoiceDate = new Date(data.invoice_date);
    const dueDate = new Date(data.due_date);
    return dueDate >= invoiceDate;
  },
  {
    message: 'La date d\'échéance doit être postérieure ou égale à la date de facture',
    path: ['due_date'],
  }
);

export type CreateInvoiceFromPOFormValues = z.infer<typeof createInvoiceFromPOSchema>;