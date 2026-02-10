import { Page } from '@playwright/test';

import { byTestId } from '../utils';

export class UserManagementPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/users');
  }

  async getHeadingText() {
    return this.page.locator(byTestId('users-heading')).textContent();
  }

  getInviteButton() {
    return this.page.locator(byTestId('invite-user-btn'));
  }

  async getErrorText() {
    return this.page.locator(byTestId('users-error')).textContent();
  }

  getRetryButton() {
    return this.page.locator(byTestId('users-retry-btn'));
  }

  async openInviteModal() {
    await this.page.locator(byTestId('invite-user-btn')).click();
  }

  getInviteModal() {
    return this.page.locator(byTestId('invite-modal'));
  }

  async fillInviteForm(email: string, role: 'guest' | 'user' | 'admin') {
    await this.page.locator(byTestId('invite-email-input')).fill(email);
    await this.page.locator(byTestId('invite-role-select')).selectOption(role);
  }

  async submitInviteForm() {
    await this.page.locator(byTestId('invite-submit-btn')).click();
  }

  async cancelInviteForm() {
    await this.page.locator(byTestId('invite-cancel-btn')).click();
  }

  getConfirmDialog() {
    return this.page.locator(byTestId('confirm-dialog'));
  }

  async confirmAction() {
    await this.page.locator(byTestId('confirm-btn')).click();
  }

  async cancelAction() {
    await this.page.locator(byTestId('confirm-cancel-btn')).click();
  }
}
