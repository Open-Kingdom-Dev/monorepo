import type { User } from './types/user-management.types';

export function formatUserName(user: Pick<User, 'firstName' | 'lastName'>) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || '—';
}

interface ErrorWithData {
  data?: { message?: string };
}

function isErrorWithData(error: unknown): error is ErrorWithData {
  return Boolean(error && typeof error === 'object' && 'data' in error);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!isErrorWithData(error)) {
    return fallback;
  }
  return error.data?.message ?? fallback;
}
