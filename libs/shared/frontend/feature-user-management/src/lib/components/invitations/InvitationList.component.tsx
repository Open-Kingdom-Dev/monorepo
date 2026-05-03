import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  useInvitationsControllerFindAllQuery,
  useInvitationsControllerCancelMutation,
  useRolesControllerFindAllQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  DataTable,
  type ColumnDef,
  type CellContext,
} from '@open-kingdom/shared-frontend-ui-data-table';
import { ConfirmDialog } from '../shared/ConfirmDialog.component';
import { RoleBadge } from '../shared/RoleBadge.component';
import { StatusBadge } from '../shared/StatusBadge.component';
import { formatDate } from '@open-kingdom/shared-poly-util-date';
import type { Invitation } from '../../types';

const emailColumn: ColumnDef<Invitation> = {
  accessorKey: 'email',
  header: 'Email',
};

function roleColumn(rolesMap: Map<number, string>): ColumnDef<Invitation> {
  return {
    id: 'role',
    header: 'Role',
    cell: ({ row }: CellContext<Invitation, unknown>) =>
      row.original ? (
        <RoleBadge role={rolesMap.get(row.original.roleId) ?? null} />
      ) : null,
  };
}

const statusColumn: ColumnDef<Invitation> = {
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }: CellContext<Invitation, unknown>) =>
    row.original ? <StatusBadge status={row.original.status} /> : null,
};

const invitedColumn: ColumnDef<Invitation> = {
  id: 'invited',
  header: 'Invited',
  accessorFn: (row) => formatDate(row?.invitedAt),
};

const expiresColumn: ColumnDef<Invitation> = {
  id: 'expires',
  header: 'Expires',
  accessorFn: (row) => formatDate(row?.tokenExpiry),
};

function cancelColumn(
  onCancel: (invitation: Invitation) => void
): ColumnDef<Invitation> {
  return {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }: CellContext<Invitation, unknown>) => {
      if (!row.original) return null;

      return (
        <button
          onClick={() => row.original && onCancel(row.original)}
          className="text-destructive text-xs font-medium rounded px-2 py-1 transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
      );
    },
  };
}

function buildColumnDefs(
  onCancel: (invitation: Invitation) => void,
  rolesMap: Map<number, string>
): ColumnDef<Invitation>[] {
  return [
    emailColumn,
    roleColumn(rolesMap),
    statusColumn,
    invitedColumn,
    expiresColumn,
    cancelColumn(onCancel),
  ];
}

export function InvitationList() {
  const dispatch = useDispatch();
  const { data, isLoading, error, refetch } =
    useInvitationsControllerFindAllQuery();
  const [cancelInvitation, { isLoading: isCancelling }] =
    useInvitationsControllerCancelMutation();
  const { data: roles } = useRolesControllerFindAllQuery();

  const [invitationToCancel, setInvitationToCancel] =
    useState<Invitation | null>(null);

  const invitations = (data as Invitation[] | undefined) ?? [];

  const rolesMap = useMemo(() => {
    const list = (roles as { id: number; name: string }[]) ?? [];
    return new Map(list.map((r) => [r.id, r.name]));
  }, [roles]);

  async function handleCancelConfirm() {
    if (!invitationToCancel) return;

    try {
      await cancelInvitation({ id: invitationToCancel.id }).unwrap();
      dispatch(showSuccessNotification('Invitation cancelled successfully'));
    } catch {
      // handled by RTK error middleware
    } finally {
      setInvitationToCancel(null);
    }
  }

  const columns = useMemo(
    () => buildColumnDefs(setInvitationToCancel, rolesMap),
    [rolesMap]
  );

  if (error) {
    return (
      <div
        data-testid="invitations-error"
        className="rounded-lg bg-destructive/10 p-6 text-center"
        role="alert"
      >
        <p className="text-destructive">Failed to load invitations.</p>
        <button
          data-testid="invitations-retry-btn"
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
          data-testid="invitations-heading"
          className="text-xl font-semibold text-foreground"
        >
          Invitations
        </h2>
      </div>

      <DataTable
        data={invitations}
        columns={columns}
        loading={isLoading}
        enableSorting={false}
        enableColumnResizing={false}
      />

      <ConfirmDialog
        isOpen={!!invitationToCancel}
        title="Cancel Invitation"
        message={`Are you sure you want to cancel the invitation for ${invitationToCancel?.email}? This action cannot be undone.`}
        confirmLabel={isCancelling ? 'Cancelling...' : 'Cancel Invitation'}
        onConfirm={handleCancelConfirm}
        onCancel={() => setInvitationToCancel(null)}
        isLoading={isCancelling}
      />
    </div>
  );
}
