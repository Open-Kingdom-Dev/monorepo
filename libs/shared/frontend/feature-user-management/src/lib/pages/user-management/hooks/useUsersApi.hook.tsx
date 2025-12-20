import { useCallback } from 'react';
import { useApiAction } from './useApiAction.hook';
import type { User } from '../../../types/user-management.types';

type NotifyFn = (
  type: 'success' | 'error' | 'warning',
  message: string
) => void;

interface InjectedApi {
  useListUsersQuery: () => {
    data: User[] | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
  useDeleteUserMutation: () => [
    (id: number) => Promise<{ data: void } | { error: unknown }>
  ];
}

export function useUsersApi(injectedApi: InjectedApi, onNotify?: NotifyFn) {
  const handleAction = useApiAction(onNotify);

  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = injectedApi.useListUsersQuery();
  const [deleteUserMutation] = injectedApi.useDeleteUserMutation();

  const deleteUser = useCallback(
    (userId: number) =>
      handleAction(
        () => deleteUserMutation(userId),
        refetch,
        'User deleted successfully',
        'Failed to delete user',
        'Are you sure you want to delete this user?'
      ),
    [handleAction, deleteUserMutation, refetch]
  );

  return {
    users,
    isLoading,
    error,
    refetch,
    deleteUser,
  };
}
