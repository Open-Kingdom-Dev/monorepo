export { EmailModule } from './lib/email.js';
export type { EmailModuleOptions } from './lib/email.js';

export { EMAIL_PROVIDER, GMAIL_TWIN_PROVIDER } from './lib/email.types.js';
export type {
  EmailProvider,
  EmailMessage,
  EmailResult,
  GmailTwinErrorMode,
  CapturedEmail,
} from './lib/email.types.js';

export { EmailService } from './lib/email.service.js';
export { EmailController } from './lib/email.controller.js';
export { SendEmailDto, SendEmailResponseDto } from './lib/email.dto.js';

export {
  GmailProvider,
  GmailTwinProvider,
  OffEmailProvider,
} from './lib/providers/index.js';
export type {
  GmailProviderConfig,
  GmailTwinProviderConfig,
} from './lib/providers/index.js';
