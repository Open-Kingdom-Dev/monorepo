import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthEmulateController } from './google-auth-emulate.controller';
import { GoogleAuthEmulateService } from './google-auth-emulate.service';

describe('GoogleAuthEmulateController', () => {
  let controller: GoogleAuthEmulateController;
  let service: GoogleAuthEmulateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleAuthEmulateController],
      providers: [
        {
          provide: GoogleAuthEmulateService,
          useValue: {
            status: jest
              .fn()
              .mockResolvedValue({ running: true, healthy: true, port: 9015 }),
            start: jest
              .fn()
              .mockResolvedValue({ success: true, message: 'Started' }),
            stop: jest
              .fn()
              .mockResolvedValue({ success: true, message: 'Stopped' }),
            reset: jest
              .fn()
              .mockResolvedValue({ success: true, message: 'Reset' }),
            getAuthorizationUrl: jest
              .fn()
              .mockReturnValue('http://localhost:9015/o/oauth2/v2/auth'),
            handleCallback: jest
              .fn()
              .mockResolvedValue({ tokens: {}, userProfile: {}, apiLogs: [] }),
            getLogs: jest.fn().mockReturnValue([]),
            getLastOAuthResult: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    controller = module.get<GoogleAuthEmulateController>(
      GoogleAuthEmulateController
    );
    service = module.get<GoogleAuthEmulateService>(GoogleAuthEmulateService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get emulator status', async () => {
    const status = await controller.getStatus();
    expect(status.running).toBe(true);
    expect(status.port).toBe(9015);
    expect(service.status).toHaveBeenCalled();
  });

  it('should start emulator', async () => {
    const res = await controller.start();
    expect(res.success).toBe(true);
    expect(service.start).toHaveBeenCalled();
  });

  it('should get login URL', () => {
    const res = controller.getLoginUrl();
    expect(res.authUrl).toBe('http://localhost:9015/o/oauth2/v2/auth');
    expect(service.getAuthorizationUrl).toHaveBeenCalled();
  });

  it('should get logs and last result', () => {
    expect(controller.getLogs()).toEqual([]);
    expect(controller.getLastResult()).toBeNull();
  });
});
