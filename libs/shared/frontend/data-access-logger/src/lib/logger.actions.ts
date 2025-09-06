import { addLog, clearLogs } from './logger.slice';

// Re-export actions for convenience
export { addLog, clearLogs };

// Helper action creators
export const logInfo = (message: string) => addLog({ message, level: 'info' });
export const logWarn = (message: string) => addLog({ message, level: 'warn' });
export const logError = (message: string) =>
  addLog({ message, level: 'error' });
