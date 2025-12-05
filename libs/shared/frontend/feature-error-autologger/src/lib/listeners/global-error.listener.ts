import type { CleanupFn, ErrorListenerConfig } from '../error-autologger.types';
import { ErrorReporter } from '../error-autologger';

// Attaches global error listeners to window events.
// Handles uncaught errors and unhandled promise rejections.
export class GlobalErrorListener {
  private reporter: ErrorReporter;
  private notify: boolean;
  private log: boolean;
  private defaultMessage: string;

  constructor(config: ErrorListenerConfig = {}) {
    const {
      logger,
      notificationHandler,
      notify = true,
      log = true,
      defaultMessage = 'An unexpected error occurred',
    } = config;

    this.reporter = new ErrorReporter({ logger, notificationHandler });
    this.notify = notify;
    this.log = log;
    this.defaultMessage = defaultMessage;
  }

  attach(): CleanupFn {
    const onError = (event: ErrorEvent): void => {
      event.preventDefault();
      this.reporter.report(event.error || event.message, {
        notify: this.notify,
        log: this.log,
        userMessage: this.defaultMessage,
        context: {
          type: 'uncaught-error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const onRejection = (event: PromiseRejectionEvent): void => {
      event.preventDefault();
      this.reporter.report(event.reason, {
        notify: this.notify,
        log: this.log,
        userMessage: this.defaultMessage,
        context: { type: 'unhandled-rejection' },
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }
}
