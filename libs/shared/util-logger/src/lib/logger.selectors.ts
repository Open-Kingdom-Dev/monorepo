import { createSelector } from '@reduxjs/toolkit';
import { LoggerState } from './logger.slice';

// TODO figure out how to get the root state without a circular dependency
export const selectLoggerState = (state: {logger: LoggerState}) => state.logger;

export const selectLogs = createSelector(
  [selectLoggerState],
  (logger) => logger.logs
);

export const selectLogsByLevel = createSelector(
  [selectLogs, (_, level: 'info' | 'warn' | 'error') => level],
  (logs, level) => logs.filter(log => log.level === level)
);

export const selectRecentLogs = createSelector(
  [selectLogs, (_, count: number) => count],
  (logs, count) => logs.slice(-count)
);