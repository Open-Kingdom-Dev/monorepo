import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AcceptInvitationPage } from './AcceptInvitation.page';

jest.mock('@react-hookz/web', () => ({
  useMountEffect: jest.fn((fn: () => void) => fn()),
}));

jest.mock('./components', () => ({
  AcceptInvitationForm: ({ token }: { token: string }) => (
    <div data-testid="accept-form">Token: {token}</div>
  ),
}));

describe('AcceptInvitationPage', () => {
  const createMockApi = () => ({
    injectEndpoints: jest.fn().mockReturnThis(),
  });

  it('shows form when token is provided as prop', () => {
    render(
      <AcceptInvitationPage api={createMockApi() as never} token="test-token" />
    );

    expect(screen.getByTestId('accept-form')).toBeTruthy();
    expect(screen.getByText('Token: test-token')).toBeTruthy();
  });

  it('shows warning when token prop is empty', () => {
    render(<AcceptInvitationPage api={createMockApi() as never} token="" />);

    expect(screen.getByText(/No invitation token provided/)).toBeTruthy();
  });
});
