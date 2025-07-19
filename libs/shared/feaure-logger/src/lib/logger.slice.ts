import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LogEntry {
  id: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  timestamp: number;
}

export interface LoggerState {
  logs: LogEntry[];
}

const initialState: LoggerState = {
  logs: [],
};

export const loggerSlice = createSlice({
  name: 'logger',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<Omit<LogEntry, 'id' | 'timestamp'>>) => {
      const log: LogEntry = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      state.logs.push(log);
    },
    clearLogs: (state) => {
      state.logs = [];
    }
  },
});

export const { addLog, clearLogs } = loggerSlice.actions;
export const loggerReducer = loggerSlice.reducer;