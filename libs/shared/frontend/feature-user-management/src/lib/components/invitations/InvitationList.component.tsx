import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  useInvitationsControllerFindAllQuery,
  useInvitationsControllerCancelMutation,
  useRolesControllerFindAllQuery,
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
import { StatusBadge } from '../shared/StatusBadge.component';
import { buttonInlineDestructiveStyles } from '../../styles';
import { formatDate } from '@open-kingdom/shared-poly-util-date';
import type { Invitation } from '../../types';

const emailColumn: ColDef<Invitation> = {
  field: 'email',
  headerName: 'Email',
  flex: 2,
};

function roleColumn(rolesMap: Map<number, string>): ColDef<Invitation> {
  return {
    headerName: 'Role',
    flex: 1,
    cellRenderer: (params: ICellRendererParams<Invitation>) =>
      params.data ? (
        <RoleBadge role={rolesMap.get(params.data.roleId) ?? null} />
      ) : null,
  };
}

const statusColumn: ColDef<Invitation> = {
  field: 'status',
  headerName: 'Status',
  flex: 1,
  cellRenderer: (params: ICellRendererParams<Invitation>) =>
    params.data ? <StatusBadge status={params.data.status} /> : null,
};

const invitedColumn: ColDef<Invitation> = {
  headerName: 'Invited',
  flex: 1,
  valueGetter: (params) => formatDate(params.data?.invitedAt),
};

const expiresColumn: ColDef<Invitation> = {
  headerName: 'Expires',
  flex: 1,
  valueGetter: (params) => formatDate(params.data?.tokenExpiry),
};

function cancelColumn(
  onCancel: (invitation: Invitation) => void
): ColDef<Invitation> {
  return {
    headerName: 'Actions',
    flex: 1,
    sortable: false,
    filter: false,
    cellRenderer: (params: ICellRendererParams<Invitation>) => {
      if (!params.data) return null;
      return (
        <button
          onClick={() => params.data && onCancel(params.data)}
          className={buttonInlineDestructiveStyles}
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
): ColDef<Invitation>[] {
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
  const { theme, mode } = useTheme();
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

  const columnDefs = useMemo(
    () => buildColumnDefs(setInvitationToCancel, rolesMap),
    [rolesMap]
  );

  if (error) {
    return (
      <div
        data-testid="invitations-error"
        className="rounded-lg bg-error-50 p-6 text-center dark:bg-error-900/20"
        role="alert"
      >
        <p className="text-error-700 dark:text-error-300">
          Failed to load invitations.
        </p>
        <button
          data-testid="invitations-retry-btn"
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
          data-testid="invitations-heading"
          className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Invitations
        </h2>
      </div>

      <DataGrid
        rowData={invitations}
        columnDefs={columnDefs}
        mode={mode}
        theme={theme as DataGridTheme}
        loading={isLoading}
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
