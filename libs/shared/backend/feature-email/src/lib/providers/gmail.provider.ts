import { gmail, auth } from '@googleapis/gmail';
import { EmailMessage, EmailResult, EmailProvider } from '../email.js';

export interface GmailProviderConfig {
  clientEmail: string;
  privateKey: string;
  impersonateEmail: string;
}

export class GmailProvider implements EmailProvider {
  private client: ReturnType<typeof gmail>;
  private defaultFrom: string;

  constructor(config: GmailProviderConfig) {
    const jwt = new auth.JWT({
      email: config.clientEmail,
      key: config.privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      subject: config.impersonateEmail,
    });

    this.client = gmail({ version: 'v1', auth: jwt });
    this.defaultFrom = config.impersonateEmail;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const raw = this.buildRawMessage(message);

    const res = await this.client.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    return { messageId: res.data.id || undefined };
  }

  private buildRawMessage(message: EmailMessage): string {
    const from = message.from || this.defaultFrom;
    const to = message.to.join(', ');
    const contentType = message.html ? 'text/html' : 'text/plain';
    const body = message.html || message.text || '';

    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}; charset=UTF-8`,
    ].join('\r\n');

    const rawMessage = `${headers}\r\n\r\n${body}`;

    return this.toBase64Url(rawMessage);
  }

  private toBase64Url(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
