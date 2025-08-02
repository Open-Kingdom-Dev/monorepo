import { getAppLinks, getAppMeta, getAppTitle } from './app.config';

describe('App Configuration', () => {
  describe('getAppMeta', () => {
    it('should return meta configuration with title', () => {
      const mockArgs = {} as any;
      const meta = getAppMeta(mockArgs);

      expect(Array.isArray(meta)).toBe(true);
      expect(meta).toHaveLength(1);
      expect(meta?.[0]).toEqual({
        title: 'New Nx React Router App',
      });
    });
  });

  describe('getAppLinks', () => {
    it('should return links configuration', () => {
      const links = getAppLinks();
      expect(Array.isArray(links)).toBe(true);
    });
  });

  describe('getAppTitle', () => {
    it('should return correct app title', () => {
      const title = getAppTitle();

      expect(title).toBe('New Nx React Router App');
      expect(typeof title).toBe('string');
    });
  });
});
