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

    service.setOAuthResult(tokens, userProfile);
    const result = service.getLastOAuthResult();
    expect(result?.tokens?.access_token).toBe('mock-access');
    expect(result?.userProfile?.email).toBe('test@example.com');
  });

  it('should reset logs and result cleanly', async () => {
    const res = await service.reset();
    expect(res.success).toBe(true);
    expect(service.getLogs()).toEqual([]);
    expect(service.getLastOAuthResult()).toBeNull();
  });
});
