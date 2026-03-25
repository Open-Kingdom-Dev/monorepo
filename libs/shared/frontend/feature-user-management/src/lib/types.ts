export type Role = string;

export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
}

export interface Invitation {
  id: number;
  email: string;
  tokenExpiry: number;
  invitedBy: number;
  invitedAt: number;
  roleId: number;
  status: InvitationStatus;
}
