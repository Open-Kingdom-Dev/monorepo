import { formatUserName, getErrorMessage } from './utils';

describe('formatUserName', () => {
  it('displays full name when both first and last name exist', () => {
    const user = { firstName: 'John', lastName: 'Doe' };

    expect(formatUserName(user)).toBe('John Doe');
  });

  it('displays first name only when last name is missing', () => {
    const user = { firstName: 'John', lastName: null };

    expect(formatUserName(user)).toBe('John');
  });

  it('displays last name only when first name is missing', () => {
    const user = { firstName: null, lastName: 'Doe' };

    expect(formatUserName(user)).toBe('Doe');
  });

  it('displays a placeholder when no name is available', () => {
    const user = { firstName: null, lastName: null };

    expect(formatUserName(user)).toBe('—');
  });

  it('handles undefined values the same as null', () => {
    const user = { firstName: undefined, lastName: undefined } as never;

    expect(formatUserName(user)).toBe('—');
  });

  it('handles empty strings as missing names', () => {
    const user = { firstName: '', lastName: '' };

    expect(formatUserName(user)).toBe('—');
  });
});

describe('getErrorMessage', () => {
  it('extracts the message from an API error response', () => {
    const error = {
      data: { message: 'User already exists' },
    };

    expect(getErrorMessage(error, 'Default error')).toBe('User already exists');
  });

  it('returns the fallback when error has no message', () => {
    const error = { data: {} };

    expect(getErrorMessage(error, 'Something went wrong')).toBe(
      'Something went wrong'
    );
  });

  it('returns the fallback for null errors', () => {
    expect(getErrorMessage(null, 'Fallback message')).toBe('Fallback message');
  });

  it('returns the fallback for undefined errors', () => {
    expect(getErrorMessage(undefined, 'Fallback message')).toBe(
      'Fallback message'
    );
  });

  it('returns the fallback for primitive errors', () => {
    expect(getErrorMessage('string error', 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(123, 'Fallback')).toBe('Fallback');
  });

  it('returns the fallback when data property is missing', () => {
    const error = { status: 500 };

    expect(getErrorMessage(error, 'Server error')).toBe('Server error');
  });
});
