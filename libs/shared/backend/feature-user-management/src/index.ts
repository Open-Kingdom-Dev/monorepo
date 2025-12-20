// Main Module
export { UserManagementModule } from './lib/user-management.module.js';
export type { UserManagementModuleOptions } from './lib/user-management.module.js';

// Database
export { DatabaseModule } from './lib/database/index.js';

// Invitations
export {
  InvitationsModule,
  InvitationsService,
  InvitationTokenService,
  INVITATIONS_MODULE_OPTIONS,
  type InvitationsModuleOptions,
  type TokenPayload,
  InviteUserDto,
  InviteUserResponseDto,
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  ValidateTokenResponseDto,
  invitations,
  InvitationsTableName,
  type Invitation,
  type NewInvitation,
} from './lib/invitations/index.js';

// Roles
export {
  RolesModule,
  RolesService,
  CreateRoleDto,
  CustomRoleResponseDto,
  DeleteRoleResponseDto,
  customRoles,
  CustomRolesTableName,
  type CustomRole,
  type NewCustomRole,
} from './lib/roles/index.js';

// Guards & Decorators
export { RolesGuard } from './lib/guards/index.js';
export { Roles, ROLES_KEY } from './lib/decorators/index.js';
