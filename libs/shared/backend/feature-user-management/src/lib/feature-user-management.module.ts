import { Module, DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { OpenKingdomDataAccessBackendUsersModule } from '@open-kingdom/shared-backend-data-access-users';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';
import {
  InvitationsService,
  UserManagementService,
  RolesService,
  PermissionsService,
  UserRolesService,
  SeedService,
} from './services';
import {
  InvitationsController,
  UsersController,
  RolesController,
  PermissionsController,
  UserRolesController,
} from './controllers';
import { USER_MANAGEMENT_OPTIONS, EMAIL_SENDER } from './types';
import type { UserManagementModuleOptions } from './types';

export {
  USER_MANAGEMENT_OPTIONS,
  EMAIL_SENDER,
  INVITATION_STATUS,
} from './types';
export type {
  UserManagementModuleOptions,
  EmailSender,
  AuthenticatedRequest,
  InvitationStatus,
  ValidationResult,
} from './types';

@Module({})
export class FeatureUserManagementModule {
  static forRoot(options: UserManagementModuleOptions): DynamicModule {
    return {
      module: FeatureUserManagementModule,
      global: true,
      imports: [OpenKingdomDataAccessBackendUsersModule, DiscoveryModule],
      controllers: [
        InvitationsController,
        UsersController,
        RolesController,
        PermissionsController,
        UserRolesController,
      ],
      providers: [
        { provide: USER_MANAGEMENT_OPTIONS, useValue: options },
        // Optional: hosts without the email stack (e.g. embedded mode) can
        // omit EmailModule — InvitationsService already tolerates a null
        // sender (invites are created, just not emailed).
        {
          provide: EMAIL_SENDER,
          useFactory: (email?: EmailService) => email ?? null,
          inject: [{ token: EmailService, optional: true }],
        },
        InvitationsService,
        UserManagementService,
        RolesService,
        PermissionsService,
        UserRolesService,
        SeedService,
      ],
      exports: [
        InvitationsService,
        UserManagementService,
        RolesService,
        PermissionsService,
        UserRolesService,
      ],
    };
  }
}
