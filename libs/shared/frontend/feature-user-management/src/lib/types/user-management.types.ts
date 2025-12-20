export interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'guest' | 'user' | 'admin';
  customRoleId: number | null;
  isPending?: boolean;
}

export interface InviteUserDto {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'guest' | 'user' | 'admin';
  customRoleId?: number;
}

export interface InviteUserResponse {
  success: boolean;
  invitationId?: number;
  error?: string;
}

export interface AcceptInvitationDto {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  email?: string;
  error?: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'guest' | 'user' | 'admin';
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
}

export interface CustomRole {
  id: number;
  name: string;
  description: string | null;
  permissions: string | null;
  createdAt: number;
  createdBy: number;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseApi = any;
