import { test, expect } from '@playwright/test';

import { HomePage } from './pages/HomePage';

test.describe('the notification UI integration', () => {
  let home: HomePage;
  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test('should show a notification when the user triggers it', async () => {
    await home.triggerNotification();
    expect(home.getNotification()).toContain('Notification triggered!');
  });

  test('should allow configuration of placement', async () => {
    await home.setNotificationPlacement('top');
    await home.triggerNotification();
    // Check for a made-up class name indicating top placement
    const notification = home.getNotificationLocator();
    await expect(notification).toHaveClass(/notification--top/);
  });
});
