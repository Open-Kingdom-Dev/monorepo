import { invitations, InvitationsTableName } from './invitations.schema';

describe('Invitations Schema', () => {
  it('should have correct table name', () => {
    expect(InvitationsTableName).toBe('invitations');
  });

  it('should have an invitations table defined', () => {
    expect(invitations).toBeDefined();
  });
});
