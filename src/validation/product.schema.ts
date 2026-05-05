import { z } from 'zod';

// Product Type Enum
export const ProductTypeSchema = z.enum(['PHYSICAL', 'SERVICE', 'DIGITAL']);

// Base Product Schema (without refinements) - for CREATE operations
const BaseProductSchema = z.object({
  name: z.string({
    required_error: 'Le nom du produit est requis',
    invalid_type_error: 'Le nom doit être une chaîne de caractères',
  })
    .min(1, 'Le nom du produit est requis')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim(),
  
  reference: z.string({
    required_error: 'La référence (SKU) est requise',
    invalid_type_error: 'La référence doit être une chaîne de caractères',
  })
    .min(1, 'La référence (SKU) est requise')
    .max(100, 'La référence ne peut pas dépasser 100 caractères')
    .trim()
    .regex(/^[A-Z0-9-_]+$/, 'La référence doit contenir uniquement des lettres majuscules, chiffres, tirets et underscores'),
  
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim()
    .optional()
    .nullable(),
  
  sale_price_ht: z.number({
    required_error: 'Le prix de vente est requis',
    invalid_type_error: 'Le prix doit être un nombre',
  })
    .min(0.001, 'Le prix de vente doit être supérieur à 0')
    .max(999999999.99, 'Le prix est trop élevé')
    .finite('Le prix doit être un nombre valide'),
  
  purchase_price_ht: z.number({
    invalid_type_error: 'Le coût doit être un nombre',
  })
    .min(0.001, 'Le prix d\'achat doit être supérieur à 0')
    .max(999999999.99, 'Le coût est trop élevé')
    .finite('Le coût doit être un nombre valide')
    .optional()
    .nullable(),
  
  current_stock: z.number({
    invalid_type_error: 'La quantité doit être un nombre',
  })
    .min(0, 'La quantité doit être positive ou zéro')
    .max(999999999, 'La quantité est trop élevée')
    .int('La quantité doit être un nombre entier (ex: 1, 2, 3...)')
    .finite('La quantité doit être un nombre valide')
    .optional()
    .nullable(),
  
  min_stock_threshold: z.number({
    invalid_type_error: 'La quantité minimale doit être un nombre',
  })
    .min(0, 'La quantité minimale doit être positive ou zéro')
    .max(999999999, 'La quantité minimale est trop élevée')
    .int('La quantité minimale doit être un nombre entier (ex: 1, 2, 3...)')
    .finite('La quantité minimale doit être un nombre valide')
    .optional()
    .nullable(),
  
  category_id: z.string({
    required_error: 'Veuillez sélectionner une catégorie',
    invalid_type_error: 'Veuillez sélectionner une catégorie',
  })
    .min(1, 'Veuillez sélectionner une catégorie')
    .uuid('Veuillez sélectionner une catégorie valide'),
  
  default_supplier_id: z.string()
    .uuid('Veuillez sélectionner un fournisseur valide')
    .optional()
    .nullable(),
  
  warehouse_id: z.string()
    .uuid('Veuillez sélectionner un entrepôt valide')
    .optional()
    .nullable(),
  
  unit: z.string()
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères')
    .trim()
    .optional()
    .nullable(),
  
  barcode: z.string()
    .max(100, 'Le code-barres ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .nullable(),
  
  weight: z.number()
    .min(0, 'Le poids doit être positif ou zéro')
    .max(999999.99, 'Le poids est trop élevé')
    .finite('Le poids doit être un nombre valide')
    .optional()
    .nullable(),
  
  tax_rate: z.number()
    .min(0, 'Le taux de TVA doit être positif ou zéro')
    .max(100, 'Le taux de TVA ne peut pas dépasser 100%')
    .finite('Le taux de TVA doit être un nombre valide')
    .optional()
    .nullable(),
  
  is_stockable: z.boolean()
    .optional()
    .nullable(),
  
  type: ProductTypeSchema
    .optional()
    .nullable(),
  
  is_active: z.boolean()
    .optional()
    .nullable(),
  
  image_url: z.string()
    .url('URL d\'image invalide')
    .max(500, 'L\'URL de l\'image ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
});

// Create Product Schema (with refinements)
export const CreateProductSchema = BaseProductSchema.refine((data) => {
  // Purchase price must be less than sale price
  if (data.purchase_price_ht !== null && data.purchase_price_ht !== undefined && data.purchase_price_ht > 0 &&
      data.sale_price_ht !== null && data.sale_price_ht !== undefined) {
    return data.purchase_price_ht < data.sale_price_ht;
  }
  return true;
}, {
  message: 'Le prix d\'achat doit être inférieur au prix de vente',
  path: ['purchase_price_ht'],
});

// Update Product Schema - more lenient for updates
export const UpdateProductSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du produit est requis')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim()
    .optional(),
  
  reference: z.string()
    .min(1, 'La référence (SKU) est requise')
    .max(100, 'La référence ne peut pas dépasser 100 caractères')
    .trim()
    .regex(/^[A-Z0-9-_]+$/, 'La référence doit contenir uniquement des lettres majuscules, chiffres, tirets et underscores')
    .optional(),
  
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim()
    .optional()
    .nullable(),
  
  sale_price_ht: z.number()
    .min(0.001, 'Le prix de vente doit être supérieur à 0')
    .max(999999999.99, 'Le prix est trop élevé')
    .finite('Le prix doit être un nombre valide')
    .optional(),
  
  purchase_price_ht: z.number()
    .min(0.001, 'Le prix d\'achat doit être supérieur à 0')
    .max(999999999.99, 'Le coût est trop élevé')
    .finite('Le coût doit être un nombre valide')
    .optional()
    .nullable(),
  
  current_stock: z.number()
    .min(0, 'La quantité doit être positive ou zéro')
    .max(999999999, 'La quantité est trop élevée')
    .int('La quantité doit être un nombre entier (ex: 1, 2, 3...)')
    .finite('La quantité doit être un nombre valide')
    .optional()
    .nullable(),
  
  min_stock_threshold: z.number()
    .min(0, 'La quantité minimale doit être positive ou zéro')
    .max(999999999, 'La quantité minimale est trop élevée')
    .int('La quantité minimale doit être un nombre entier (ex: 1, 2, 3...)')
    .finite('La quantité minimale doit être un nombre valide')
    .optional()
    .nullable(),
  
  // For updates, allow empty string or valid UUID
  category_id: z.union([
    z.string().uuid('Veuillez sélectionner une catégorie valide'),
    z.literal(''),
  ]).optional(),
  
  default_supplier_id: z.string()
    .uuid('Veuillez sélectionner un fournisseur valide')
    .optional()
    .nullable(),
  
  warehouse_id: z.union([
    z.string().uuid('Veuillez sélectionner un entrepôt valide'),
    z.literal(''),
  ]).optional()
    .nullable(),
  
  unit: z.string()
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères')
    .trim()
    .optional()
    .nullable(),
  
  barcode: z.string()
    .max(100, 'Le code-barres ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .nullable(),
  
  weight: z.number()
    .min(0, 'Le poids doit être positif ou zéro')
    .max(999999.99, 'Le poids est trop élevé')
    .finite('Le poids doit être un nombre valide')
    .optional()
    .nullable(),
  
  tax_rate: z.number()
    .min(0, 'Le taux de TVA doit être positif ou zéro')
    .max(100, 'Le taux de TVA ne peut pas dépasser 100%')
    .finite('Le taux de TVA doit être un nombre valide')
    .optional()
    .nullable(),
  
  is_stockable: z.boolean()
    .optional()
    .nullable(),
  
  type: ProductTypeSchema
    .optional()
    .nullable(),
  
  is_active: z.boolean()
    .optional()
    .nullable(),
  
  image_url: z.string()
    .url('URL d\'image invalide')
    .max(500, 'L\'URL de l\'image ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
}).refine((data) => {
  // Purchase price must be less than sale price (only check if both are provided and > 0)
  if (data.purchase_price_ht !== null && data.purchase_price_ht !== undefined && data.purchase_price_ht > 0 &&
      data.sale_price_ht !== null && data.sale_price_ht !== undefined && data.sale_price_ht > 0) {
    return data.purchase_price_ht < data.sale_price_ht;
  }
  return true;
}, {
  message: 'Le prix d\'achat doit être inférieur au prix de vente',
  path: ['purchase_price_ht'],
});

// Create Service Schema (with service-specific validations)
export const CreateServiceSchema = BaseProductSchema.extend({
  category_id: z.string({
    required_error: 'Veuillez sélectionner une catégorie',
    invalid_type_error: 'Veuillez sélectionner une catégorie',
  })
    .min(1, 'Veuillez sélectionner une catégorie')
    .uuid('Veuillez sélectionner une catégorie valide'),
  
  sale_price_ht: z.number({
    required_error: 'Le prix de vente est requis',
    invalid_type_error: 'Le prix doit être un nombre',
  })
    .min(0.001, 'Le prix doit être supérieur à 0')
    .max(999999999.99, 'Le prix est trop élevé')
    .finite('Le prix doit être un nombre valide'),
}).refine((data) => {
  // Purchase price must be less than sale price
  if (data.purchase_price_ht !== null && data.purchase_price_ht !== undefined && data.purchase_price_ht > 0 &&
      data.sale_price_ht !== null && data.sale_price_ht !== undefined) {
    return data.purchase_price_ht < data.sale_price_ht;
  }
  return true;
}, {
  message: 'Le prix d\'achat doit être inférieur au prix de vente',
  path: ['purchase_price_ht'],
});

// Update Service Schema (with service-specific validations)
export const UpdateServiceSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du service est requis')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim()
    .optional(),
  
  reference: z.string()
    .min(1, 'La référence (SKU) est requise')
    .max(100, 'La référence ne peut pas dépasser 100 caractères')
    .trim()
    .regex(/^[A-Z0-9-_]+$/, 'La référence doit contenir uniquement des lettres majuscules, chiffres, tirets et underscores')
    .optional(),
  
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim()
    .optional()
    .nullable(),
  
  sale_price_ht: z.number()
    .min(0.001, 'Le prix doit être supérieur à 0')
    .max(999999999.99, 'Le prix est trop élevé')
    .finite('Le prix doit être un nombre valide')
    .optional(),
  
  // For updates, allow empty string or valid UUID
  category_id: z.union([
    z.string().uuid('Veuillez sélectionner une catégorie valide'),
    z.literal(''),
  ]).optional(),
  
  unit: z.string()
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères')
    .trim()
    .optional()
    .nullable(),
  
  tax_rate_id: z.string()
    .uuid('Veuillez sélectionner un taux de TVA valide')
    .optional()
    .nullable(),
  
  is_stockable: z.boolean()
    .optional()
    .nullable(),
  
  type: ProductTypeSchema
    .optional()
    .nullable(),
  
  is_active: z.boolean()
    .optional()
    .nullable(),
}).refine((data) => {
  // No refinements needed for service updates
  return true;
});

