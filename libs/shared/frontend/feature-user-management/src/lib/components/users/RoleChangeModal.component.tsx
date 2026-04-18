import { useState, useMemo } from 'react';
import { useDeepCompareEffect } from '@react-hookz/web';
import { useDispatch } from 'react-redux';
import {
  useRolesControllerFindAllQuery,
  useUserRolesControllerSetRolesMutation,
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
import { FormField } from '../shared/FormField.component';

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; email: string; role: string };
}

export function RoleChangeModal({
  isOpen,
  onClose,
  user,
}: RoleChangeModalProps) {
  const dispatch = useDispatch();
  const { data: roles } = useRolesControllerFindAllQuery();
  const [setRoles, { isLoading }] = useUserRolesControllerSetRolesMutation();

  const roleList = useMemo(
    () => (roles as { id: number; name: string }[]) ?? [],
    [roles]
  );

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useDeepCompareEffect(() => {
    if (!roleList.length) return;
    const match = roleList.find((r) => r.name === user.role);
    setSelectedRoleId(match?.id ?? null);
  }, [roleList, user.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoleId === null) return;

    try {
      await setRoles({
        userId: user.id,
        updateUserRolesDto: { roleIds: [selectedRoleId] },
      }).unwrap();
      dispatch(showSuccessNotification('Role updated successfully'));
      onClose();
    } catch {
      // Error notification handled by RTK error middleware
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Changing role for <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Role" htmlFor="role-select">
            <select
              id="role-select"
              data-testid="role-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedRoleId ?? ''}
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
            >
              {roleList.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              data-testid="role-change-cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="role-change-submit-btn"
              disabled={isLoading || selectedRoleId === null}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
