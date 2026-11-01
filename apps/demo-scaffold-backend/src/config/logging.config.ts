import type { LineOptions } from '@open-kingdom/shared-backend-util-logging';

/** What every log line of this app carries, shared by the boot logger and LoggingModule. */
export const loggingConfig: LineOptions = {
  app: 'demo-scaffold-backend',
  project: 'open-kingdom',
  env: process.env['NODE_ENV'] ?? 'development',
  redact: ['password', '*.password', 'token', '*.token', 'authorization'],
};
