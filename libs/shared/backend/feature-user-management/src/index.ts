export { FeatureUserManagementModule } from './lib/feature-user-management.module';
export type { UserManagementModuleOptions } from './lib/feature-user-management.module';

// Invitations
export {
  InvitationsController,
  InvitationsService,
  InvitationTokenService,
  INVITATION_TOKEN_OPTIONS,
  USER_MANAGEMENT_OPTIONS,
} from './lib/invitations';

export type {
  InvitationTokenOptions,
  UserManagementOptions,
} from './lib/invitations';

export {
  InviteUserDto,
  InviteUserResponseDto,
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  ValidateInvitationResponseDto,
} from './lib/invitations/dto';

// Users
export { UsersController } from './lib/users';
export { UserDto, DeleteUserResponseDto } from './lib/users/dto';
