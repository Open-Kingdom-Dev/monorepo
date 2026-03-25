import { useState, useMemo } from 'react';
import { useDeepCompareEffect } from '@react-hookz/web';
import { useDispatch } from 'react-redux';
import {
  useRolesControllerFindAllQuery,
  useUserRolesControllerSetRolesMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import { ModalOverlay } from '../shared/ModalOverlay.component';
import { FormField } from '../shared/FormField.component';
import {
  inputStyles,
  buttonPrimaryStyles,
  buttonSecondaryStyles,
} from '../../styles';

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

  const titleId = 'role-change-modal-title';

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
    <ModalOverlay isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId}>
      <h3
        id={titleId}
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
      >
        Change Role
      </h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Changing role for <strong>{user.email}</strong>
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <FormField label="Role" htmlFor="role-select">
          <select
            id="role-select"
            data-testid="role-select"
            className={inputStyles}
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
          <button
            type="button"
            data-testid="role-change-cancel-btn"
            onClick={onClose}
            disabled={isLoading}
            className={buttonSecondaryStyles}
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="role-change-submit-btn"
            disabled={isLoading || selectedRoleId === null}
            className={buttonPrimaryStyles}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
