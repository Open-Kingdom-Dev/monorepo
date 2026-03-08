import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  usePermissionsControllerFindAllQuery,
  useRolesControllerGetPermissionsQuery,
  useRolesControllerSetPermissionsMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import { ModalOverlay } from '../shared/ModalOverlay.component';
import { buttonPrimaryStyles, buttonSecondaryStyles } from '../../styles';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: { id: number; name: string };
}

interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string | null;
}

export function RolePermissionsModal({
  isOpen,
  onClose,
  role,
}: RolePermissionsModalProps) {
  const dispatch = useDispatch();
  const { data: allPermissions } = usePermissionsControllerFindAllQuery();
  const { data: rolePermissions } = useRolesControllerGetPermissionsQuery(
    { id: role.id },
    { skip: !isOpen }
  );
  const [setPermissions, { isLoading }] =
    useRolesControllerSetPermissionsMutation();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const permissions = (allPermissions as Permission[] | undefined) ?? [];
  const assigned = (rolePermissions as Permission[] | undefined) ?? [];

  useEffect(() => {
    setSelectedIds(new Set(assigned.map((p) => p.id)));
  }, [assigned]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return map;
  }, [permissions]);

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await setPermissions({
        id: role.id,
        setRolePermissionsDto: { permissionIds: [...selectedIds] },
      }).unwrap();
      dispatch(showSuccessNotification('Permissions updated successfully'));
      onClose();
    } catch {
      // Error notification handled by RTK error middleware
    }
  }

  const titleId = 'role-permissions-modal-title';

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId}>
      <h3
        id={titleId}
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
      >
        Manage Permissions
      </h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Editing permissions for <strong>{role.name}</strong>
      </p>
      <form onSubmit={handleSave} className="mt-4">
        <div className="max-h-64 space-y-4 overflow-y-auto">
          {[...grouped.entries()].map(([resource, perms]) => (
            <fieldset key={resource}>
              <legend className="text-sm font-medium capitalize text-neutral-700 dark:text-neutral-300">
                {resource}
              </legend>
              <div className="mt-1 space-y-1">
                {perms.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600"
                    />
                    <span>{p.action}</span>
                    {p.description && (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        — {p.description}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            data-testid="permissions-cancel-btn"
            onClick={onClose}
            disabled={isLoading}
            className={buttonSecondaryStyles}
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="permissions-save-btn"
            disabled={isLoading}
            className={buttonPrimaryStyles}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
