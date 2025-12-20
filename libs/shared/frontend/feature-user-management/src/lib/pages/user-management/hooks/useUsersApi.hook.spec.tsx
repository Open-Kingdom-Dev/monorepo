import { renderHook } from '@testing-library/react';
import { useUsersApi } from './useUsersApi.hook';
import type { User } from '../../../types/user-management.types';

describe('useUsersApi', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      customRoleId: null,
    },
    {
      id: 2,
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      customRoleId: null,
    },
  ];

  const createMockApi = (overrides = {}) => ({
    useListUsersQuery: () => ({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      ...overrides,
    }),
    useDeleteUserMutation: () => [
      jest.fn().mockResolvedValue({ data: undefined }),
    ],
  });

  it('returns the list of users', () => {
    const mockApi = createMockApi();

    const { result } = renderHook(() => useUsersApi(mockApi as never));

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.isLoading).toBe(false);
  });

  it('shows loading state while users are being fetched', () => {
    const mockApi = createMockApi({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useUsersApi(mockApi as never));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toBeUndefined();
  });

  it('reports error when users cannot be loaded', () => {
    const fetchError = new Error('Failed to fetch');
    const mockApi = createMockApi({ error: fetchError });

    const { result } = renderHook(() => useUsersApi(mockApi as never));

    expect(result.current.error).toBe(fetchError);
  });

  it('provides delete function for removing users', () => {
    const mockApi = createMockApi();

    const { result } = renderHook(() => useUsersApi(mockApi as never));

    expect(result.current.deleteUser).toBeDefined();
    expect(typeof result.current.deleteUser).toBe('function');
  });

  it('provides refetch function for refreshing user list', () => {
    const mockRefetch = jest.fn();
    const mockApi = {
      useListUsersQuery: () => ({
        data: mockUsers,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      }),
      useDeleteUserMutation: () => [
        jest.fn().mockResolvedValue({ data: undefined }),
      ],
    };

    const { result } = renderHook(() => useUsersApi(mockApi as never));

    expect(result.current.refetch).toBe(mockRefetch);
  });
});
