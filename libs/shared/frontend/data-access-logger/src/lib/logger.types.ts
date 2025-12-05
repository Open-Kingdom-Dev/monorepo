export const LoggerKey = 'logger';

export interface LogEntry {
  id: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  timestamp: number;
}

export interface LoggerState {
  logs: LogEntry[];
}

export type RootStateContaining<K extends string, V> = {
  [key: string]: unknown;
} & {
  [P in K]: V;
};

export type RootStateContainingLogger = RootStateContaining<
  typeof LoggerKey,
  LoggerState
>;
