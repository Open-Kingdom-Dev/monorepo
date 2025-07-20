import { createSelector } from '@reduxjs/toolkit';
import { LoggerKey, RootStateContainingLogger } from './logger.types';

export const selectLoggerState = (state: RootStateContainingLogger) =>
  state[LoggerKey];

export const selectLogs = createSelector(
  [selectLoggerState],
  (logger) => logger.logs
);

export const selectLogsByLevel = createSelector(
  [selectLogs, (_, level: 'info' | 'warn' | 'error') => level],
  (logs, level) => logs.filter((log) => log.level === level)
);

export const selectRecentLogs = createSelector(
  [selectLogs, (_, count: number) => count],
  (logs, count) => count === 0 ? [] : logs.slice(-count)
);
