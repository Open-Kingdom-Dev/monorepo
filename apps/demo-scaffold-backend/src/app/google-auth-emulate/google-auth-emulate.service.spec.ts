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

  it('should generate valid authorization URL', () => {
    const authUrl = service.getAuthorizationUrl();
    expect(authUrl).toContain('http://localhost:9015/o/oauth2/v2/auth');
    expect(authUrl).toContain(
      'client_id=example-client-id.apps.googleusercontent.com'
    );
    expect(authUrl).toContain('response_type=code');
  });

  it('should reset logs and result cleanly', async () => {
    const res = await service.reset();
    expect(res.success).toBe(true);
    expect(service.getLogs()).toEqual([]);
    expect(service.getLastOAuthResult()).toBeNull();
  });
});
