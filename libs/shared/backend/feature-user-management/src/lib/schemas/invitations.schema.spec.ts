import { invitations, InvitationsTableName } from './index';
import { getTableColumns } from 'drizzle-orm';

describe('Invitations', () => {
  const columns = getTableColumns(invitations);

  it('persists to the invitations table', () => {
    expect(InvitationsTableName).toBe('invitations');
  });

  it('no two invitations can share the same token', () => {
    expect(columns.token.isUnique).toBe(true);
  });

  it('new invitations start in pending status', () => {
    expect(columns.status.default).toBe('pending');
  });

  it('ties each invitation to a role', () => {
    expect(columns.roleId).toBeDefined();
    expect(columns.roleId.notNull).toBe(true);
  });
});
