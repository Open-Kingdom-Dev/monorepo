import type {
  ErrorHandlerConfig,
  HandleErrorOptions,
  LoggerFn,
  NotificationHandlerFn,
} from './error-autologger.types';
import { ErrorAdapter } from './error-autologger.adapter';

export interface ErrorReporterConfig extends ErrorHandlerConfig {
  adapter?: ErrorAdapter;
}

const defaultLogger: LoggerFn = (message) => console.error('[Error]', message);
const defaultNotificationHandler: NotificationHandlerFn = (message) =>
  console.warn('[Notification]', message);

// Core error reporting class.
// Adapts errors and routes them to logger and notification handlers.
export class ErrorReporter {
  private logger: LoggerFn;
  private notificationHandler: NotificationHandlerFn;
  private adapter: ErrorAdapter;

  constructor(config: ErrorReporterConfig = {}) {
    this.logger = config.logger ?? defaultLogger;
    this.notificationHandler =
      config.notificationHandler ?? defaultNotificationHandler;
    this.adapter = config.adapter ?? new ErrorAdapter();
  }

  report(error: unknown, options: HandleErrorOptions = {}): void {
    const { notify = true, log = true, userMessage, context } = options;
    const normalized = this.adapter.adapt(error, context);
    const displayMessage = userMessage || normalized.message;

    if (log) {
      const logMessage = context
        ? `${normalized.message} | Context: ${JSON.stringify(context)}`
        : normalized.message;

      this.logger(logMessage);
    }

    if (notify) {
      this.notificationHandler(displayMessage);
    }
  }
}
