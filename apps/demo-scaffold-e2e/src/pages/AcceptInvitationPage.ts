import { Page } from '@playwright/test';

import { byTestId } from '../utils';

export class AcceptInvitationPage {
  constructor(private page: Page) {}

  async goto(token?: string) {
    const url = token
      ? `/accept-invitation?token=${token}`
      : '/accept-invitation';
    await this.page.goto(url);
  }

  async getHeadingText() {
    return this.page.locator(byTestId('accept-heading')).textContent();
  }

  async getErrorTitleText() {
    return this.page.locator(byTestId('status-card-title')).textContent();
  }

  async getErrorMessageText() {
    return this.page.locator(byTestId('status-card-message')).textContent();
  }

  async getInvitedEmail() {
    return this.page.locator(byTestId('accept-email')).textContent();
  }

  async getInvitedRole() {
    return this.page.locator(byTestId('accept-role')).textContent();
  }

  async fillForm(options: {
    firstName?: string;
    lastName?: string;
    password: string;
    confirmPassword: string;
  }) {
    if (options.firstName) {
      await this.page
        .locator(byTestId('accept-first-name-input'))
        .fill(options.firstName);
    }
    if (options.lastName) {
      await this.page
        .locator(byTestId('accept-last-name-input'))
        .fill(options.lastName);
    }
    await this.page
      .locator(byTestId('accept-password-input'))
      .fill(options.password);
    await this.page
      .locator(byTestId('accept-confirm-password-input'))
      .fill(options.confirmPassword);
  }

  async submit() {
    await this.page.locator(byTestId('accept-submit-btn')).click();
  }

  async getSuccessHeadingText() {
    return this.page.locator(byTestId('status-card-title')).textContent();
  }

  getLoginLink() {
    return this.page.locator(byTestId('accept-login-link'));
  }

  async getValidationErrorText() {
    return this.page.locator(byTestId('field-error')).first().textContent();
  }
}
