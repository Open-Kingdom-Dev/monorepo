import { Module, DynamicModule } from '@nestjs/common';
import {
  GmailProvider,
  GmailProviderConfig,
} from './providers/gmail.provider.js';
import { EmailService } from './email.service.js';
import { EmailController } from './email.controller.js';
import { EMAIL_PROVIDER } from './email.types.js';

export { EMAIL_PROVIDER } from './email.types.js';
export type {
  EmailMessage,
  EmailResult,
  EmailProvider,
} from './email.types.js';

// Extensible for future providers
export type EmailModuleOptions = {
  provider: 'gmail';
  config: GmailProviderConfig;
};

// Module
@Module({})
export class EmailModule {
  static forRoot(options: EmailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      controllers: [EmailController],
      providers: [
        {
          provide: EMAIL_PROVIDER,
          useFactory: () => {
            switch (options.provider) {
              case 'gmail':
                return new GmailProvider(options.config);
            }
          },
        },
        EmailService,
      ],
      exports: [EmailService],
    };
  }
}
