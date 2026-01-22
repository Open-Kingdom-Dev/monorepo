import { Test } from '@nestjs/testing';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let invitationsService: jest.Mocked<
    Pick<InvitationsService, 'invite' | 'validate' | 'accept'>
  >;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockInvitationsService = {
      invite: jest.fn(),
      validate: jest.fn(),
      accept: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        { provide: InvitationsService, useValue: mockInvitationsService },
      ],
    }).compile();

    controller = module.get(InvitationsController);
    invitationsService = mockInvitationsService;
  });

  describe('inviting new users', () => {
    const mockRequest = {
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
    };

    it('sends an invitation when requested by authenticated user', async () => {
      invitationsService.invite.mockResolvedValue({
        success: true,
        message: 'Invitation sent successfully',
        token: 'invitation-token',
      });

      const result = await controller.invite(
        { email: 'newuser@example.com' },
        mockRequest as never
      );

      expect(result.success).toBe(true);
      expect(invitationsService.invite).toHaveBeenCalledWith(
        { email: 'newuser@example.com' },
        1
      );
    });

    it('returns failure when user already exists', async () => {
      invitationsService.invite.mockResolvedValue({
        success: false,
        message: 'A user with this email already exists',
      });

      const result = await controller.invite(
        { email: 'existing@example.com' },
        mockRequest as never
      );

      expect(result.success).toBe(false);
    });
  });

  describe('validating invitation links', () => {
    it('confirms a valid invitation and returns details', async () => {
      invitationsService.validate.mockResolvedValue({
        valid: true,
        email: 'user@example.com',
        role: 'user',
      });

      const result = await controller.validate('valid-token');

      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('reports when an invitation link is invalid', async () => {
      invitationsService.validate.mockResolvedValue({
        valid: false,
        error: 'Invalid or expired invitation token',
      });

      const result = await controller.validate('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('accepting invitations', () => {
    it('creates an account when accepting a valid invitation', async () => {
      invitationsService.accept.mockResolvedValue({
        success: true,
        message: 'Account created successfully',
        email: 'user@example.com',
      });

      const result = await controller.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('passes name details when provided', async () => {
      invitationsService.accept.mockResolvedValue({
        success: true,
        message: 'Account created successfully',
        email: 'user@example.com',
      });

      await controller.accept({
        token: 'valid-token',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(invitationsService.accept).toHaveBeenCalledWith({
        token: 'valid-token',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('reports failure for invalid tokens', async () => {
      invitationsService.accept.mockResolvedValue({
        success: false,
        message: 'Invalid invitation',
      });

      const result = await controller.accept({
        token: 'invalid-token',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
    });
  });
});
