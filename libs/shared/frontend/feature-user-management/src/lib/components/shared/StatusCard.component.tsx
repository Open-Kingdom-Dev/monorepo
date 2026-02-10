import { cardStyles, bodyTextStyles } from '../../styles';

type StatusVariant = 'loading' | 'error' | 'success';

interface StatusCardProps {
  variant: StatusVariant;
  title?: string;
  message: string;
  children?: React.ReactNode;
}

const headingStyles: Record<Exclude<StatusVariant, 'loading'>, string> = {
  error: 'text-xl font-bold text-error-700 dark:text-error-400',
  success: 'text-xl font-bold text-success-700 dark:text-success-400',
};

export function StatusCard({
  variant,
  title,
  message,
  children,
}: StatusCardProps) {
  if (variant === 'loading') {
    return (
      <div className={cardStyles}>
        <p className={`text-center ${bodyTextStyles}`}>{message}</p>
      </div>
    );
  }

  return (
    <div
      className={cardStyles}
      role={variant === 'error' ? 'alert' : undefined}
    >
      {title && (
        <h2 data-testid="status-card-title" className={headingStyles[variant]}>
          {title}
        </h2>
      )}
      <p data-testid="status-card-message" className={`mt-2 ${bodyTextStyles}`}>
        {message}
      </p>
      {children}
    </div>
  );
}
