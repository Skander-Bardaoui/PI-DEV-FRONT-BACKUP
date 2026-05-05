import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne doit pas dépasser 255 caractères'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Register Schema - Step 1: Account
export const registerStep1Schema = z.object({
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne doit pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom ne doit contenir que des lettres'),
  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne doit contenir que des lettres'),
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne doit pas dépasser 255 caractères'),
  phone_number: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^\+?[1-9]\d{1,14}$/.test(val),
      'Format de téléphone invalide'
    ),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne doit pas dépasser 100 caractères')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type RegisterStep1FormData = z.infer<typeof registerStep1Schema>;

// Register Schema - Step 2: Tenant
export const registerStep2Schema = z.object({
  tenantName: z
    .string()
    .min(1, 'Le nom du tenant est requis')
    .min(2, 'Le nom du tenant doit contenir au moins 2 caractères')
    .max(100, 'Le nom du tenant ne doit pas dépasser 100 caractères'),
  domain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z0-9-]+$/.test(val),
      'Le domaine ne doit contenir que des lettres minuscules, chiffres et tirets'
    ),
  contactEmail: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      'Format d\'email invalide'
    ),
  description: z
    .string()
    .max(500, 'La description ne doit pas dépasser 500 caractères')
    .optional(),
});

export type RegisterStep2FormData = z.infer<typeof registerStep2Schema>;

// Register Schema - Step 3: Business
export const registerStep3Schema = z.object({
  businessName: z
    .string()
    .min(1, 'Le nom de l\'entreprise est requis')
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
    .max(200, 'Le nom de l\'entreprise ne doit pas dépasser 200 caractères'),
  businessEmail: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      'Format d\'email invalide'
    ),
  tax_id: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{7}\/[A-Z]\/[A-Z]\/[A-Z]\/[0-9]{3}$/.test(val),
      'Format du matricule fiscal invalide (ex: 1234567/A/M/E/000)'
    ),
  currency: z
    .string()
    .min(1, 'La devise est requise')
    .length(3, 'La devise doit contenir 3 caractères'),
  address: z.object({
    street: z
      .string()
      .min(1, 'La rue est requise')
      .max(200, 'La rue ne doit pas dépasser 200 caractères'),
    city: z
      .string()
      .min(1, 'La ville est requise')
      .max(100, 'La ville ne doit pas dépasser 100 caractères'),
    postalCode: z
      .string()
      .min(1, 'Le code postal est requis')
      .regex(/^\d{4}$/, 'Le code postal doit contenir exactement 4 chiffres'),
    country: z
      .string()
      .min(1, 'Le pays est requis')
      .max(100, 'Le pays ne doit pas dépasser 100 caractères'),
  }),
  taxRateName: z
    .string()
    .min(1, 'Le nom du taux de TVA est requis')
    .max(100, 'Le nom du taux de TVA ne doit pas dépasser 100 caractères'),
  taxRate: z
    .number()
    .min(0, 'Le taux de TVA doit être supérieur ou égal à 0')
    .max(100, 'Le taux de TVA doit être inférieur ou égal à 100'),
});

export type RegisterStep3FormData = z.infer<typeof registerStep3Schema>;

// Register Schema - Step 4: Plan
export const registerStep4Schema = z.object({
  planId: z
    .string()
    .min(1, 'Veuillez sélectionner un plan'),
  billingCycle: z.enum(['monthly', 'annual'], {
    required_error: 'Le cycle de facturation est requis',
  }),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Vous devez accepter les conditions d\'utilisation',
    }),
});

export type RegisterStep4FormData = z.infer<typeof registerStep4Schema>;

// Complete Register Schema (all steps combined)
// Note: For multi-step forms, validate each step separately
// This combined schema is for reference only
export type RegisterCompleteFormData = RegisterStep1FormData & 
  RegisterStep2FormData & 
  RegisterStep3FormData & 
  RegisterStep4FormData;
