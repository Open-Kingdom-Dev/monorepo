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

// DI token
export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
