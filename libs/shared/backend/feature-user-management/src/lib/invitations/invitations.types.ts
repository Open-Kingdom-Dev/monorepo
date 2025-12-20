import type { Invitation } from './entities/index.js';

export const INVITATIONS_MODULE_OPTIONS = Symbol('INVITATIONS_MODULE_OPTIONS');

export interface InvitationsModuleOptions {
  invitationTokenSecret: string;
  invitationExpiryDays?: number;
  frontendBaseUrl: string;
}

export interface TokenPayload {
  email: string;
  invitationId: number;
  exp: number;
  nonce: string;
}

// Validation types
export type ValidationError = { valid: false; error: string };

export type ValidationSuccess = {
  valid: true;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'guest' | 'user' | 'admin' | null;
};

export type InvitationValidator = (
  invitation: Invitation,
  token: string
) => string | null;
