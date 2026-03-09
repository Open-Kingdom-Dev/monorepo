import type { Request } from 'express';

// Injection tokens
export const USER_MANAGEMENT_OPTIONS = 'USER_MANAGEMENT_OPTIONS';
export const EMAIL_SENDER = 'EMAIL_SENDER';

// Module options
export interface UserManagementModuleOptions {
  invitationTokenSecret: string;
  invitationExpiryDays?: number;
  frontendBaseUrl: string;
}

// Request types
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string | null;
    permissions: string[];
  };
}

// Domain types
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
} as const;

export interface ValidationResult {
  valid: boolean;
  email?: string;
  roleId?: number;
}

// Integration interfaces
export interface EmailSender {
  send(message: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ success: boolean; error?: string }>;
}
