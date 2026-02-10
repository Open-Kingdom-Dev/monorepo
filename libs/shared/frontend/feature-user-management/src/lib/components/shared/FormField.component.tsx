import { labelStyles } from '../../styles';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelStyles}>
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      {children}
      {error && (
        <p
          data-testid="field-error"
          className="mt-1 text-sm text-error-600 dark:text-error-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
