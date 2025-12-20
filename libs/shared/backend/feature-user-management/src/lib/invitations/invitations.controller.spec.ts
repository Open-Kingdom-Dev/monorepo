import { Test } from '@nestjs/testing';
import { InvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';

const mockInvitationsService = {
  validateToken: jest.fn(),
  accept: jest.fn(),
};

describe('InvitationsController', () => {
  let controller: InvitationsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        { provide: InvitationsService, useValue: mockInvitationsService },
      ],
    }).compile();

    controller = module.get(InvitationsController);
  });

  describe('validating invitation links', () => {
    it('confirms a valid invitation and returns details', async () => {
      const validResponse = {
        valid: true,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      };
      mockInvitationsService.validateToken.mockResolvedValue(validResponse);

      const result = await controller.validateToken('valid-token');

      expect(result).toEqual(validResponse);
      expect(mockInvitationsService.validateToken).toHaveBeenCalledWith(
        'valid-token'
      );
    });

    it('reports when an invitation link is invalid', async () => {
      mockInvitationsService.validateToken.mockResolvedValue({
        valid: false,
        error: 'Invalid or expired token',
      });

      const result = await controller.validateToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('accepting invitations', () => {
    const acceptDto = {
      token: 'valid-token',
      password: 'SecurePassword123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('creates an account when accepting a valid invitation', async () => {
      mockInvitationsService.accept.mockResolvedValue({
        success: true,
        email: 'user@example.com',
      });

      const result = await controller.accept(acceptDto);

      expect(result.success).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    it('passes all provided details to the service', async () => {
      mockInvitationsService.accept.mockResolvedValue({
        success: true,
        email: 'user@example.com',
      });

      await controller.accept(acceptDto);

      expect(mockInvitationsService.accept).toHaveBeenCalledWith(
        acceptDto.token,
        acceptDto.password,
        acceptDto.firstName,
        acceptDto.lastName
      );
    });

    it('handles acceptance without optional name fields', async () => {
      const minimalDto = {
        token: 'valid-token',
        password: 'SecurePassword123',
      };
      mockInvitationsService.accept.mockResolvedValue({
        success: true,
        email: 'user@example.com',
      });

      await controller.accept(minimalDto);

      expect(mockInvitationsService.accept).toHaveBeenCalledWith(
        minimalDto.token,
        minimalDto.password,
        undefined,
        undefined
      );
    });
  });
});
