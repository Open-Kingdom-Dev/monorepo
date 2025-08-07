export interface NotificationConfig {
  maxNotifications?: number;
  autoDismiss?: boolean;
  dismissTimeout?: number;
}

export interface NotificationEntry {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error';
  timestamp: number;
  dismissed?: boolean;
}

export interface NotificationState {
  notifications: NotificationEntry[];
  config: NotificationConfig;
}

export type RootStateContaining<K extends string, V> = {
  [key: string]: unknown;
} & {
  [P in K]: V;
};
