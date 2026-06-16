import { useState, useMemo } from 'react';
import {
  useRolesControllerFindAllQuery,
  useRolesControllerDeleteMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { useDispatch } from 'react-redux';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  DataTable,
  type ColumnDef,
  type CellContext,
} from '@open-kingdom/shared-frontend-ui-data-table';
import { ConfirmDialog } from '../shared/ConfirmDialog.component';
import { RolePermissionsModal } from './RolePermissionsModal.component';
import { useHasPermission } from '../../hooks/useHasPermission';

interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: number;
}

export function RoleList() {
  const dispatch = useDispatch();
  const { data, isLoading, error, refetch } = useRolesControllerFindAllQuery();
  const [deleteRole, { isLoading: isDeleting }] =
    useRolesControllerDeleteMutation();

  const canDeleteRoles = useHasPermission('roles', 'delete');
  const canEditPermissions = useHasPermission('roles', 'update');

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

  const roles = (data as Role[] | undefined) ?? [];

  async function handleDeleteConfirm() {
    if (!roleToDelete) return;
    try {
      await deleteRole({ id: roleToDelete.id }).unwrap();
      dispatch(showSuccessNotification('Role deleted successfully'));
    } catch {
      // Error notification handled by RTK error middleware
    } finally {
      setRoleToDelete(null);
    }
  }

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'description', header: 'Description' },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => (row?.isSystem ? 'System' : 'Custom'),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }: CellContext<Role, unknown>) => {
          if (!row.original) return null;
          const isSystem = !!row.original.isSystem;

          return (
            <div className="flex gap-1">
              {canEditPermissions && (
                <button
                  onClick={() => row.original && setRoleToEdit(row.original)}
                  className="rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Permissions
                </button>
              )}
              {canDeleteRoles && (
                <button
                  onClick={() => row.original && setRoleToDelete(row.original)}
                  disabled={isSystem}
                  title={
                    isSystem ? 'Cannot delete a system role' : 'Delete role'
                  }
                  className="rounded px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [canEditPermissions, canDeleteRoles]
  );

  if (error) {
    return (
      <div
        data-testid="roles-error"
        className="rounded-lg bg-destructive/10 p-6 text-center"
        role="alert"
      >
        <p className="text-destructive">Failed to load roles.</p>
        <button
          data-testid="roles-retry-btn"
          onClick={refetch}
          className="mt-2 text-sm font-medium text-primary hover:underline"
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
          data-testid="roles-heading"
          className="text-xl font-semibold text-foreground"
        >
          Roles &amp; Permissions
        </h2>
      </div>

      <DataTable
        data={roles}
        columns={columns}
        loading={isLoading}
        enableSorting={false}
        enableColumnResizing={false}
      />

      <RolePermissionsModal
        isOpen={!!roleToEdit}
        onClose={() => setRoleToEdit(null)}
        role={
          roleToEdit
            ? { id: roleToEdit.id, name: roleToEdit.name }
            : { id: 0, name: '' }
        }
      />

      <ConfirmDialog
        isOpen={!!roleToDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the "${roleToDelete?.name}" role? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRoleToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
