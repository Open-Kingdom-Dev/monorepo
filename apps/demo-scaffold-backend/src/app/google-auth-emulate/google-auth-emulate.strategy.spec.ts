import axios from 'axios';
import { GoogleAuthEmulateStrategy } from './google-auth-emulate.strategy';
import { GoogleAuthEmulateService } from './google-auth-emulate.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GoogleAuthEmulateStrategy', () => {
  let strategy: GoogleAuthEmulateStrategy;
  let service: GoogleAuthEmulateService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GoogleAuthEmulateService();
    strategy = new GoogleAuthEmulateStrategy(service);
  });

  describe('userProfile', () => {
    it('logs the userinfo GET and resolves a profile', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: {
          sub: 'user_123',
          name: 'Test User',
          email: 'testuser@example.com',
          email_verified: true,
          picture: 'https://example.com/pic.jpg',
        },
      });

      const profile = await new Promise((resolve, reject) => {
        strategy.userProfile('mock-access-token', (err, p) =>
          err ? reject(err) : resolve(p)
        );
      });

      expect(profile).toMatchObject({
        id: 'user_123',
        displayName: 'Test User',
        provider: 'google',
      });

      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        method: 'GET',
        url: 'http://localhost:9015/oauth2/v2/userinfo',
        statusCode: 200,
      });
      expect(logs[0].requestHeaders?.Authorization).toContain('Bearer');
    });

    it('logs the failed userinfo GET and calls done with the error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          headers: {},
          data: { error: 'boom' },
        },
      });

      const err = await new Promise((resolve) => {
        strategy.userProfile('mock-access-token', (e) => resolve(e));
      });

      expect(err).toBeInstanceOf(Error);
      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        method: 'GET',
        statusCode: 500,
      });
    });
  });

  describe('validate', () => {
    it('logs the token exchange and stores the OAuth result', async () => {
      const profile = {
        id: 'user_123',
        displayName: 'Test User',
        emails: [{ value: 'testuser@example.com', verified: true }],
        photos: [{ value: 'https://example.com/pic.jpg' }],
        provider: 'google',
        _raw: '{}',
        _json: { id_token: 'mock-id-token' },
        name: { familyName: '', givenName: 'Test' },
      } as never;

      const user = await new Promise((resolve, reject) => {
        strategy.validate(
          'mock-access-token',
          'mock-refresh-token',
          profile,
          (err, u) => (err ? reject(err) : resolve(u))
        );
      });

      expect(user).toMatchObject({
        tokens: {
          access_token: 'mock-access-token',
          id_token: 'mock-id-token',
        },
        userProfile: { email: 'testuser@example.com' },
      });

      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        method: 'POST',
        url: 'http://localhost:9015/oauth2/token',
        statusCode: 200,
      });

      const result = service.getLastOAuthResult();
      expect(result?.tokens?.access_token).toBe('mock-access-token');
      expect(result?.apiLogs).toHaveLength(1);
    });
  });
});
