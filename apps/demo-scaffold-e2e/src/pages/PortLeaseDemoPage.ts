import { Page } from '@playwright/test';

import { byTestId } from '../utils';

export class PortLeaseDemoPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/port-lease-demo');
  }

  getStat(id: 'slot' | 'width' | 'primary' | 'branch') {
    return this.page.locator(byTestId(`port-lease-${id}`));
  }

  getPortRow(name: string) {
    return this.page.locator(byTestId(`port-lease-row-${name}`));
  }

  getLeasedPort(name: string) {
    return this.getPortRow(name).locator(byTestId('leased'));
  }

  getRegistryEntry(slot: number) {
    return this.page.locator(byTestId(`port-lease-registry-${slot}`));
  }

  getMismatchNote() {
    return this.page.locator(byTestId('port-lease-mismatch'));
  }

  getError() {
    return this.page.locator(byTestId('port-lease-error'));
  }

  async retry() {
    await this.page.locator(byTestId('port-lease-retry')).click();
  }

  async refresh() {
    await this.page.locator(byTestId('port-lease-refresh')).click();
  }
}
