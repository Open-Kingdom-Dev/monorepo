import { useState, useMemo } from 'react';
import { useDeepCompareEffect } from '@react-hookz/web';
import { useDispatch } from 'react-redux';
import {
  usePermissionsControllerFindAllQuery,
  useRolesControllerGetPermissionsQuery,
  useRolesControllerSetPermissionsMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@open-kingdom/shared-frontend-ui-primitives';

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

  useDeepCompareEffect(() => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Editing permissions for <strong>{role.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="mt-4">
          <div className="max-h-64 space-y-4 overflow-y-auto">
            {[...grouped.entries()].map(([resource, perms]) => (
              <fieldset key={resource}>
                <legend className="text-sm font-medium capitalize text-foreground">
                  {resource}
                </legend>
                <div className="mt-1 space-y-1">
                  {perms.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="rounded border-input text-primary focus:ring-ring"
                      />
                      <span>{p.action}</span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground/70">
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
            <Button
              type="button"
              variant="secondary"
              data-testid="permissions-cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="permissions-save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
