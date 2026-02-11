import { Module, DynamicModule } from '@nestjs/common';

import { OpenKingdomDataAccessBackendUsersModule } from '@open-kingdom/shared-backend-data-access-users';
import { EmailService } from '@open-kingdom/shared-backend-feature-email';
import { InvitationsService, UserManagementService } from './services';
import { InvitationsController, UsersController } from './controllers';
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
  Role,
  InvitationStatus,
  ValidationResult,
} from './types';

@Module({})
export class FeatureUserManagementModule {
  static forRoot(options: UserManagementModuleOptions): DynamicModule {
    return {
      module: FeatureUserManagementModule,
      imports: [OpenKingdomDataAccessBackendUsersModule],
      controllers: [InvitationsController, UsersController],
      providers: [
        { provide: USER_MANAGEMENT_OPTIONS, useValue: options },
        { provide: EMAIL_SENDER, useExisting: EmailService },
        InvitationsService,
        UserManagementService,
      ],
      exports: [InvitationsService, UserManagementService],
    };
  }
}
