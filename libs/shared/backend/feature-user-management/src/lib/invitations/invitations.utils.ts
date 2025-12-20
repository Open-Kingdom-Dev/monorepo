import type { Invitation } from './entities/index.js';
import type {
  ValidationError,
  ValidationSuccess,
  InvitationValidator,
} from './invitations.types.js';

const validationErrors = new Map<string, ValidationError>([
  ['invalidToken', { valid: false, error: 'Invalid or expired token' }],
  ['notFound', { valid: false, error: 'Invitation not found' }],
  [
    'alreadyUsed',
    { valid: false, error: 'Invitation has already been used or expired' },
  ],
  ['tokenMismatch', { valid: false, error: 'Token mismatch' }],
]);

export function getValidationError(key: string): ValidationError {
  const error = validationErrors.get(key);
  if (!error) {
    return { valid: false, error: 'Unknown validation error' };
  }
  return error;
}

const invitationValidators: InvitationValidator[] = [
  (inv, _) => (inv.status !== 'pending' ? 'alreadyUsed' : null),
  (inv, token) => (inv.token !== token ? 'tokenMismatch' : null),
];

export function validateInvitation(
  invitation: Invitation | undefined,
  token: string
): ValidationError | Invitation {
  if (!invitation) {
    return getValidationError('notFound');
  }

  for (const validator of invitationValidators) {
    const errorKey = validator(invitation, token);
    if (errorKey) {
      return getValidationError(errorKey);
    }
  }

  return invitation;
}

export function isValidationError(
  result: ValidationError | Invitation
): result is ValidationError {
  return 'valid' in result && result.valid === false;
}

export function toSuccessResponse(invitation: Invitation): ValidationSuccess {
  return {
    valid: true,
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    role: invitation.role,
  };
}
