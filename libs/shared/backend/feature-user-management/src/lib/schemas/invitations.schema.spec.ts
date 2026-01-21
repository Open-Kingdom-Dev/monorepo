import {
  invitations,
  InvitationsTableName,
  Invitation,
  NewInvitation,
} from './invitations.schema';
import { getTableColumns } from 'drizzle-orm';

describe('Invitations Schema', () => {
  const columns = getTableColumns(invitations);

  describe('inviting new users', () => {
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
  });

  describe('invitation lifecycle', () => {
    it('starts in pending status by default', () => {
      expect(columns.status.default).toBe('pending');
    });

    it('supports pending, accepted, and expired states', () => {
      // Type check ensures only valid statuses can be assigned
      const validStatuses: Invitation['status'][] = [
        'pending',
        'accepted',
        'expired',
      ];
      expect(validStatuses).toHaveLength(3);
    });

    it('enforces expiry for security', () => {
      expect(columns.tokenExpiry).toBeDefined();
      expect(columns.tokenExpiry.notNull).toBe(true);
    });
  });

  describe('type exports', () => {
    it('exports table name for consistent references', () => {
      expect(InvitationsTableName).toBe('invitations');
    });

    it('provides type inference for queries and inserts', () => {
      // Compile-time check - if these types don't work, TypeScript will fail
      const mockInvitation: Invitation = {
        id: 1,
        email: 'invitee@example.com',
        token: 'abc123',
        tokenExpiry: Date.now() + 86400000,
        invitedBy: 1,
        invitedAt: Date.now(),
        status: 'pending',
      };

      const mockNewInvitation: NewInvitation = {
        email: 'new@example.com',
        token: 'xyz789',
        tokenExpiry: Date.now() + 86400000,
        invitedBy: 1,
        invitedAt: Date.now(),
      };

      expect(mockInvitation.email).toBe('invitee@example.com');
      expect(mockNewInvitation.email).toBe('new@example.com');
    });
  });
});
