import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AcceptInvitationForm } from './AcceptInvitationForm.component';
import { useValidateInvitation, useAcceptInvitationApi } from '../hooks';

jest.mock('@react-hookz/web', () => ({
  useUpdateEffect: jest.fn(),
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => () => ({ values: {}, errors: {} }),
}));

jest.mock('../hooks', () => ({
  useValidateInvitation: jest.fn(),
  useAcceptInvitationApi: jest.fn(),
}));

jest.mock('../../../api', () => ({
  createUserManagementEndpoints: jest.fn(),
}));

const mockUseValidateInvitation = useValidateInvitation as jest.Mock;
const mockUseAcceptInvitationApi = useAcceptInvitationApi as jest.Mock;

describe('Accept Invitation Form', () => {
  const createMockApi = () => ({
    injectEndpoints: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading while validating invitation', () => {
    mockUseValidateInvitation.mockReturnValue({
      validation: undefined,
      isValidating: true,
      validationError: null,
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation: jest.fn(),
      isAccepting: false,
      success: false,
    });

    render(
      <AcceptInvitationForm api={createMockApi() as never} token="test-token" />
    );

    expect(screen.getByText('Validating invitation...')).toBeInTheDocument();
  });

  it('shows error for invalid invitation', () => {
    mockUseValidateInvitation.mockReturnValue({
      validation: { valid: false, error: 'Token expired' },
      isValidating: false,
      validationError: null,
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation: jest.fn(),
      isAccepting: false,
      success: false,
    });

    render(
      <AcceptInvitationForm
        api={createMockApi() as never}
        token="expired-token"
      />
    );

    expect(screen.getByText('Invalid Invitation')).toBeInTheDocument();
    expect(screen.getByText('Token expired')).toBeInTheDocument();
    expect(screen.getByText('Go to Login')).toBeInTheDocument();
  });

  it('shows success message after account is activated', () => {
    mockUseValidateInvitation.mockReturnValue({
      validation: { valid: true, email: 'user@example.com' },
      isValidating: false,
      validationError: null,
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation: jest.fn(),
      isAccepting: false,
      success: true,
    });

    render(
      <AcceptInvitationForm
        api={createMockApi() as never}
        token="valid-token"
      />
    );

    expect(screen.getByText('Account Activated!')).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to login/)).toBeInTheDocument();
  });

  it('displays password form for valid invitation', () => {
    mockUseValidateInvitation.mockReturnValue({
      validation: {
        valid: true,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      isValidating: false,
      validationError: null,
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation: jest.fn(),
      isAccepting: false,
      success: false,
    });

    render(
      <AcceptInvitationForm
        api={createMockApi() as never}
        token="valid-token"
      />
    );

    expect(screen.getByText('Set Your Password')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
  });

  it('allows user to set password and activate account', async () => {
    const acceptInvitation = jest.fn();
    mockUseValidateInvitation.mockReturnValue({
      validation: { valid: true, email: 'user@example.com' },
      isValidating: false,
      validationError: null,
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation,
      isAccepting: false,
      success: false,
    });

    render(
      <AcceptInvitationForm
        api={createMockApi() as never}
        token="valid-token"
      />
    );

    const passwordInputs = screen.getAllByPlaceholderText(
      'At least 8 characters'
    );
    fireEvent.change(passwordInputs[0], {
      target: { value: 'SecurePass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Activate Account' }));

    await waitFor(() => {
      expect(acceptInvitation).toHaveBeenCalled();
    });
  });

  it('shows activating status while processing', () => {
    mockUseValidateInvitation.mockReturnValue({
      validation: { valid: true, email: 'user@example.com' },
      isValidating: false,
      validationError: null,
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation: jest.fn(),
      isAccepting: true,
      success: false,
    });

    render(
      <AcceptInvitationForm
        api={createMockApi() as never}
        token="valid-token"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Activating...' })
    ).toBeDisabled();
  });

  it('shows error when validation request fails', () => {
    mockUseValidateInvitation.mockReturnValue({
      validation: undefined,
      isValidating: false,
      validationError: new Error('Network error'),
    });
    mockUseAcceptInvitationApi.mockReturnValue({
      acceptInvitation: jest.fn(),
      isAccepting: false,
      success: false,
    });

    render(
      <AcceptInvitationForm api={createMockApi() as never} token="test-token" />
    );

    expect(screen.getByText('Invalid Invitation')).toBeInTheDocument();
  });
});
