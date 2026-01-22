import { Module, DynamicModule } from '@nestjs/common';

import { OpenKingdomDataAccessBackendUsersModule } from '@open-kingdom/shared-backend-data-access-users';
import {
  EmailModule,
  EmailModuleOptions,
} from '@open-kingdom/shared-backend-feature-email';

import { InvitationsController } from './invitations/invitations.controller';
import {
  InvitationsService,
  USER_MANAGEMENT_OPTIONS,
} from './invitations/invitations.service';
import {
  InvitationTokenService,
  INVITATION_TOKEN_OPTIONS,
} from './invitations/invitation-token.service';
import { UsersController } from './users/users.controller';

export interface UserManagementModuleOptions {
  invitationTokenSecret: string;
  invitationExpiryDays?: number;
  frontendBaseUrl: string;
  emailConfig?: EmailModuleOptions;
}

@Module({})
export class FeatureUserManagementModule {
  static forRoot(options: UserManagementModuleOptions): DynamicModule {
    const imports: DynamicModule['imports'] = [
      OpenKingdomDataAccessBackendUsersModule,
    ];

    // Import EmailModule if config provided
    if (options.emailConfig) {
      imports.push(EmailModule.forRoot(options.emailConfig));
    }

    return {
      module: FeatureUserManagementModule,
      imports,
      controllers: [UsersController, InvitationsController],
      providers: [
        {
          provide: USER_MANAGEMENT_OPTIONS,
          useValue: {
            invitationTokenSecret: options.invitationTokenSecret,
            invitationExpiryDays: options.invitationExpiryDays ?? 7,
            frontendBaseUrl: options.frontendBaseUrl,
          },
        },
        {
          provide: INVITATION_TOKEN_OPTIONS,
          useValue: {
            secret: options.invitationTokenSecret,
            expiryDays: options.invitationExpiryDays ?? 7,
          },
        },
        InvitationTokenService,
        InvitationsService,
      ],
      exports: [InvitationsService],
    };
  }
}
