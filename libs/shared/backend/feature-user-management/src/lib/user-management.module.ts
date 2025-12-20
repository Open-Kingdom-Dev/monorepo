import { Module, DynamicModule } from '@nestjs/common';
import { OpenKingdomDataAccessBackendUsersModule } from '@open-kingdom/shared-backend-data-access-users';
import { DatabaseModule } from './database/index.js';
import { InvitationsModule } from './invitations/index.js';
import { RolesModule } from './roles/index.js';
import { UserManagementController } from './user-management.controller.js';
import type { InvitationsModuleOptions } from './invitations/index.js';

export type UserManagementModuleOptions = InvitationsModuleOptions;

@Module({})
export class UserManagementModule {
  static forRoot(options: UserManagementModuleOptions): DynamicModule {
    return {
      module: UserManagementModule,
      imports: [
        OpenKingdomDataAccessBackendUsersModule,
        DatabaseModule,
        InvitationsModule.forRoot(options),
        RolesModule,
      ],
      controllers: [UserManagementController],
      exports: [InvitationsModule, RolesModule],
    };
  }
}
