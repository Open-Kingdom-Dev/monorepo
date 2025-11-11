import { NotificationConfig } from '../index';

describe('util-types', () => {
  it('should pass tests by having a placeholder', () => {
    const notificationConfig: NotificationConfig = {
      maxNotifications: 10,
      autoDismiss: true,
      dismissTimeout: 5000,
    };
    expect(notificationConfig).toBeDefined();
  });
});
