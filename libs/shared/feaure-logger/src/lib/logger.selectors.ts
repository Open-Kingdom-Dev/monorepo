import { createSelector } from '@reduxjs/toolkit';
import { LoggerState } from './logger.slice';

// Generic selector that works with any root state containing logger
export const LoggerKey = 'logger';
export const selectLoggerState = <T extends { [LoggerKey]: LoggerState }>(state: T) => state[LoggerKey];

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