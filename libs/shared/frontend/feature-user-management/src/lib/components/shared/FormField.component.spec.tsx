import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormField } from './FormField.component';

describe('FormField', () => {
  it('displays the field label', () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('marks required fields with an asterisk', () => {
    render(
      <FormField label="Email" htmlFor="email" required>
        <input id="email" type="email" />
      </FormField>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not mark optional fields', () => {
    render(
      <FormField label="Name" htmlFor="name">
        <input id="name" type="text" />
      </FormField>
    );
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('shows an error message when validation fails', () => {
    render(
      <FormField label="Email" htmlFor="email" error="Invalid email">
        <input id="email" type="email" />
      </FormField>
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('hides the error message when the field is valid', () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" type="email" />
      </FormField>
    );
    expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
  });
});
