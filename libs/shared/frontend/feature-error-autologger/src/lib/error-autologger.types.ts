// Logger function type - accepts an error message string
export type LoggerFn = (message: string) => void;

// Notification handler function type - accepts a user-friendly message string
export type NotificationHandlerFn = (message: string) => void;

// Cleanup function type for removing event listeners
export type CleanupFn = () => void;

// Normalized error structure for consistent handling
export interface NormalizedError {
  message: string;
  originalError: unknown;
  stack?: string;
  context?: Record<string, unknown>;
}

// Base configuration for error handlers
export interface ErrorHandlerConfig {
  logger?: LoggerFn;
  notificationHandler?: NotificationHandlerFn;
}

// Options for individual error handling calls
export interface HandleErrorOptions {
  notify?: boolean;
  log?: boolean;
  userMessage?: string;
  context?: Record<string, unknown>;
}

// Configuration for global error handlers and RTK middleware
export interface ErrorListenerConfig extends ErrorHandlerConfig {
  notify?: boolean;
  log?: boolean;
  defaultMessage?: string;
}

// RTK middleware specific config
export interface RTKErrorMiddlewareConfig extends ErrorListenerConfig {
  shouldHandle?: (action: unknown) => boolean;
}

// Redux-aware RTK middleware config - uses action creators instead of handler functions
export interface ReduxRTKErrorMiddlewareConfig {
  logAction: (payload: { message: string; level: 'error' }) => { type: string };
  notifyAction: (message: string) => { type: string };
  notify?: boolean;
  log?: boolean;
  defaultMessage?: string;
  shouldHandle?: (action: unknown) => boolean;
}
