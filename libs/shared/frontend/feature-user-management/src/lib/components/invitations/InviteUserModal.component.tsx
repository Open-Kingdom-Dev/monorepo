import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import {
  useInvitationsControllerInviteMutation,
  useRolesControllerFindAllQuery,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { showSuccessNotification } from '@open-kingdom/shared-frontend-data-access-notifications';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
} from '@open-kingdom/shared-frontend-ui-primitives';
import { FormField } from '../shared/FormField.component';

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
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => !open && handleClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Email"
            htmlFor="invite-email"
            required
            error={errors.email?.message}
          >
            <Input
              id="invite-email"
              data-testid="invite-email-input"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
            />
          </FormField>
          <FormField label="Role" htmlFor="invite-role">
            <select
              id="invite-role"
              data-testid="invite-role-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <Button
              type="button"
              variant="secondary"
              data-testid="invite-cancel-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="invite-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
