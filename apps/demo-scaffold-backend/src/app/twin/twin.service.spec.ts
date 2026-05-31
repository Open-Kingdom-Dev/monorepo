import { Test, TestingModule } from '@nestjs/testing';
import { TwinService } from './twin.service';
import { GcsStorageService } from '@open-kingdom/shared-backend-feature-gcp-resources';

// Mock the external integration doubles
const mockGcsTwinInstance = {
  start: jest.fn(),
  stop: jest.fn(),
  getEmulatorHost: jest.fn().mockReturnValue('http://localhost:9013'),
  isHealthy: jest.fn().mockResolvedValue(true),
};

const mockGmailTwinInstance = {
  start: jest.fn(),
  stop: jest.fn(),
  getEmulatorHost: jest.fn().mockReturnValue('http://localhost:9014'),
  isHealthy: jest.fn().mockResolvedValue(true),
  getEmails: jest.fn().mockReturnValue([]),
  reset: jest.fn(),
  setErrorMode: jest.fn(),
};

const mockInterceptorInstance = {
  install: jest.fn(),
  uninstall: jest.fn(),
  isActive: jest.fn().mockReturnValue(true),
};

jest.mock('@open-kingdom/shared-backend-integration-test-doubles', () => {
  const original = jest.requireActual(
    '@open-kingdom/shared-backend-integration-test-doubles'
  );
  return {
    ...original,
    GcsTwin: jest.fn().mockImplementation(() => mockGcsTwinInstance),
    NodeInterceptor: jest
      .fn()
      .mockImplementation(() => mockInterceptorInstance),
  };
});

jest.mock('@open-kingdom/shared-backend-feature-email/twin', () => {
  return {
    GmailTwinServer: jest.fn().mockImplementation(() => mockGmailTwinInstance),
  };
});

