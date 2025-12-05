import { Component, type ReactNode, type ErrorInfo } from 'react';
import type {
  LoggerFn,
  NotificationHandlerFn,
} from '../error-autologger.types';
import { ErrorReporter } from '../error-autologger';

export interface ErrorBoundaryProps {
  logger?: LoggerFn;
  notificationHandler?: NotificationHandlerFn;
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  userMessage?: string;
  notify?: boolean;
  log?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// React Error Boundary with centralized error reporting.
// NOTE: Error boundaries must be class components in React.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private reporter: ErrorReporter;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = { hasError: false, error: null };
    this.reporter = new ErrorReporter({
      logger: props.logger,
      notificationHandler: props.notificationHandler,
    });
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const {
      onError,
      userMessage = 'Something went wrong. Please try again.',
      notify = true,
      log = true,
    } = this.props;

    this.reporter.report(error, {
      notify,
      log,
      userMessage,
      context: {
        type: 'error-boundary',
        componentStack: errorInfo.componentStack,
      },
    });

    onError?.(error, errorInfo);
  }

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error);
      }

      return fallback ?? null;
    }

    return children;
  }
}
