import type { AuthPersistence } from '../auth.slice';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function storagePersistence(
  storage: StorageLike,
  key = 'token'
): AuthPersistence {
  return {
    getToken: () => {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setToken: (token) => {
      try {
        if (token) storage.setItem(key, token);
        else storage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    },
  };
}