describe('TwinService', () => {
  let service: TwinService;

  const mockGcsStorage = {
    resetErrorMode: jest.fn(),
    getErrorModeState: jest.fn().mockReturnValue({ active: false }),
    resetBuckets: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwinService,
        {
          provide: GcsStorageService,
          useValue: mockGcsStorage,
        },
      ],
    }).compile();

    service = module.get<TwinService>(TwinService);

    jest.clearAllMocks();
    mockGcsTwinInstance.start.mockResolvedValue(undefined);
    mockGcsTwinInstance.stop.mockResolvedValue(undefined);
    mockGcsTwinInstance.isHealthy.mockResolvedValue(true);

    mockGmailTwinInstance.start.mockResolvedValue(undefined);
    mockGmailTwinInstance.stop.mockResolvedValue(undefined);
    mockGmailTwinInstance.isHealthy.mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('start', () => {
    it('should start twins and install interceptor successfully', async () => {
      const res = await service.start();
      expect(res.success).toBe(true);
      expect(mockGcsTwinInstance.start).toHaveBeenCalled();
      expect(mockGmailTwinInstance.start).toHaveBeenCalled();
      expect(mockInterceptorInstance.install).toHaveBeenCalled();
    });

    it('should handle failure during start and perform cleanup', async () => {
      mockGmailTwinInstance.start.mockRejectedValue(
        new Error('Port collision')
      );

      const res = await service.start();
      expect(res.success).toBe(false);
      expect(res.message).toContain('Port collision');
      expect(mockGcsTwinInstance.stop).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop twins and uninstall interceptor cleanly', async () => {
      // Mock started state
      await service.start();

      const res = await service.stop();
      expect(res.success).toBe(true);
      expect(mockGcsStorage.resetErrorMode).toHaveBeenCalled();
      expect(mockInterceptorInstance.uninstall).toHaveBeenCalled();
      expect(mockGcsTwinInstance.stop).toHaveBeenCalled();
      expect(mockGmailTwinInstance.stop).toHaveBeenCalled();
    });

    it('should return successfully if already stopped', async () => {
      const res = await service.stop();
      expect(res.success).toBe(true);
      expect(res.message).toContain('was not running');
    });
  });

  describe('status', () => {
    it('should return not running when environment is not started', async () => {
      const status = await service.status();
      expect(status.running).toBe(false);
      expect(status.healthy).toBe(false);
    });

    it('should return healthy running status when all twins are up', async () => {
      await service.start();
      const status = await service.status();
      expect(status.running).toBe(true);
      expect(status.healthy).toBe(true);
      expect(status.gmail?.running).toBe(true);
    });

    it('should handle unhealthy twin components correctly', async () => {
      await service.start();
      mockGcsTwinInstance.isHealthy.mockResolvedValue(false);
      mockGmailTwinInstance.isHealthy.mockResolvedValue(false);

      const status = await service.status();
      expect(status.running).toBe(false);
      expect(status.healthy).toBe(false);
    });

    it('should handle exceptions thrown by healthy check', async () => {
      await service.start();
      mockGcsTwinInstance.isHealthy.mockRejectedValue(
        new Error('check failed')
      );

      const status = await service.status();
      expect(status.running).toBe(false);
      expect(status.healthy).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset GCS error mode and seed default buckets', async () => {
      mockGcsStorage.resetBuckets.mockResolvedValue(undefined);
      await service.reset();
      expect(mockGcsStorage.resetErrorMode).toHaveBeenCalled();
      expect(mockGcsStorage.resetBuckets).toHaveBeenCalled();
    });
  });

  describe('Gmail delegation methods', () => {
    it('should fetch emails from Gmail twin server', async () => {
      const mockEmails = [{ id: '1' }, { id: '2' }] as any;
      mockGmailTwinInstance.getEmails.mockResolvedValue(mockEmails);

      await service.start();
      const emails = await service.getGmailEmails();
      expect(emails).toEqual(mockEmails);
    });

    it('should return empty list if Gmail twin is not initialized', async () => {
      const emails = await service.getGmailEmails();
      expect(emails).toEqual([]);
    });

    it('should reset Gmail twin mailbox', async () => {
      await service.start();
      await service.resetGmail();
      expect(mockGmailTwinInstance.reset).toHaveBeenCalled();
    });

    it('should not reset if Gmail twin is not initialized', async () => {
      await service.resetGmail();
      expect(mockGmailTwinInstance.reset).not.toHaveBeenCalled();
    });

    it('should configure error mode on Gmail twin', async () => {
      await service.start();
      await service.setGmailErrorMode('rate-limit');
      expect(mockGmailTwinInstance.setErrorMode).toHaveBeenCalledWith(
        'rate-limit'
      );
    });

    it('should not set error mode if Gmail twin is not initialized', async () => {
      await service.setGmailErrorMode('rate-limit');
      expect(mockGmailTwinInstance.setErrorMode).not.toHaveBeenCalled();
    });
  });

  describe('isRealGmailConfigured', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return false if credentials are missing', () => {
      delete process.env['GMAIL_CLIENT_EMAIL'];
      delete process.env['GMAIL_PRIVATE_KEY'];
      delete process.env['GMAIL_IMPERSONATE_EMAIL'];
      expect(service.isRealGmailConfigured()).toBe(false);
    });

    it('should return false if credentials contain mock default values', () => {
      process.env['GMAIL_CLIENT_EMAIL'] = 'mock@example.com';
      process.env['GMAIL_PRIVATE_KEY'] = 'test-key';
      process.env['GMAIL_IMPERSONATE_EMAIL'] = 'test@example.com';
      expect(service.isRealGmailConfigured()).toBe(false);
    });

    it('should return true if credentials are valid and non-mock', () => {
      process.env['GMAIL_CLIENT_EMAIL'] =
        'service-account@prod-project.iam.gserviceaccount.com';
      process.env['GMAIL_PRIVATE_KEY'] =
        '-----BEGIN PRIVATE KEY-----\nMIIEvg...';
      process.env['GMAIL_IMPERSONATE_EMAIL'] = 'user@prod-domain.com';
      expect(service.isRealGmailConfigured()).toBe(true);
    });
  });
});
