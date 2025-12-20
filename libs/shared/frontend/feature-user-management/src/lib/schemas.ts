import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['guest', 'user', 'admin']),
  customRoleId: z.number().optional(),
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

export const acceptInvitationSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.string().optional(),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
