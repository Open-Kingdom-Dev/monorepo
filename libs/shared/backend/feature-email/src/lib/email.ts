import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import {
  GmailProvider,
  GmailProviderConfig,
} from './providers/gmail.provider.js';
import {
  GmailTwinProvider,
  GmailTwinProviderConfig,
} from './providers/gmail-twin.provider.js';
import { OffEmailProvider } from './providers/off.provider.js';
import { EmailService } from './email.service.js';
import { EmailController } from './email.controller.js';
import { EMAIL_PROVIDER, GMAIL_TWIN_PROVIDER } from './email.types.js';

export { EMAIL_PROVIDER } from './email.types.js';
export type {
  EmailMessage,
  EmailResult,
  EmailProvider,
} from './email.types.js';

// Discriminated union of module options
export type EmailModuleOptions =
  | { provider: 'gmail'; config: GmailProviderConfig }
  | { provider: 'gmail-twin'; config?: GmailTwinProviderConfig }
  | { provider: 'off' };

// Module
@Module({})
export class EmailModule {
  static forRoot(options: EmailModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: EMAIL_PROVIDER,
        useFactory: (gmailTwinProvider?: GmailTwinProvider) => {
          switch (options.provider) {
            case 'gmail':
              return new GmailProvider(options.config);
            case 'gmail-twin':
              return gmailTwinProvider;
            case 'off':
              return new OffEmailProvider();
          }
        },
        inject: [{ token: GMAIL_TWIN_PROVIDER, optional: true }],
      },
      EmailService,
    ];

    const exportsList: Array<Type<unknown> | string | symbol> = [EmailService];

    if (options.provider === 'gmail-twin') {
      providers.push({
        provide: GMAIL_TWIN_PROVIDER,
        useValue: new GmailTwinProvider(options.config),
      });
      exportsList.push(GMAIL_TWIN_PROVIDER);
    }

    return {
      module: EmailModule,
      global: true,
      controllers: [EmailController],
      providers,
      exports: exportsList,
    };
  }
}
