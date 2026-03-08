import { renderHook } from '@testing-library/react';
import { useHasPermission } from './useHasPermission';

const mockProfileQuery = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useAuthControllerGetProfileQuery: () => mockProfileQuery(),
}));

describe('useHasPermission', () => {
  it('grants access when the user has the requested permission', () => {
    mockProfileQuery.mockReturnValue({
      data: { permissions: ['users:read', 'users:delete'] },
    });

    const { result } = renderHook(() => useHasPermission('users', 'read'));
    expect(result.current).toBe(true);
  });

  it('denies access when the user lacks the requested permission', () => {
    mockProfileQuery.mockReturnValue({
      data: { permissions: ['users:read'] },
    });

    const { result } = renderHook(() => useHasPermission('users', 'delete'));
    expect(result.current).toBe(false);
  });

  it('denies access while the profile is still loading', () => {
    mockProfileQuery.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useHasPermission('users', 'read'));
    expect(result.current).toBe(false);
  });
});
