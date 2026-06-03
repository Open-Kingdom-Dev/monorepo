/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@testing-library/react';
import { useSearchParams } from 'react-router';
import AcceptInvitationRoute from './accept-invitation';

jest.mock('react-router', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-feature-user-management', () => ({
  AcceptInvitation: ({
    token,
    loginPath,
  }: {
    token: string;
    loginPath: string;
  }) => (
    <div data-testid="accept-invitation">
      AcceptInvitation token={token} loginPath={loginPath}
    </div>
  ),
  StatusCard: ({
    variant,
    title,
    message,
  }: {
    variant: string;
    title: string;
    message: string;
  }) => (
    <div data-testid="status-card" data-variant={variant}>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  ),
}));

describe('AcceptInvitationRoute', () => {
  it('renders status card with error when token is missing', () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams()]);
    const { getByTestId } = render(<AcceptInvitationRoute />);
    const statusCard = getByTestId('status-card');
    expect(statusCard).toBeTruthy();
    expect(statusCard.getAttribute('data-variant')).toBe('error');
    expect(statusCard.textContent).toContain('Missing Token');
  });

  it('renders AcceptInvitation component when token is present', () => {
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams('token=my-secret-token'),
    ]);
    const { getByTestId } = render(<AcceptInvitationRoute />);
    const acceptInvitation = getByTestId('accept-invitation');
    expect(acceptInvitation).toBeTruthy();
    expect(acceptInvitation.textContent).toContain('token=my-secret-token');
    expect(acceptInvitation.textContent).toContain('loginPath=/profile');
  });
});
