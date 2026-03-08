import { useState, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  useUsersControllerFindAllQuery,
  useUsersControllerDeleteMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  DataGrid,
  type ColDef,
  type ICellRendererParams,
  type DataGridTheme,
} from '@open-kingdom/shared-frontend-ui-datagrid';
import { useTheme } from '@open-kingdom/shared-frontend-ui-theme';
import { ConfirmDialog } from '../shared/ConfirmDialog.component';
import { RoleBadge } from '../shared/RoleBadge.component';
import { InviteUserModal } from '../invitations';
import { RoleChangeModal } from './RoleChangeModal.component';
import { useHasPermission } from '../../hooks/useHasPermission';
import { buttonPrimaryStyles } from '../../styles';
import type { User } from '../../types';

interface UserListProps {
  currentUserId?: number;
}

export function UserList({ currentUserId }: UserListProps) {
  const dispatch = useDispatch();
  const { theme, mode } = useTheme();
  const { data, isLoading, error, refetch } = useUsersControllerFindAllQuery();
  const [deleteUser, { isLoading: isDeleting }] =
    useUsersControllerDeleteMutation();

  const canDeleteUsers = useHasPermission('users', 'delete');
  const canChangeRoles = useHasPermission('roles', 'update');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);

  const users = (data as User[] | undefined) ?? [];

  const handleDeleteConfirm = useCallback(async () => {
    if (!userToDelete) return;
    try {
      await deleteUser({ id: userToDelete.id }).unwrap();
      dispatch(showSuccessNotification('User deleted successfully'));
    } catch {
      // Error notification handled by RTK error middleware
    } finally {
      setUserToDelete(null);
    }
  }, [userToDelete, deleteUser, dispatch]);

  const columnDefs = useMemo<ColDef<User>[]>(
    () => [
      { field: 'email', headerName: 'Email', flex: 2 },
      {
        headerName: 'Name',
        flex: 2,
        valueGetter: (params) => {
          const { firstName, lastName } = params.data ?? {};
          return [firstName, lastName].filter(Boolean).join(' ') || '—';
        },
      },
      {
        field: 'role',
        headerName: 'Role',
        flex: 1,
        cellRenderer: (params: ICellRendererParams<User>) =>
          params.data ? <RoleBadge role={params.data.role} /> : null,
      },
      {
        headerName: 'Actions',
        flex: 1,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<User>) => {
          if (!params.data) return null;
          const isSelf = params.data.id === currentUserId;
          return (
            <div className="flex gap-1">
              {canChangeRoles && (
                <button
                  onClick={() =>
                    params.data && setUserToChangeRole(params.data)
                  }
                  disabled={isSelf}
                  title={
                    isSelf ? 'Cannot change your own role' : 'Change user role'
                  }
                  className="rounded px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-primary-400 dark:hover:bg-primary-900/20"
                >
                  Change Role
                </button>
              )}
              {canDeleteUsers && (
                <button
                  onClick={() => params.data && setUserToDelete(params.data)}
                  disabled={isSelf}
                  title={
                    isSelf ? 'Cannot delete your own account' : 'Delete user'
                  }
                  className="rounded px-2 py-1 text-xs font-medium text-error-600 transition-colors hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-error-400 dark:hover:bg-error-900/20"
                >
                  Delete
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUserId, canChangeRoles, canDeleteUsers]
  );

  if (error) {
    return (
      <div
        data-testid="users-error"
        className="rounded-lg bg-error-50 p-6 text-center dark:bg-error-900/20"
        role="alert"
      >
        <p className="text-error-700 dark:text-error-300">
          Failed to load users.
        </p>
        <button
          data-testid="users-retry-btn"
          onClick={refetch}
          className="mt-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2
          data-testid="users-heading"
          className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Users
        </h2>
        <button
          data-testid="invite-user-btn"
          onClick={() => setShowInviteModal(true)}
          className={buttonPrimaryStyles}
        >
          Invite User
        </button>
      </div>

      <DataGrid
        rowData={users}
        columnDefs={columnDefs}
        mode={mode}
        theme={theme as DataGridTheme}
        loading={isLoading}
      />

      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <RoleChangeModal
        isOpen={!!userToChangeRole}
        onClose={() => setUserToChangeRole(null)}
        user={
          userToChangeRole
            ? {
                id: userToChangeRole.id,
                email: userToChangeRole.email,
                role: userToChangeRole.role ?? '',
              }
            : { id: 0, email: '', role: '' }
        }
      />

      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.email}? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setUserToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
