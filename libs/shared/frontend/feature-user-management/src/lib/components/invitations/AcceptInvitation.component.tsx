import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useInvitationsControllerValidateQuery,
  useInvitationsControllerAcceptMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import { StatusCard } from '../shared/StatusCard.component';
import { FormField } from '../shared/FormField.component';
import {
  inputStyles,
  buttonPrimaryStyles,
  cardStyles,
  bodyTextStyles,
} from '../../styles';

const acceptSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptFormValues = z.infer<typeof acceptSchema>;

interface AcceptInvitationProps {
  token: string;
  loginPath?: string;
}

export function AcceptInvitation({ token, loginPath }: AcceptInvitationProps) {
  const {
    data: validation,
    isLoading: isValidating,
    error: validationError,
  } = useInvitationsControllerValidateQuery({ token });

  const [accept, { isLoading, isSuccess }] =
    useInvitationsControllerAcceptMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const email = validation?.email ?? '';
  const role = validation?.role ?? 'user';

  const onSubmit = async (data: AcceptFormValues) => {
    try {
      await accept({
        acceptInvitationDto: {
          token,
          password: data.password,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
        },
      }).unwrap();
    } catch {
      // Error notification handled by RTK error middleware
    }
  };

  if (isSuccess) {
    return (
      <StatusCard
        variant="success"
        title="Account Created"
        message="Your account has been created successfully. You can now log in with your email and password."
      >
        {loginPath && (
          <a
            href={loginPath}
            data-testid="accept-login-link"
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            Go to login
          </a>
        )}
      </StatusCard>
    );
  }

  if (isValidating) {
    return <StatusCard variant="loading" message="Validating invitation..." />;
  }

  if (validationError) {
    return (
      <StatusCard
        variant="error"
        title="Validation Failed"
        message="Unable to validate this invitation. Please check your connection and try again."
      />
    );
  }

  if (!validation?.valid) {
    return (
      <StatusCard
        variant="error"
        title="Invalid Invitation"
        message="This invitation link is invalid or has expired. Please contact the person who invited you for a new link."
      />
    );
  }

  return (
    <div className={cardStyles}>
      <h2
        data-testid="accept-heading"
        className="text-xl font-bold text-neutral-900 dark:text-neutral-100"
      >
        Accept Invitation
      </h2>
      <p className={`mt-1 text-sm ${bodyTextStyles}`}>
        You've been invited as <strong data-testid="accept-role">{role}</strong>{' '}
        with email <strong data-testid="accept-email">{email}</strong>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <FormField label="First Name" htmlFor="accept-firstName">
          <input
            id="accept-firstName"
            data-testid="accept-first-name-input"
            type="text"
            placeholder="John"
            className={inputStyles}
            {...register('firstName')}
          />
        </FormField>
        <FormField label="Last Name" htmlFor="accept-lastName">
          <input
            id="accept-lastName"
            data-testid="accept-last-name-input"
            type="text"
            placeholder="Doe"
            className={inputStyles}
            {...register('lastName')}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="accept-password"
          required
          error={errors.password?.message}
        >
          <input
            id="accept-password"
            data-testid="accept-password-input"
            type="password"
            placeholder="Min. 8 characters"
            className={inputStyles}
            {...register('password')}
          />
        </FormField>
        <FormField
          label="Confirm Password"
          htmlFor="accept-confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <input
            id="accept-confirmPassword"
            data-testid="accept-confirm-password-input"
            type="password"
            placeholder="Repeat password"
            className={inputStyles}
            {...register('confirmPassword')}
          />
        </FormField>
        <button
          type="submit"
          data-testid="accept-submit-btn"
          disabled={isLoading}
          className={`w-full ${buttonPrimaryStyles}`}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
