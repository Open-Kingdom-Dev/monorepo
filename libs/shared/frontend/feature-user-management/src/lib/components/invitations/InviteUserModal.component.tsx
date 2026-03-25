import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import {
  useInvitationsControllerInviteMutation,
  useRolesControllerFindAllQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import { ModalOverlay } from '../shared/ModalOverlay.component';
import { FormField } from '../shared/FormField.component';
import {
  inputStyles,
  buttonPrimaryStyles,
  buttonSecondaryStyles,
} from '../../styles';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().min(1),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const dispatch = useDispatch();
  const [invite, { isLoading }] = useInvitationsControllerInviteMutation();
  const { data: roles } = useRolesControllerFindAllQuery();

  const roleList = (roles as { id: number; name: string }[]) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'guest' },
  });

  const titleId = 'invite-modal-title';

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: InviteFormValues) => {
    try {
      await invite({ inviteUserDto: data }).unwrap();
      dispatch(showSuccessNotification('Invitation sent successfully'));
      reset();
      onClose();
    } catch {
      // Error notification handled by RTK error middleware
    }
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabelledBy={titleId}
    >
      <h3
        id={titleId}
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
      >
        Invite User
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <FormField
          label="Email"
          htmlFor="invite-email"
          required
          error={errors.email?.message}
        >
          <input
            id="invite-email"
            data-testid="invite-email-input"
            type="email"
            placeholder="user@example.com"
            className={inputStyles}
            {...register('email')}
          />
        </FormField>
        <FormField label="Role" htmlFor="invite-role">
          <select
            id="invite-role"
            data-testid="invite-role-select"
            className={inputStyles}
            {...register('role')}
          >
            {roleList.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
              </option>
            ))}
          </select>
        </FormField>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            data-testid="invite-cancel-btn"
            onClick={handleClose}
            disabled={isLoading}
            className={buttonSecondaryStyles}
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="invite-submit-btn"
            disabled={isLoading}
            className={buttonPrimaryStyles}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
