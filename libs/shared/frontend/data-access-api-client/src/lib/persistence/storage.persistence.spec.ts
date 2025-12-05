import { storagePersistence } from './storage.persistence.js';

describe('Storage Persistence', () => {
  const createMockStorage = () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  });

  describe('reading tokens', () => {
    it('retrieves stored token', () => {
      const storage = createMockStorage();
      storage.getItem.mockReturnValue('stored-token');

      const persistence = storagePersistence(storage);

      expect(persistence.getToken()).toBe('stored-token');
      expect(storage.getItem).toHaveBeenCalledWith('token');
    });

    it('uses custom storage key when provided', () => {
      const storage = createMockStorage();
      storage.getItem.mockReturnValue('custom-token');

      const persistence = storagePersistence(storage, 'custom-key');

      persistence.getToken();
      expect(storage.getItem).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('saving tokens', () => {
    it('saves token to storage', () => {
      const storage = createMockStorage();

      const persistence = storagePersistence(storage);
      persistence.setToken('new-token');

      expect(storage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('uses custom storage key when provided', () => {
      const storage = createMockStorage();

      const persistence = storagePersistence(storage, 'custom-key');
      persistence.setToken('token-value');

      expect(storage.setItem).toHaveBeenCalledWith('custom-key', 'token-value');
    });
  });
});
