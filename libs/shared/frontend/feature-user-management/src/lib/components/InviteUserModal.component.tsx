import { useCallback, useMemo } from 'react';
import { useUpdateEffect } from '@react-hookz/web';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { styles } from '../styles';
import { createUserManagementEndpoints } from '../api';
import { inviteUserSchema, type InviteUserFormData } from '../schemas';
import { FormField } from './FormField.component';
import { getErrorMessage } from '../utils';
import type { CustomRole, BaseApi } from '../types';

export interface InviteUserModalProps {
  api: BaseApi;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export function InviteUserModal({
  api,
  isOpen,
  onClose,
  onSuccess,
  onNotify,
}: InviteUserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'user',
      customRoleId: undefined,
    },
  });

  const injectedApi = useMemo(() => {
    return api.injectEndpoints({
      endpoints: createUserManagementEndpoints,
      overrideExisting: false,
    });
  }, [api]);

  const [inviteUser, { isLoading, error: apiError }] =
    injectedApi.useInviteUserMutation();
  const { data: customRoles } = injectedApi.useListRolesQuery();

  useUpdateEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const onSubmit = useCallback(
    async (data: InviteUserFormData) => {
      const result = await inviteUser({
        email: data.email.trim(),
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        role: data.role,
        customRoleId: data.customRoleId,
      });

      if ('data' in result) {
        reset();
        onSuccess?.();
      }
    },
    [inviteUser, reset, onSuccess]
  );

  if (!isOpen) return null;

  const apiErrorMessage = apiError ? getErrorMessage(apiError, '') : undefined;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalHeader}>Invite New User</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="user@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="firstName"
              label="First Name"
              {...register('firstName')}
            />
            <FormField
              id="lastName"
              label="Last Name"
              {...register('lastName')}
            />
          </div>

          <div>
            <label htmlFor="role" className={styles.label}>
              Role
            </label>
            <select id="role" {...register('role')} className={styles.input}>
              <option value="guest">Guest</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {customRoles && customRoles.length > 0 && (
            <div>
              <label htmlFor="customRoleId" className={styles.label}>
                Custom Role
              </label>
              <select
                id="customRoleId"
                {...register('customRoleId', { valueAsNumber: true })}
                className={styles.input}
              >
                <option value="">None</option>
                {customRoles.map((cr: CustomRole) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {apiErrorMessage && <p className={styles.error}>{apiErrorMessage}</p>}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.buttonSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.buttonPrimary}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
