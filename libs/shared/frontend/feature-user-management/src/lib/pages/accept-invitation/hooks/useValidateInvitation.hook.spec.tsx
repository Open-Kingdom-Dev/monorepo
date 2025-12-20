import { renderHook } from '@testing-library/react';
import { useValidateInvitation } from './useValidateInvitation.hook';

describe('useValidateInvitation', () => {
  it('returns validation data when invitation is valid', () => {
    const validationData = {
      valid: true,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockApi = {
      useValidateInvitationQuery: () => ({
        data: validationData,
        isLoading: false,
        error: null,
      }),
      useAcceptInvitationMutation: jest.fn(),
    } as never;

    const { result } = renderHook(() =>
      useValidateInvitation({ injectedApi: mockApi, token: 'valid-token' })
    );

    expect(result.current.validation).toEqual(validationData);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBeNull();
  });

  it('returns invalid status when token is expired', () => {
    const invalidData = {
      valid: false,
      error: 'Token expired',
    };

    const mockApi = {
      useValidateInvitationQuery: () => ({
        data: invalidData,
        isLoading: false,
        error: null,
      }),
      useAcceptInvitationMutation: jest.fn(),
    } as never;

    const { result } = renderHook(() =>
      useValidateInvitation({ injectedApi: mockApi, token: 'expired-token' })
    );

    expect(result.current.validation?.valid).toBe(false);
    expect(result.current.validation?.error).toBe('Token expired');
  });

  it('shows loading state while validating', () => {
    const mockApi = {
      useValidateInvitationQuery: () => ({
        data: undefined,
        isLoading: true,
        error: null,
      }),
      useAcceptInvitationMutation: jest.fn(),
    } as never;

    const { result } = renderHook(() =>
      useValidateInvitation({ injectedApi: mockApi, token: 'some-token' })
    );

    expect(result.current.isValidating).toBe(true);
    expect(result.current.validation).toBeUndefined();
  });

  it('returns error when validation request fails', () => {
    const networkError = new Error('Network error');

    const mockApi = {
      useValidateInvitationQuery: () => ({
        data: undefined,
        isLoading: false,
        error: networkError,
      }),
      useAcceptInvitationMutation: jest.fn(),
    } as never;

    const { result } = renderHook(() =>
      useValidateInvitation({ injectedApi: mockApi, token: 'some-token' })
    );

    expect(result.current.validationError).toBe(networkError);
  });
});