// Query Products Schema
export const QueryProductsSchema = z.object({
  search: z.string()
    .max(255, 'La recherche ne peut pas dépasser 255 caractères')
    .trim()
    .optional(),
  
  category_id: z.string()
    .uuid('ID de catégorie invalide')
    .optional(),
  
  is_active: z.boolean()
    .optional(),
  
  low_stock: z.boolean()
    .optional(),
  
  type: ProductTypeSchema
    .optional(),
});

// Generate SKU Schema
export const GenerateSkuSchema = z.object({
  category_name: z.string()
    .max(100, 'Le nom de catégorie ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .nullable(),
  
  brand: z.string()
    .max(100, 'La marque ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .nullable(),
  
  name: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim()
    .optional()
    .nullable(),
  
  unit: z.string()
    .max(50, 'L\'unité ne peut pas dépasser 50 caractères')
    .trim()
    .optional()
    .nullable(),
  
  extra_attribute: z.string()
    .max(100, 'L\'attribut supplémentaire ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .nullable(),
  
  type: ProductTypeSchema
    .optional()
    .nullable(),
});

// Bulk Labels Schema
export const BulkLabelsSchema = z.object({
  product_ids: z.array(z.string().uuid('ID de produit invalide'))
    .min(1, 'Au moins un produit doit être sélectionné')
    .max(100, 'Vous ne pouvez pas générer plus de 100 étiquettes à la fois'),
});

// Scan Service Description Schema
export const ScanServiceDescriptionSchema = z.object({
  description: z.string({
    required_error: 'La description est requise',
    invalid_type_error: 'La description doit être une chaîne de caractères',
  })
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim(),
});

// Type exports
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
export type QueryProductsInput = z.infer<typeof QueryProductsSchema>;
export type GenerateSkuInput = z.infer<typeof GenerateSkuSchema>;
export type BulkLabelsInput = z.infer<typeof BulkLabelsSchema>;
export type ScanServiceDescriptionInput = z.infer<typeof ScanServiceDescriptionSchema>;

// Helper function to get validation errors
export function getProductValidationErrors(data: unknown) {
  const result = CreateProductSchema.safeParse(data);
  if (!result.success) {
    return result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }
  return null;
}
