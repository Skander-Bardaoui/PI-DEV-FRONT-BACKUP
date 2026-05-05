import { z } from 'zod';

export const teamInvitationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  role: z.enum(['BUSINESS_ADMIN', 'TEAM_MEMBER', 'ACCOUNTANT'], {
    required_error: 'Role is required',
  }),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name must contain only letters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name must contain only letters'),
});

export type TeamInvitationFormData = z.infer<typeof teamInvitationSchema>;
