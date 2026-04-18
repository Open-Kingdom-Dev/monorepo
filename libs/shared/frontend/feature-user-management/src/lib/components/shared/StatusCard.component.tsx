import { Card, CardContent } from '@open-kingdom/shared-frontend-ui-primitives';

type StatusVariant = 'loading' | 'error' | 'success';

interface StatusCardProps {
  variant: StatusVariant;
  title?: string;
  message: string;
  children?: React.ReactNode;
}

const headingStyles: Record<Exclude<StatusVariant, 'loading'>, string> = {
  error: 'text-xl font-bold text-destructive',
  success: 'text-xl font-bold text-success',
};

export function StatusCard({
  variant,
  title,
  message,
  children,
}: StatusCardProps) {
  if (variant === 'loading') {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="max-w-md mx-auto mt-8"
      role={variant === 'error' ? 'alert' : undefined}
    >
      <CardContent className="pt-6">
        {title && (
          <h2
            data-testid="status-card-title"
            className={headingStyles[variant]}
          >
            {title}
          </h2>
        )}
        <p
          data-testid="status-card-message"
          className="mt-2 text-muted-foreground"
        >
          {message}
        </p>
        {children}
      </CardContent>
    </Card>
  );
}
