import { GoogleAuthEmulateService } from './google-auth-emulate.service';

describe('GoogleAuthEmulateService', () => {
  let service: GoogleAuthEmulateService;

  beforeEach(() => {
    service = new GoogleAuthEmulateService();
  });

  afterEach(async () => {
    await service.stop();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return offline status initially', async () => {
    const status = await service.status();
    expect(status.running).toBe(false);
    expect(status.healthy).toBe(false);
    expect(status.port).toBe(9015);
  });

  it('should append and retrieve API logs', () => {
    service.appendLog({
      method: 'POST',
      url: 'http://localhost:9015/oauth2/token',
      statusCode: 200,
      requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseHeaders: { 'content-type': 'application/json' },
      responseBody: '{"access_token":"mock"}',
      latencyMs: 12,
    });

    const logs = service.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      method: 'POST',
      url: 'http://localhost:9015/oauth2/token',
      statusCode: 200,
      latencyMs: 12,
    });
    expect(logs[0].id).toBeDefined();
    expect(logs[0].timestamp).toBeDefined();
  });

  it('should set and retrieve OAuth result', () => {
    const tokens = {
      access_token: 'mock-access',
      id_token: 'mock-id',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'openid profile email',
    };
    const userProfile = {
      sub: '123',
      email: 'test@example.com',
      name: 'Test User',
      picture: '',
      email_verified: true,
    };

    service.appendLog({
      method: 'GET',
      url: 'http://localhost:9015/oauth2/v2/userinfo',
      statusCode: 200,
      requestHeaders: {},
      responseHeaders: {},
      responseBody: '{}',
      latencyMs: 5,
    });

    service.setOAuthResult(tokens, userProfile);
    const result = service.getLastOAuthResult();
    expect(result?.tokens?.access_token).toBe('mock-access');
    expect(result?.userProfile?.email).toBe('test@example.com');
    expect(result?.apiLogs).toHaveLength(1);
  });

  it('should reset logs and result cleanly', async () => {
    const res = await service.reset();
    expect(res.success).toBe(true);
    expect(service.getLogs()).toEqual([]);
    expect(service.getLastOAuthResult()).toBeNull();
  });
});
