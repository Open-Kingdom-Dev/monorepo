import {
  inviteUserSchema,
  acceptInvitationSchema,
  createRoleSchema,
} from './schemas';

describe('inviteUserSchema', () => {
  describe('email validation', () => {
    it('accepts valid email addresses', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'user',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty email', () => {
      const result = inviteUserSchema.safeParse({
        email: '',
        role: 'user',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required');
      }
    });

    it('rejects invalid email format', () => {
      const result = inviteUserSchema.safeParse({
        email: 'not-an-email',
        role: 'user',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });
  });

  describe('role validation', () => {
    it('accepts guest role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'guest',
      });

      expect(result.success).toBe(true);
    });

    it('accepts user role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'user',
      });

      expect(result.success).toBe(true);
    });

    it('accepts admin role', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'admin',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid roles', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'superuser',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('accepts invitations without first name', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'user',
      });

      expect(result.success).toBe(true);
    });

    it('accepts invitations without last name', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'user',
      });

      expect(result.success).toBe(true);
    });

    it('accepts custom role ID when provided', () => {
      const result = inviteUserSchema.safeParse({
        email: 'user@example.com',
        role: 'user',
        customRoleId: 42,
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('acceptInvitationSchema', () => {
  describe('password validation', () => {
    it('accepts passwords of 8 or more characters', () => {
      const result = acceptInvitationSchema.safeParse({
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = acceptInvitationSchema.safeParse({
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 8 characters'
        );
      }
    });

    it('accepts exactly 8 character passwords', () => {
      const result = acceptInvitationSchema.safeParse({
        password: '12345678',
        confirmPassword: '12345678',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('password confirmation', () => {
    it('validates when passwords match', () => {
      const result = acceptInvitationSchema.safeParse({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });

      expect(result.success).toBe(true);
    });

    it('fails when passwords do not match', () => {
      const result = acceptInvitationSchema.safeParse({
        password: 'SecurePassword123',
        confirmPassword: 'DifferentPassword',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Passwords do not match');
        expect(result.error.issues[0].path).toContain('confirmPassword');
      }
    });

    it('requires confirmation password to be provided', () => {
      const result = acceptInvitationSchema.safeParse({
        password: 'SecurePassword123',
        confirmPassword: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please confirm your password'
        );
      }
    });
  });

  describe('optional name fields', () => {
    it('accepts registration without name', () => {
      const result = acceptInvitationSchema.safeParse({
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });

      expect(result.success).toBe(true);
    });

    it('accepts registration with first name only', () => {
      const result = acceptInvitationSchema.safeParse({
        firstName: 'John',
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });

      expect(result.success).toBe(true);
    });

    it('accepts registration with full name', () => {
      const result = acceptInvitationSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('createRoleSchema', () => {
  describe('name validation', () => {
    it('accepts valid role names', () => {
      const result = createRoleSchema.safeParse({
        name: 'Editor',
      });

      expect(result.success).toBe(true);
    });

    it('rejects empty role names', () => {
      const result = createRoleSchema.safeParse({
        name: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Role name is required');
      }
    });
  });

  describe('description', () => {
    it('accepts roles without description', () => {
      const result = createRoleSchema.safeParse({
        name: 'Editor',
      });

      expect(result.success).toBe(true);
    });

    it('accepts roles with description', () => {
      const result = createRoleSchema.safeParse({
        name: 'Editor',
        description: 'Can edit and publish content',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Can edit and publish content');
      }
    });
  });
});
