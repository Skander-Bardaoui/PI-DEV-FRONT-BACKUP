import { PaymentMethod } from '@/types/PaymentMethod';
import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS DE VALIDATION RÉUTILISABLES
// ══════════════════════════════════════════════════════════════════════════════

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
    if (!date) return true;
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

// Date passée ou aujourd'hui (pour factures)
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
// 1. CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const clientSchema = z.object({
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
    .min(0, 'Le délai ne peut pas être négatif')
    .max(365, 'Le délai ne peut pas dépasser 365 jours')
    .default(30),

  category: z
    .string()
    .trim()
    .max(100, 'Catégorie trop longue')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&',]*$/, 'La catégorie contient des caractères invalides')
    .optional()
    .or(z.literal('')),

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

export type ClientFormValues = z.infer<typeof clientSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 2. LIGNE DE DEVIS
// ══════════════════════════════════════════════════════════════════════════════
export const quoteItemSchema = z.object({
  product_id: z.string().uuid('Produit invalide').optional().or(z.literal('')),

  description: z
    .string({ required_error: 'La description est obligatoire' })
    .trim()
    .min(1, 'La description est obligatoire')
    .max(500, 'Description trop longue'),

  quantity: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre', required_error: 'La quantité est obligatoire' })
    .positive('La quantité doit être supérieure à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  unit_price: z.coerce
    .number({ invalid_type_error: 'Le prix unitaire doit être un nombre', required_error: 'Le prix unitaire est obligatoire' })
    .positive('Le prix unitaire doit être supérieur à 0')
    .max(9999999.999, 'Le prix unitaire ne peut pas dépasser 9999999.999 TND')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  tax_rate: z.coerce
    .number({ invalid_type_error: 'Le taux de TVA doit être un nombre' })
    .refine(v => [0, 7, 13, 19].includes(v), 'Taux TVA invalide (0, 7, 13 ou 19%)'),

  sort_order: z.coerce.number().int().min(0).optional(),
});

export type QuoteItemFormValues = z.infer<typeof quoteItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 3. DEVIS
// ══════════════════════════════════════════════════════════════════════════════
export const quoteSchema = z.object({
  client_id: z
    .string({ required_error: 'Le client est obligatoire' })
    .trim()
    .min(1, 'Le client est obligatoire')
    .uuid('Veuillez sélectionner un client valide'),

  valid_until: requiredFutureDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(quoteItemSchema)
    .min(1, 'Le devis doit contenir au moins une ligne')
    .max(100, 'Maximum 100 lignes par devis'),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 4. LIGNE DE COMMANDE CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const salesOrderItemSchema = z.object({
  product_id: z
    .string({ required_error: 'Le produit est obligatoire pour le suivi des stocks' })
    .uuid('Produit invalide')
    .min(1, 'Le produit est obligatoire pour le suivi des stocks'), // ✅ Made REQUIRED

  description: z
    .string({ required_error: 'La description est obligatoire' })
    .trim()
    .min(1, 'La description est obligatoire')
    .max(500, 'Description trop longue'),

  quantity: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre', required_error: 'La quantité est obligatoire' })
    .positive('La quantité doit être supérieure à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  unit_price: z.coerce
    .number({ invalid_type_error: 'Le prix unitaire doit être un nombre', required_error: 'Le prix unitaire est obligatoire' })
    .positive('Le prix unitaire doit être supérieur à 0')
    .max(9999999.999, 'Le prix unitaire ne peut pas dépasser 9999999.999 TND')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  tax_rate: z.coerce
    .number({ invalid_type_error: 'Le taux de TVA doit être un nombre' })
    .refine(v => [0, 7, 13, 19].includes(v), 'Taux TVA invalide (0, 7, 13 ou 19%)'),

  sort_order: z.coerce.number().int().min(0).optional(),
});

export type SalesOrderItemFormValues = z.infer<typeof salesOrderItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 5. COMMANDE CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const salesOrderSchema = z.object({
  client_id: z
    .string({ required_error: 'Le client est obligatoire' })
    .trim()
    .min(1, 'Le client est obligatoire')
    .uuid('Veuillez sélectionner un client valide'),

  quote_id: z
    .string()
    .uuid('Devis invalide')
    .optional()
    .or(z.literal('')),

  expected_delivery: requiredFutureDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(salesOrderItemSchema)
    .min(1, 'La commande doit contenir au moins une ligne')
    .max(100, 'Maximum 100 lignes par commande'),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 6. BON DE LIVRAISON
// ══════════════════════════════════════════════════════════════════════════════
export const deliveryNoteItemSchema = z.object({
  sales_order_item_id: z
    .string({ required_error: 'La ligne de commande est obligatoire' })
    .trim()
    .min(1, 'La ligne de commande est obligatoire')
    .uuid('Ligne de commande invalide'),

  quantity_delivered: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre' })
    .min(0, 'La quantité ne peut pas être négative')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),
});

// Schéma dynamique pour bon de livraison avec validation de date par rapport à la commande
export const createDeliveryNoteSchema = (orderCreatedDate?: string) => z.object({
  delivery_date: z
    .string({ required_error: 'La date de livraison est obligatoire' })
    .trim()
    .min(1, 'La date de livraison est obligatoire')
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
    }, 'La date de livraison ne peut pas être dans le futur')
    .refine((date) => {
      if (!orderCreatedDate) return true;
      const deliveryDate = new Date(date);
      const orderDate = new Date(orderCreatedDate);
      return deliveryDate >= orderDate;
    }, `La date de livraison doit être supérieure ou égale à la date de commande${orderCreatedDate ? ` (${orderCreatedDate})` : ''}`),

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(deliveryNoteItemSchema)
    .min(1)
    .refine(
      items => items.some(i => Number(i.quantity_delivered) > 0),
      'Au moins une quantité livrée doit être supérieure à 0',
    ),
});

// Schéma par défaut pour compatibilité
export const deliveryNoteSchema = createDeliveryNoteSchema();

export type DeliveryNoteFormValues = z.infer<typeof deliveryNoteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 7. LIGNE DE FACTURE CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const salesInvoiceItemSchema = z.object({
  productId: z.string().uuid('Produit invalide').optional().or(z.literal('')),

  description: z
    .string({ required_error: 'La description est obligatoire' })
    .trim()
    .min(1, 'La description est obligatoire')
    .max(500, 'Description trop longue'),

  quantity: z.coerce
    .number({ invalid_type_error: 'La quantité doit être un nombre', required_error: 'La quantité est obligatoire' })
    .positive('La quantité doit être supérieure à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  unit_price: z.coerce
    .number({ invalid_type_error: 'Le prix unitaire doit être un nombre', required_error: 'Le prix unitaire est obligatoire' })
    .positive('Le prix unitaire doit être supérieur à 0')
    .max(9999999.999, 'Le prix unitaire ne peut pas dépasser 9999999.999 TND')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  tax_rate_value: z.coerce
    .number({ invalid_type_error: 'Le taux de TVA doit être un nombre' })
    .refine(v => [0, 7, 13, 19].includes(v), 'Taux TVA invalide (0, 7, 13 ou 19%)'),
});

export type SalesInvoiceItemFormValues = z.infer<typeof salesInvoiceItemSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 7. FACTURE CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const salesInvoiceSchema = z.object({
  client_id: z
    .string({ required_error: 'Le client est obligatoire' })
    .trim()
    .min(1, 'Le client est obligatoire')
    .uuid('Veuillez sélectionner un client valide'),

  type: z.enum(['NORMAL', 'AVOIR', 'PROFORMA', 'ACOMPTE'], {
    required_error: 'Le type de facture est obligatoire',
    invalid_type_error: 'Type de facture invalide',
  }).default('NORMAL'),

  sales_order_id: z
    .string()
    .uuid('Commande invalide')
    .optional()
    .or(z.literal('')),

  quote_id: z
    .string()
    .uuid('Devis invalide')
    .optional()
    .or(z.literal('')),

  date: requiredIsoDate,

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

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(salesInvoiceItemSchema)
    .min(1, 'La facture doit contenir au moins une ligne')
    .max(100, 'Maximum 100 lignes par facture'),
}).refine(
  (data) => {
    if (!data.due_date || !data.date) return true;
    const invoiceDate = new Date(data.date);
    const dueDate = new Date(data.due_date);
    return dueDate >= invoiceDate;
  },
  {
    message: 'La date d\'échéance doit être postérieure ou égale à la date de facture',
    path: ['due_date'],
  }
);

export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 8. FACTURE RÉCURRENTE
// ══════════════════════════════════════════════════════════════════════════════
export const recurringInvoiceSchema = z.object({
  client_id: z
    .string({ required_error: 'Le client est obligatoire' })
    .trim()
    .min(1, 'Le client est obligatoire')
    .uuid('Veuillez sélectionner un client valide'),

  frequency: z.enum(['monthly', 'quarterly', 'yearly'], {
    required_error: 'La fréquence est obligatoire',
    invalid_type_error: 'Fréquence invalide',
  }),

  start_date: requiredIsoDate,

  end_date: isoDate,

  next_invoice_date: requiredIsoDate,

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

  description: z
    .string({ required_error: 'La description est obligatoire' })
    .trim()
    .min(1, 'La description est obligatoire')
    .max(500, 'Description trop longue'),

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  auto_send: z.boolean().default(false),
}).refine(
  (data) => {
    if (!data.end_date || !data.start_date) return true;
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return endDate > startDate;
  },
  {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['end_date'],
  }
);

export type RecurringInvoiceFormValues = z.infer<typeof recurringInvoiceSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 9. PAIEMENT CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const clientPaymentSchema = (maxAmount: number) =>
  z.object({
    amount: z.coerce
      .number({ required_error: 'Le montant est obligatoire', invalid_type_error: 'Le montant doit être un nombre' })
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

export type ClientPaymentFormValues = z.infer<ReturnType<typeof clientPaymentSchema>>;

// ══════════════════════════════════════════════════════════════════════════════
// 10. UPLOAD SCAN FACTURE CLIENT (OCR)
// ══════════════════════════════════════════════════════════════════════════════
export const uploadSalesInvoiceScanSchema = z.object({
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

  client_id: z
    .string()
    .uuid('Client invalide')
    .optional()
    .or(z.literal('')),
});

export type UploadSalesInvoiceScanFormValues = z.infer<typeof uploadSalesInvoiceScanSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 11. INVITATION CLIENT
// ══════════════════════════════════════════════════════════════════════════════
export const clientInviteSchema = z.object({
  email: z
    .string({ required_error: 'L\'email est obligatoire' })
    .trim()
    .min(1, 'L\'email est obligatoire')
    .email('Adresse email invalide'),

  client_name: z
    .string({ required_error: 'Le nom du client est obligatoire' })
    .trim()
    .min(1, 'Le nom du client est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),

  message: z
    .string()
    .trim()
    .max(1000, 'Le message ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
});

export type ClientInviteFormValues = z.infer<typeof clientInviteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 12. GÉNÉRATION DEVIS PAR IA (texte naturel)
// ══════════════════════════════════════════════════════════════════════════════
export const aiQuoteGeneratorSchema = z.object({
  text: z
    .string({ required_error: 'Le texte est obligatoire' })
    .trim()
    .min(1, 'Le texte est obligatoire')
    .min(10, 'Le texte doit contenir au moins 10 caractères')
    .max(5000, 'Le texte ne peut pas dépasser 5000 caractères'),
});

export type AiQuoteGeneratorFormValues = z.infer<typeof aiQuoteGeneratorSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 13. MISE À JOUR DEVIS
// ══════════════════════════════════════════════════════════════════════════════
export const updateQuoteSchema = z.object({
  valid_until: isoDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),

  items: z
    .array(quoteItemSchema)
    .min(1, 'Le devis doit contenir au moins une ligne')
    .max(100, 'Maximum 100 lignes par devis')
    .optional(),
});

export type UpdateQuoteFormValues = z.infer<typeof updateQuoteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 14. CRÉATION FACTURE DEPUIS COMMANDE
// ══════════════════════════════════════════════════════════════════════════════
export const createInvoiceFromOrderSchema = z.object({
  date: requiredIsoDate,

  due_date: isoDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    if (!data.due_date || !data.date) return true;
    const invoiceDate = new Date(data.date);
    const dueDate = new Date(data.due_date);
    return dueDate >= invoiceDate;
  },
  {
    message: 'La date d\'échéance doit être postérieure ou égale à la date de facture',
    path: ['due_date'],
  }
);

export type CreateInvoiceFromOrderFormValues = z.infer<typeof createInvoiceFromOrderSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 15. CRÉATION COMMANDE DEPUIS DEVIS
// ══════════════════════════════════════════════════════════════════════════════
export const createOrderFromQuoteSchema = z.object({
  expected_delivery: requiredFutureDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),
});

export type CreateOrderFromQuoteFormValues = z.infer<typeof createOrderFromQuoteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 16. ENVOI EMAIL FACTURE
// ══════════════════════════════════════════════════════════════════════════════
export const sendInvoiceEmailSchema = z.object({
  to: z
    .string({ required_error: 'L\'email destinataire est obligatoire' })
    .trim()
    .min(1, 'L\'email destinataire est obligatoire')
    .email('Adresse email invalide'),

  subject: z
    .string({ required_error: 'Le sujet est obligatoire' })
    .trim()
    .min(1, 'Le sujet est obligatoire')
    .max(200, 'Le sujet ne peut pas dépasser 200 caractères'),

  message: z
    .string()
    .trim()
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),
});

export type SendInvoiceEmailFormValues = z.infer<typeof sendInvoiceEmailSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 17. AVOIR / NOTE DE CRÉDIT
// ══════════════════════════════════════════════════════════════════════════════
export const creditNoteSchema = z.object({
  original_invoice_id: z
    .string({ required_error: 'La facture originale est obligatoire' })
    .trim()
    .min(1, 'La facture originale est obligatoire')
    .uuid('Facture invalide'),

  reason: z
    .string({ required_error: 'Le motif est obligatoire' })
    .trim()
    .min(1, 'Le motif est obligatoire')
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),

  amount: z.coerce
    .number({ required_error: 'Le montant est obligatoire', invalid_type_error: 'Le montant doit être un nombre' })
    .positive('Le montant doit être supérieur à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  date: requiredIsoDate,

  notes: z
    .string()
    .trim()
    .max(1000, 'Notes trop longues')
    .optional()
    .or(z.literal('')),
});

export type CreditNoteFormValues = z.infer<typeof creditNoteSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 18. MISE À JOUR STATUT FACTURE
// ══════════════════════════════════════════════════════════════════════════════
export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'], {
    required_error: 'Le statut est obligatoire',
    invalid_type_error: 'Statut invalide',
  }),

  notes: z
    .string()
    .trim()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
});

export type UpdateInvoiceStatusFormValues = z.infer<typeof updateInvoiceStatusSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// 19. ÉCHÉANCIER DE PAIEMENT
// ══════════════════════════════════════════════════════════════════════════════
export const paymentScheduleItemSchema = z.object({
  due_date: requiredIsoDate,

  amount: z.coerce
    .number({ required_error: 'Le montant est obligatoire', invalid_type_error: 'Le montant doit être un nombre' })
    .positive('Le montant doit être supérieur à 0')
    .multipleOf(0.001, 'Précision maximale : 3 décimales'),

  description: z
    .string()
    .trim()
    .max(200, 'Description trop longue')
    .optional()
    .or(z.literal('')),
});

export const paymentScheduleSchema = z.object({
  invoice_id: z
    .string({ required_error: 'La facture est obligatoire' })
    .trim()
    .min(1, 'La facture est obligatoire')
    .uuid('Facture invalide'),

  items: z
    .array(paymentScheduleItemSchema)
    .min(1, 'L\'échéancier doit contenir au moins une échéance')
    .max(50, 'Maximum 50 échéances'),
});

export type PaymentScheduleFormValues = z.infer<typeof paymentScheduleSchema>;
