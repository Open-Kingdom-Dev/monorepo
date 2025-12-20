import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormField } from './FormField.component';

describe('FormField', () => {
  it('displays the label for the field', () => {
    render(<FormField id="email" label="Email Address" />);

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('shows required indicator for mandatory fields', () => {
    render(<FormField id="email" label="Email" required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('hides required indicator for optional fields', () => {
    render(<FormField id="email" label="Email" />);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('shows error message when validation fails', () => {
    render(
      <FormField id="email" label="Email" error="Please enter a valid email" />
    );

    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
  });

  it('hides error message when field is valid', () => {
    render(<FormField id="email" label="Email" />);

    expect(
      screen.queryByText('Please enter a valid email')
    ).not.toBeInTheDocument();
  });

  it('forwards input attributes to the underlying input', () => {
    render(
      <FormField
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
    expect(input).toBeDisabled();
  });
});
