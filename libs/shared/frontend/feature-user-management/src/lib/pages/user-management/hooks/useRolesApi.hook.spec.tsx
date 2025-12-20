import { renderHook, act } from '@testing-library/react';
import { useRolesApi } from './useRolesApi.hook';
import type { CustomRole } from '../../../types/user-management.types';

describe('useRolesApi', () => {
  const mockRoles: CustomRole[] = [
    {
      id: 1,
      name: 'Manager',
      description: 'Manager role',
      permissions: null,
      createdAt: 1704067200,
      createdBy: 1,
    },
    {
      id: 2,
      name: 'Editor',
      description: null,
      permissions: null,
      createdAt: 1704067200,
      createdBy: 1,
    },
  ];

  const createMockApi = (overrides = {}) => ({
    useListRolesQuery: () => ({
      data: mockRoles,
      isLoading: false,
      refetch: jest.fn(),
      ...overrides,
    }),
    useDeleteRoleMutation: () => [
      jest.fn().mockResolvedValue({ data: undefined }),
    ],
    useCreateRoleMutation: () => [
      jest.fn().mockResolvedValue({ data: undefined }),
      { isLoading: false },
    ],
  });

  it('returns the list of roles', () => {
    const mockApi = createMockApi();

    const { result } = renderHook(() => useRolesApi(mockApi as never));

    expect(result.current.roles).toEqual(mockRoles);
    expect(result.current.isLoading).toBe(false);
  });

  it('shows loading state while roles are being fetched', () => {
    const mockApi = createMockApi({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useRolesApi(mockApi as never));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.roles).toBeUndefined();
  });

  it('creates a new role and refreshes the list', async () => {
    const mockRefetch = jest.fn();
    const mockCreate = jest.fn().mockResolvedValue({ data: undefined });
    const mockNotify = jest.fn();

    const mockApi = {
      useListRolesQuery: () => ({
        data: mockRoles,
        isLoading: false,
        refetch: mockRefetch,
      }),
      useDeleteRoleMutation: () => [jest.fn()],
      useCreateRoleMutation: () => [mockCreate, { isLoading: false }],
    };

    const { result } = renderHook(() =>
      useRolesApi(mockApi as never, mockNotify)
    );

    await act(async () => {
      await result.current.createRole({
        name: 'Viewer',
        description: 'View only',
      });
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Viewer',
      description: 'View only',
    });
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith(
      'success',
      'Role created successfully'
    );
  });

  it('provides delete function for removing roles', () => {
    const mockApi = createMockApi();

    const { result } = renderHook(() => useRolesApi(mockApi as never));

    expect(result.current.deleteRole).toBeDefined();
    expect(typeof result.current.deleteRole).toBe('function');
  });
});
