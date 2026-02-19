import { formatDate } from './util-date.js';

describe('formatDate', () => {
  it('formats a valid timestamp as a locale date string', () => {
    const timestamp = new Date('2026-01-15').getTime();
    const result = formatDate(timestamp);
    expect(result).toBe(new Date(timestamp).toLocaleDateString());
  });

  it('returns a placeholder for undefined timestamps', () => {
    expect(formatDate(undefined)).toBe('—');
  });
});
