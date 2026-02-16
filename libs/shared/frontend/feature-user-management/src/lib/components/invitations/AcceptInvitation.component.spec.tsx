import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AcceptInvitation } from './AcceptInvitation.component';

const mockValidateQuery = jest.fn();
const mockAccept = jest.fn();
const mockAcceptState = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useInvitationsControllerValidateQuery: (...args: unknown[]) =>
    mockValidateQuery(...args),
  useInvitationsControllerAcceptMutation: () => [mockAccept, mockAcceptState()],
}));

describe('AcceptInvitation', () => {
  beforeEach(() => {
    mockAccept.mockReset();
    mockAccept.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockAcceptState.mockReturnValue({ isLoading: false, isSuccess: false });
  });

  it('shows a loading message while checking the invitation', () => {
    mockValidateQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<AcceptInvitation token="test-token" />);
    expect(screen.getByText('Validating invitation...')).toBeInTheDocument();
  });

  it('tells the user when something went wrong checking the invitation', () => {
    mockValidateQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
    });
    render(<AcceptInvitation token="bad-token" />);
    expect(screen.getByText('Validation Failed')).toBeInTheDocument();
  });

  it('tells the user when the invitation link is invalid or expired', () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: false },
      isLoading: false,
      error: null,
    });
    render(<AcceptInvitation token="bad-token" />);
    expect(screen.getByText('Invalid Invitation')).toBeInTheDocument();
  });

  it('shows the registration form for a valid invitation', () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: true, email: 'test@example.com', role: 'user' },
      isLoading: false,
      error: null,
    });
    render(<AcceptInvitation token="test-token" />);
    expect(screen.getByText('Accept Invitation')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows the invited email and assigned role', () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: true, email: 'test@example.com', role: 'admin' },
      isLoading: false,
      error: null,
    });
    render(<AcceptInvitation token="test-token" />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('requires a password of at least 8 characters', async () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: true, email: 'test@example.com', role: 'user' },
      isLoading: false,
      error: null,
    });
    render(<AcceptInvitation token="test-token" />);
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByText('Create Account'));
    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });
  });

  it('requires password and confirmation to match', async () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: true, email: 'test@example.com', role: 'user' },
      isLoading: false,
      error: null,
    });
    render(<AcceptInvitation token="test-token" />);
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different123' },
    });
    fireEvent.click(screen.getByText('Create Account'));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits the account details when the form is filled correctly', async () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: true, email: 'test@example.com', role: 'user' },
      isLoading: false,
      error: null,
    });
    render(<AcceptInvitation token="good-token" />);
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText('Create Account'));
    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledWith({
        acceptInvitationDto: {
          token: 'good-token',
          password: 'password123',
          firstName: undefined,
          lastName: undefined,
        },
      });
    });
  });

  it('confirms account creation and links to login', () => {
    mockValidateQuery.mockReturnValue({
      data: { valid: true, email: 'test@example.com', role: 'user' },
      isLoading: false,
      error: null,
    });
    mockAcceptState.mockReturnValue({ isLoading: false, isSuccess: true });
    render(<AcceptInvitation token="good-token" loginPath="/profile" />);
    expect(screen.getByText('Account Created')).toBeInTheDocument();
    expect(screen.getByText('Go to login')).toHaveAttribute('href', '/profile');
  });
});
