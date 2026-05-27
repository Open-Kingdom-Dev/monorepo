import { Module, DynamicModule } from '@nestjs/common';
import { GmailTwinServerController } from './gmail-twin-server.controller.js';
import { GmailTwinServerService } from './gmail-twin-server.service.js';
import { BearerJwtGuard } from './bearer-jwt.guard.js';
import { GmailTwinConfig } from './gmail-twin-server.config.js';
import { GMAIL_TWIN_CONFIG } from './constants.js';

@Module({})
export class GmailTwinServerModule {
  static forRoot(config: GmailTwinConfig): DynamicModule {
    return {
      module: GmailTwinServerModule,
      controllers: [GmailTwinServerController],
      providers: [
        {
          provide: GMAIL_TWIN_CONFIG,
          useValue: config,
        },
        GmailTwinServerService,
        BearerJwtGuard,
      ],
      exports: [GmailTwinServerService, BearerJwtGuard, GMAIL_TWIN_CONFIG],
    };
  }
}
