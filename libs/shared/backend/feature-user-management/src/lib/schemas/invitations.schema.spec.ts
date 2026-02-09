import {
  invitations,
  InvitationsTableName,
  Invitation,
  NewInvitation,
} from './invitations.schema';
import { getTableColumns } from 'drizzle-orm';

describe('Invitations Schema', () => {
  const columns = getTableColumns(invitations);

  it('enforces uniqueness on invitation tokens', () => {
    expect(columns.token.isUnique).toBe(true);
  });

  it('assigns guest role by default', () => {
    expect(columns.role.default).toBe('guest');
  });

  it('starts in pending status', () => {
    expect(columns.status.default).toBe('pending');
  });

  it('uses invitations as the table name', () => {
    expect(InvitationsTableName).toBe('invitations');
  });

  describe('type safety', () => {
    it('provides types for existing invitation records', () => {
      const existingInvitation: Invitation = {
        id: 1,
        email: 'invitee@example.com',
        token: 'abc123',
        tokenExpiry: Date.now() + 86400000,
        invitedBy: 1,
        invitedAt: Date.now(),
        role: 'user',
        status: 'pending',
      };

      expect(existingInvitation.id).toBe(1);
    });

    it('provides types for creating new invitation records', () => {
      const newInvitation: NewInvitation = {
        email: 'new@example.com',
        token: 'xyz789',
        tokenExpiry: Date.now() + 86400000,
        invitedBy: 1,
        invitedAt: Date.now(),
        role: 'guest',
      };

      expect(newInvitation.email).toBe('new@example.com');
    });
  });
});
