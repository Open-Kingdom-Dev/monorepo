import { forwardRef, type InputHTMLAttributes } from 'react';
import { styles } from '../styles';

interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  className?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, required, error, className, ...inputProps }, ref) => {
    return (
      <div className={className}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <input ref={ref} id={id} className={styles.input} {...inputProps} />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
