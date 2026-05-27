// Types
export interface EmailMessage {
  to: string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResult {
  messageId?: string;
}

// Provider interface
export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}

// DI tokens
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
export const GMAIL_TWIN_PROVIDER = Symbol('GMAIL_TWIN_PROVIDER');

export type GmailTwinErrorMode =
  | 'insufficient-permissions'
  | 'rate-limit'
  | 'invalid-recipient';

export interface CapturedEmail {
  id: string;
  threadId: string;
  to: string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  timestamp: string;
}
