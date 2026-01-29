import {
  invitations,
  InvitationsTableName,
  Invitation,
  NewInvitation,
} from './invitations.schema';
import { getTableColumns } from 'drizzle-orm';

describe('Invitations Schema', () => {
  const columns = getTableColumns(invitations);

  describe('invitation details', () => {
    it('stores the invited email address', () => {
      expect(columns.email).toBeDefined();
      expect(columns.email.notNull).toBe(true);
    });

    it('generates a unique invitation token', () => {
      expect(columns.token).toBeDefined();
      expect(columns.token.notNull).toBe(true);
      expect(columns.token.isUnique).toBe(true);
    });

    it('records when the invitation was sent', () => {
      expect(columns.invitedAt).toBeDefined();
      expect(columns.invitedAt.notNull).toBe(true);
    });

    it('tracks who sent the invitation', () => {
      expect(columns.invitedBy).toBeDefined();
      expect(columns.invitedBy.notNull).toBe(true);
    });

    it('assigns guest role by default', () => {
      expect(columns.role).toBeDefined();
      expect(columns.role.notNull).toBe(true);
      expect(columns.role.default).toBe('guest');
    });
  });

  describe('invitation lifecycle', () => {
    it('starts in pending status', () => {
      expect(columns.status.default).toBe('pending');
    });

    it('has an expiry date for security', () => {
      expect(columns.tokenExpiry).toBeDefined();
      expect(columns.tokenExpiry.notNull).toBe(true);
    });
  });

  describe('database table', () => {
    it('uses invitations as the table name', () => {
      expect(InvitationsTableName).toBe('invitations');
    });
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
