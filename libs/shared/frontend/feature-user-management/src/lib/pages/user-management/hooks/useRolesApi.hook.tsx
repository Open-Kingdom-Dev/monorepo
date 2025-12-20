import { useCallback } from 'react';
import { useApiAction } from './useApiAction.hook';
import type { CreateRoleFormData } from '../../../schemas';
import type { CustomRole } from '../../../types/user-management.types';

type NotifyFn = (
  type: 'success' | 'error' | 'warning',
  message: string
) => void;

type MutationResult<T> = Promise<{ data: T } | { error: unknown }>;

interface InjectedApi {
  useListRolesQuery: () => {
    data: CustomRole[] | undefined;
    isLoading: boolean;
    refetch: () => void;
  };
  useDeleteRoleMutation: () => [(id: number) => MutationResult<void>];
  useCreateRoleMutation: () => [
    (data: { name: string; description?: string }) => MutationResult<void>,
    { isLoading: boolean }
  ];
}

export function useRolesApi(injectedApi: InjectedApi, onNotify?: NotifyFn) {
  const handleAction = useApiAction(onNotify);

  const { data: roles, isLoading, refetch } = injectedApi.useListRolesQuery();
  const [deleteRoleMutation] = injectedApi.useDeleteRoleMutation();
  const [createRoleMutation, { isLoading: isCreating }] =
    injectedApi.useCreateRoleMutation();

  const deleteRole = useCallback(
    (roleId: number) =>
      handleAction(
        () => deleteRoleMutation(roleId),
        refetch,
        'Role deleted successfully',
        'Failed to delete role',
        'Are you sure you want to delete this role?'
      ),
    [handleAction, deleteRoleMutation, refetch]
  );

  const createRole = useCallback(
    (data: CreateRoleFormData) =>
      handleAction(
        () =>
          createRoleMutation({
            name: data.name,
            description: data.description || undefined,
          }),
        refetch,
        'Role created successfully',
        'Failed to create role'
      ),
    [handleAction, createRoleMutation, refetch]
  );

  return {
    roles,
    isLoading,
    isCreating,
    deleteRole,
    createRole,
  };
}
