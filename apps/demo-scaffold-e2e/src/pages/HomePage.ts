import { Page } from '@playwright/test';

import { byTestId } from '../utils';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async getLogsText() {
    return this.page.locator(byTestId('logs-count')).textContent();
  }

  async incrementLogCount() {
    await this.page.locator(byTestId('log-info-btn')).click();
  }
}
