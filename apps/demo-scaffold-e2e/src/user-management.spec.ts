import { test, expect } from '@playwright/test';

import { UserManagementPage } from './pages/UserManagementPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';

test.describe('the user management page', () => {
  let users: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    users = new UserManagementPage(page);
    await users.goto();
  });

  test('shows an error with a retry option when the API is unavailable', async () => {
    expect(await users.getErrorText()).toContain('Failed to load users');
    await expect(users.getRetryButton()).toBeVisible();
  });
});

test.describe('the accept invitation page', () => {
  let accept: AcceptInvitationPage;

  test('shows an error when no token is provided', async ({ page }) => {
    accept = new AcceptInvitationPage(page);
    await accept.goto();
    expect(await accept.getErrorTitleText()).toContain('Missing Token');
  });
});
