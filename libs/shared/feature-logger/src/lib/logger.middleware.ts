import { LoggerConfig } from './logger.types';
import { createConsoleListenerMiddleware } from './console-listener';

export const createLoggerMiddleware = (config: LoggerConfig) => {
  switch (config.destination) {
    case 'console':
      return createConsoleListenerMiddleware();
    default:
      throw new Error(`Unsupported logger destination: ${config.destination}`);
  }
};
