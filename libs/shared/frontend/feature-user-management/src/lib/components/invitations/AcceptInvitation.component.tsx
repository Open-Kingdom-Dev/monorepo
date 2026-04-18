import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useInvitationsControllerValidateQuery,
  useInvitationsControllerAcceptMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';
import {
  Card,
  CardContent,
  Input,
  Button,
} from '@open-kingdom/shared-frontend-ui-primitives';
import { StatusCard } from '../shared/StatusCard.component';
import { FormField } from '../shared/FormField.component';

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
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
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
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="pt-6">
        <h2
          data-testid="accept-heading"
          className="text-xl font-bold text-foreground"
        >
          Accept Invitation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You've been invited with email{' '}
          <strong data-testid="accept-email">{email}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <FormField label="First Name" htmlFor="accept-firstName">
            <Input
              id="accept-firstName"
              data-testid="accept-first-name-input"
              type="text"
              placeholder="John"
              {...register('firstName')}
            />
          </FormField>
          <FormField label="Last Name" htmlFor="accept-lastName">
            <Input
              id="accept-lastName"
              data-testid="accept-last-name-input"
              type="text"
              placeholder="Doe"
              {...register('lastName')}
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="accept-password"
            required
            error={errors.password?.message}
          >
            <Input
              id="accept-password"
              data-testid="accept-password-input"
              type="password"
              placeholder="Min. 8 characters"
              {...register('password')}
            />
          </FormField>
          <FormField
            label="Confirm Password"
            htmlFor="accept-confirmPassword"
            required
            error={errors.confirmPassword?.message}
          >
            <Input
              id="accept-confirmPassword"
              data-testid="accept-confirm-password-input"
              type="password"
              placeholder="Repeat password"
              {...register('confirmPassword')}
            />
          </FormField>
          <Button
            type="submit"
            data-testid="accept-submit-btn"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
