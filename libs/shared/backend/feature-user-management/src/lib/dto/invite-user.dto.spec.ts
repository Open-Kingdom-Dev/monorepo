import { InviteUserDto } from './invite-user.dto';

describe('InviteUserDto', () => {
  describe('invitation details', () => {
    it('captures the email address to invite', () => {
      const dto = new InviteUserDto();
      dto.email = 'user@example.com';

      expect(dto.email).toBe('user@example.com');
    });

    it('captures the role for the invitee', () => {
      const dto = new InviteUserDto();
      dto.email = 'user@example.com';
      dto.role = 'admin';

      expect(dto.role).toBe('admin');
    });

    it('allows omitting the role', () => {
      const dto = new InviteUserDto();
      dto.email = 'user@example.com';

      expect(dto.role).toBeUndefined();
    });
  });
});
