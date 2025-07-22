import { test, expect } from '@playwright/test';

import { HomePage } from './pages/HomePage';

test.describe('the RTK integration', () => {
  let home: HomePage;
  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test('completes an action/rerender cycle', async () => {
    expect(await home.getLogsText()).toContain('0');
    await home.incrementLogCount();
    expect(await home.getLogsText()).toContain('1');
  });

  test('properly integrates the logging capabilities', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => {
      messages.push(msg.text());
    });
    await home.incrementLogCount();
    expect(messages).toContain('[INFO] Hello World');
  });
});
