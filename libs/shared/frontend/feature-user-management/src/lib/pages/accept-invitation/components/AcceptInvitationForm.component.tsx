import { useMemo } from 'react';
import { useUpdateEffect } from '@react-hookz/web';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { styles } from '../../../styles';
import { FormField } from '../../../components';
import { createUserManagementEndpoints } from '../../../api';
import {
  acceptInvitationSchema,
  type AcceptInvitationFormData,
} from '../../../schemas';
import { useValidateInvitation, useAcceptInvitationApi } from '../hooks';
import type { AcceptInvitationPageProps } from '../AcceptInvitation.page';

interface AcceptInvitationFormProps extends AcceptInvitationPageProps {
  token: string;
}

export function AcceptInvitationForm({
  api,
  token,
  onSuccess,
  onNotify,
  onNavigate,
  loginUrl = '/login',
}: AcceptInvitationFormProps) {
  const injectedApi = useMemo(
    () =>
      api.injectEndpoints({
        endpoints: createUserManagementEndpoints,
        overrideExisting: false,
      }),
    [api]
  );

  const { validation, isValidating, validationError } = useValidateInvitation({
    injectedApi,
    token,
  });

  const { acceptInvitation, isAccepting, success } = useAcceptInvitationApi({
    injectedApi,
    token,
    loginUrl,
    onSuccess,
    onNotify,
    onNavigate,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  useUpdateEffect(() => {
    if (validation?.valid) {
      reset({
        firstName: validation.firstName || '',
        lastName: validation.lastName || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [validation, reset]);

  if (isValidating) {
    return <p className={styles.loading}>Validating invitation...</p>;
  }

  if (validationError || !validation?.valid) {
    return (
      <div className={styles.message}>
        <p className={`${styles.messageTitle} ${styles.error}`}>
          Invalid Invitation
        </p>
        <p className={styles.error}>
          {validation?.error ||
            'This invitation link is invalid or has expired.'}
        </p>
        <a
          href={loginUrl}
          className={`${styles.buttonPrimary} mt-4 inline-block`}
        >
          Go to Login
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.message}>
        <p className={`${styles.messageTitle} ${styles.success}`}>
          Account Activated!
        </p>
        <p className={styles.success}>
          Your account has been created. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.card} max-w-md mx-auto mt-12`}>
      <h1 className={`${styles.cardHeader} mb-2`}>Set Your Password</h1>
      <p className={`${styles.textMuted} mb-6`}>
        Welcome! Set a password for{' '}
        <strong className={styles.text}>{validation.email}</strong>
      </p>

      <form onSubmit={handleSubmit(acceptInvitation)} className="space-y-4">
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

        <FormField
          id="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <FormField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          disabled={isAccepting}
          className={`${styles.buttonPrimary} w-full`}
        >
          {isAccepting ? 'Activating...' : 'Activate Account'}
        </button>
      </form>
    </div>
  );
}
