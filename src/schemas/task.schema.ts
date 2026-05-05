import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    required_error: 'Priority is required',
  }),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'], {
    required_error: 'Status is required',
  }),
  dueDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true; // Optional field
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      { message: 'Due date cannot be in the past' }
    )
    .or(z.literal('')),
  assignedToIds: z.array(z.string()).optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
