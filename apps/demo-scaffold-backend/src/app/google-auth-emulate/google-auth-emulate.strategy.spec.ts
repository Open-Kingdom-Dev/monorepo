import axios from 'axios';
import http from 'http';
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

    it('handles a sparse userinfo payload with optional fields absent', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: { sub: 'user_123' },
      });

      const profile = await new Promise((resolve, reject) => {
        strategy.userProfile('mock-access-token', (err, p) =>
          err ? reject(err) : resolve(p)
        );
      });

      // Optional profile fields fall back to safe defaults when missing.
      expect(profile).toMatchObject({
        id: 'user_123',
        displayName: '',
        provider: 'google',
        emails: undefined,
        photos: undefined,
      });
    });

    it('logs a fallback error body when the failure has no response payload', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const err = await new Promise((resolve) => {
        strategy.userProfile('mock-access-token', (e) => resolve(e));
      });

      expect(err).toBeInstanceOf(Error);
      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].statusCode).toBe(500);
      expect(logs[0].responseBody).toContain('ECONNREFUSED');
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
    const buildProfile = () =>
      ({
        id: 'user_123',
        displayName: 'Test User',
        emails: [{ value: 'testuser@example.com', verified: true }],
        photos: [{ value: 'https://example.com/pic.jpg' }],
        provider: 'google',
        // Realistic: _json is the userinfo response, which never contains an
        // id_token — that lives in the token response params instead.
        _raw: '{}',
        _json: { sub: 'user_123', email: 'testuser@example.com' },
        name: { familyName: '', givenName: 'Test' },
      } as never);

    const callValidate = (
      params: { id_token?: string },
      profile = buildProfile()
    ) =>
      new Promise((resolve, reject) => {
        strategy.validate(
          'mock-access-token',
          'mock-refresh-token',
          params,
          profile,
          (err, u) => (err ? reject(err) : resolve(u))
        );
      });

    it('stores the OAuth result using the id_token from the token response', async () => {
      const user = await callValidate({ id_token: 'mock-id-token' });

      expect(user).toMatchObject({
        tokens: {
          access_token: 'mock-access-token',
          id_token: 'mock-id-token',
        },
        userProfile: { email: 'testuser@example.com' },
      });

      // validate() itself does not synthesize a token POST row — the real
      // exchange is captured by the _oauth2._request interceptor instead.
      const logs = service.getLogs();
      expect(logs).toHaveLength(0);

      const result = service.getLastOAuthResult();
      expect(result?.tokens?.access_token).toBe('mock-access-token');
      expect(result?.apiLogs).toHaveLength(0);
    });

    it('does not read id_token from the userinfo profile payload', async () => {
      const user = await callValidate({});

      expect(user).toMatchObject({
        tokens: {
          access_token: 'mock-access-token',
          id_token: 'mock-access-token',
        },
      });
    });
  });

  describe('_oauth2._request interceptor', () => {
    // Access the strategy's internal OAuth2 client, as passport-google-oauth20
    // subclasses may (this._oauth2 is documented as protected).
    const getOAuth2Client = (s: GoogleAuthEmulateStrategy) =>
      (s as unknown as { _oauth2: { _request: (...a: unknown[]) => unknown } })
        ._oauth2;

    let server: http.Server;
    let serverUrl: string;

    beforeEach(async () => {
      // Drive the interceptor against a real local HTTP server (the same
      // transport `oauth`'s _executeRequest uses) so the log reflects an
      // actual request/response rather than a synthesized row.
      server = http.createServer((req, res) => {
        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });
        req.on('end', () => {
          // Serve a non-JSON 200 body for the plain-text case.
          if (req.url?.includes('/plain')) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('not-json-body');
            return;
          }
          if (rawBody.includes('code=bad-code')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'invalid_grant',
                error_description: 'bad code',
              })
            );
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              access_token: 'real-access-token',
              refresh_token: 'real-refresh-token',
              id_token: 'real-id-token',
              token_type: 'Bearer',
              expires_in: 3600,
            })
          );
        });
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      const address = server.address() as { port: number };
      serverUrl = `http://127.0.0.1:${address.port}`;
    });

    afterEach(async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    });

    it('logs a real token POST with measured latency on success', async () => {
      const client = getOAuth2Client(strategy);
      const body =
        'grant_type=authorization_code&client_id=example-client-id.apps.googleusercontent.com&client_secret=GOCSPX-example_secret&code=abc123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgoogle-auth-emulate%2Fcallback';

      await new Promise<void>((resolve, reject) => {
        client._request(
          'POST',
          `${serverUrl}/oauth2/token`,
          { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          null,
          (err, data) => {
            try {
              expect(err).toBeNull();
              // oauth's _executeRequest yields (null, result, response); data is the raw body string.
              expect(typeof data).toBe('string');
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        method: 'POST',
        url: `${serverUrl}/oauth2/token`,
        statusCode: 200,
      });
      expect(logs[0].latencyMs).toBeGreaterThanOrEqual(0);
      // Request body is redacted of secrets, not logged raw.
      expect(logs[0].requestBody).toBeDefined();
      expect(logs[0].requestBody).not.toContain('client_secret=GOCSPX');
      expect(logs[0].requestBody).not.toContain('code=abc123');
      // Real response captured from the server, not synthesized.
      expect(logs[0].responseBody).toContain('real-access-token');
    });

    it('logs the real status code when the token exchange fails', async () => {
      const client = getOAuth2Client(strategy);
      const body =
        'grant_type=authorization_code&client_id=example-client-id.apps.googleusercontent.com&client_secret=GOCSPX-example_secret&code=bad-code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgoogle-auth-emulate%2Fcallback';

      await new Promise<void>((resolve, reject) => {
        client._request(
          'POST',
          `${serverUrl}/oauth2/token`,
          { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          null,
          (err) => {
            try {
              expect(err).toBeTruthy();
              expect((err as { statusCode?: number }).statusCode).toBe(400);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      // A failed exchange must log the real non-2xx status, never 200.
      expect(logs[0].statusCode).toBe(400);
      expect(logs[0].responseBody).toContain('invalid_grant');
    });

    it('logs a GET carrying an access token and null headers', async () => {
      const client = getOAuth2Client(strategy);

      await new Promise<void>((resolve, reject) => {
        client._request(
          'GET',
          `${serverUrl}/plain`,
          null,
          '',
          'tok_1234567890abcdef',
          (err) => {
            try {
              expect(err).toBeNull();
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        method: 'GET',
        statusCode: 200,
      });
      // The access token is redacted in the logged Authorization header.
      expect(logs[0].requestHeaders?.['Authorization']).toBe(
        'Bearer tok_1234567890a...'
      );
      // A non-JSON body is preserved as the raw response body.
      expect(logs[0].responseBody).toContain('not-json-body');
    });

    it('logs a transport-level failure without an HTTP status', async () => {
      const client = getOAuth2Client(strategy);
      // Point at a port with nothing listening -> request error (no statusCode).
      const closedPort = await new Promise<number>((resolve) => {
        const s = http.createServer();
        s.listen(0, '127.0.0.1', () => {
          const port = (s.address() as { port: number }).port;
          s.close(() => resolve(port));
        });
      });

      await new Promise<void>((resolve, reject) => {
        client._request(
          'POST',
          `http://127.0.0.1:${closedPort}/oauth2/token`,
          { 'Content-Type': 'application/x-www-form-urlencoded' },
          'grant_type=authorization_code&code=abc&client_secret=secret',
          null,
          (err) => {
            try {
              expect(err).toBeTruthy();
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      const logs = service.getLogs();
      expect(logs).toHaveLength(1);
      // No statusCode available -> falls back to 500.
      expect(logs[0].statusCode).toBe(500);
    });
  });
});
