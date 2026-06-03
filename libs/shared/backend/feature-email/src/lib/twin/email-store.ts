import { simpleParser } from 'mailparser';
import crypto from 'crypto';

export interface CapturedEmail {
  id: string;
  threadId: string;
  to: string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  timestamp: string;
  raw: string;
}

export class EmailStore {
  private emails: CapturedEmail[] = [];

  async capture(rawBase64Url: string): Promise<CapturedEmail> {
    const mimeBuffer = Buffer.from(rawBase64Url, 'base64url');
    const parsed = await simpleParser(mimeBuffer);

    const to = parsed.to
      ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]).flatMap((addr) =>
          addr.value.map((v) => v.address || '')
        )
      : [];
    const from = parsed.from?.value?.[0]?.address || '';
    const subject = parsed.subject || '';
    const text = parsed.text;
    const html = parsed.html || undefined;

    const id = `msg-${crypto.randomUUID()}`;
    const threadId = `thread-${crypto.randomUUID()}`;
    const emailEntry: CapturedEmail = {
      id,
      threadId,
      to,
      from,
      subject,
      text,
      html,
      timestamp: new Date().toISOString(),
      raw: rawBase64Url,
    };

    this.emails.unshift(emailEntry); // LIFO: prepend to list
    return emailEntry;
  }

  query(toAddress?: string): CapturedEmail[] {
    if (!toAddress) {
      return [...this.emails];
    }
    const filterAddr = toAddress.toLowerCase();
    return this.emails.filter((email) =>
      email.to.some((addr) => addr.toLowerCase() === filterAddr)
    );
  }

  clear(): void {
    this.emails = [];
  }
}
