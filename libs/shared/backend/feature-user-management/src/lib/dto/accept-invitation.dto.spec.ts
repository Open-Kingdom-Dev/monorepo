import { AcceptInvitationDto } from './accept-invitation.dto';

describe('AcceptInvitationDto', () => {
  describe('accepting an invitation', () => {
    it('captures the invitation token', () => {
      const dto = new AcceptInvitationDto();
      dto.token = 'abc123';
      dto.password = 'securePassword123';

      expect(dto.token).toBe('abc123');
    });

    it('captures the new password', () => {
      const dto = new AcceptInvitationDto();
      dto.token = 'abc123';
      dto.password = 'securePassword123';

      expect(dto.password).toBe('securePassword123');
    });
  });

  describe('user profile', () => {
    it('captures the user name when provided', () => {
      const dto = new AcceptInvitationDto();
      dto.token = 'abc123';
      dto.password = 'securePassword123';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      expect(dto.firstName).toBe('John');
      expect(dto.lastName).toBe('Doe');
    });

    it('allows omitting name fields', () => {
      const dto = new AcceptInvitationDto();
      dto.token = 'abc123';
      dto.password = 'securePassword123';

      expect(dto.firstName).toBeUndefined();
      expect(dto.lastName).toBeUndefined();
    });
  });
});
