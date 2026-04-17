import { Test, TestingModule } from '@nestjs/testing';
import { TwinController } from './twin.controller';
import { TwinService } from './twin.service';

describe('TwinController', () => {
  let controller: TwinController;
  let service: TwinService;

  const mockTwinService = {
    status: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwinController],
      providers: [
        {
          provide: TwinService,
          useValue: mockTwinService,
        },
      ],
    }).compile();

    controller = module.get<TwinController>(TwinController);
    service = module.get<TwinService>(TwinService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /twin/status', () => {
    it('should return twin status', async () => {
      const expectedStatus = {
        running: true,
        healthy: true,
        port: 9013,
        url: 'http://localhost:9013',
      };
      mockTwinService.status.mockResolvedValue(expectedStatus);

      const result = await controller.getStatus();

      expect(service.status).toHaveBeenCalled();
      expect(result).toEqual(expectedStatus);
    });

    it('should return not running status when twin is not active', async () => {
      const expectedStatus = {
        running: false,
        healthy: false,
        port: 9013,
      };
      mockTwinService.status.mockResolvedValue(expectedStatus);

      const result = await controller.getStatus();

      expect(result).toEqual(expectedStatus);
    });
  });

  describe('POST /twin/start', () => {
    it('should start the twin successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'GCS twin started on port 9013',
        url: 'http://localhost:9013',
      };
      mockTwinService.start.mockResolvedValue(expectedResponse);

      const result = await controller.start();

      expect(service.start).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should return error when start fails', async () => {
      const expectedResponse = {
        success: false,
        message: 'Failed to start GCS twin: Docker is not running',
      };
      mockTwinService.start.mockResolvedValue(expectedResponse);

      const result = await controller.start();

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /twin/stop', () => {
    it('should stop the twin successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'GCS twin stopped',
      };
      mockTwinService.stop.mockResolvedValue(expectedResponse);

      const result = await controller.stop();

      expect(service.stop).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should return error when stop fails', async () => {
      const expectedResponse = {
        success: false,
        message: 'Failed to stop GCS twin: Container not found',
      };
      mockTwinService.stop.mockResolvedValue(expectedResponse);

      const result = await controller.stop();

      expect(result).toEqual(expectedResponse);
    });
  });
});
