import { Module, DynamicModule } from '@nestjs/common';
import { InvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';
import { InvitationTokenService } from './invitation-token.service.js';
import {
  INVITATIONS_MODULE_OPTIONS,
  type InvitationsModuleOptions,
} from './invitations.types.js';

@Module({})
export class InvitationsModule {
  static forRoot(options: InvitationsModuleOptions): DynamicModule {
    return {
      module: InvitationsModule,
      controllers: [InvitationsController],
      providers: [
        { provide: INVITATIONS_MODULE_OPTIONS, useValue: options },
        InvitationsService,
        InvitationTokenService,
      ],
      exports: [InvitationsService, InvitationTokenService],
    };
  }
}
