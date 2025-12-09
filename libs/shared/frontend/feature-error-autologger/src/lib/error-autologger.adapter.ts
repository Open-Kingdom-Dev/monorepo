import type { NormalizedError } from './error-autologger.types';

// Adapts various error types into a consistent NormalizedError structure.
export class ErrorAdapter {
  adapt(error: unknown, context?: Record<string, unknown>): NormalizedError {
    if (error instanceof Error) {
      return {
        message: error.message,
        originalError: error,
        stack: error.stack,
        context,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        originalError: error,
        context,
      };
    }

    if (this.isObject(error)) {
      return this.adaptObject(error, context);
    }

    return {
      message: 'An unexpected error occurred',
      originalError: error,
      context,
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
  }

  private adaptObject(
    error: Record<string, unknown>,
    context?: Record<string, unknown>
  ): NormalizedError {
    // RTK fetch error: { status: number | string, data?: unknown, error?: string }
    if ('status' in error) {
      return {
        message: this.extractStatusErrorMessage(error),
        originalError: error,
        context: { ...context, status: error.status },
      };
    }

    // Serialized error: { name?: string, message?: string, code?: string }
    if ('name' in error || 'code' in error) {
      const err = error as {
        name?: string;
        message?: string;
        code?: string;
        stack?: string;
      };

      return {
        message: err.message || err.name || 'An error occurred',
        originalError: error,
        stack: err.stack,
        context: { ...context, code: err.code, name: err.name },
      };
    }

    // Generic object with message
    if ('message' in error && typeof error.message === 'string') {
      return {
        message: error.message,
        originalError: error,
        context,
      };
    }

    return {
      message: 'An unexpected error occurred',
      originalError: error,
      context,
    };
  }

  private messageExtractors: Array<
    (error: Record<string, unknown>) => string | null
  > = [
    (e) => (typeof e.error === 'string' ? e.error : null),
    (e) =>
      this.isObject(e.data) && typeof e.data.message === 'string'
        ? e.data.message
        : null,
    (e) => (typeof e.data === 'string' ? e.data : null),
    (e) =>
      typeof e.status === 'number'
        ? `Request failed with status ${e.status}`
        : null,
  ];

  private extractStatusErrorMessage(error: Record<string, unknown>): string {
    for (const extractor of this.messageExtractors) {
      const message = extractor(error);

      if (message) {
        return message;
      }
    }

    return 'Request failed';
  }
}
