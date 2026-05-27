export interface BuildEmailOptions {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

export function buildRawEmail(options: BuildEmailOptions): string {
  const boundary = `----=_Part_${Date.now()}`;
  let mime = `From: ${options.from}\r\n`;
  mime += `To: ${options.to}\r\n`;
  mime += `Subject: ${options.subject}\r\n`;
  mime += `MIME-Version: 1.0\r\n`;

  if (options.html) {
    mime += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
    mime += `${options.text}\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    mime += `${options.html}\r\n`;
    mime += `--${boundary}--`;
  } else {
    mime += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
    mime += options.text;
  }

  return Buffer.from(mime).toString('base64url');
}
