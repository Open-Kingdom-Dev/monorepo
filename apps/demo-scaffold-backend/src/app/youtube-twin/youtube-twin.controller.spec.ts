import { Test, TestingModule } from '@nestjs/testing';
import { YouTubeTwinController } from './youtube-twin.controller.js';
import { YouTubeTwinService } from './youtube-twin.service.js';

describe('YouTubeTwinController', () => {
  let controller: YouTubeTwinController;
  let service: YouTubeTwinService;

  const mockYouTubeTwinService = {
    status: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YouTubeTwinController],
      providers: [
        {
          provide: YouTubeTwinService,
          useValue: mockYouTubeTwinService,
        },
      ],
    }).compile();

    controller = module.get<YouTubeTwinController>(YouTubeTwinController);
    service = module.get<YouTubeTwinService>(YouTubeTwinService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /youtube-twin/status', () => {
    it('should return youtube twin status', async () => {
      const expectedStatus = {
        running: true,
        healthy: true,
        port: 9016,
        url: 'http://localhost:9016',
        errorMode: { active: false, type: null, description: null },
      };
      mockYouTubeTwinService.status.mockResolvedValue(expectedStatus);

      const result = await controller.getStatus();

      expect(service.status).toHaveBeenCalled();
      expect(result).toEqual(expectedStatus);
    });
  });

  describe('POST /youtube-twin/start', () => {
    it('should start the twin successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'YouTube twin started on port 9016',
        url: 'http://localhost:9016',
      };
      mockYouTubeTwinService.start.mockResolvedValue(expectedResponse);

      const result = await controller.start();

      expect(service.start).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /youtube-twin/stop', () => {
    it('should stop the twin successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'YouTube twin stopped',
      };
      mockYouTubeTwinService.stop.mockResolvedValue(expectedResponse);

      const result = await controller.stop();

      expect(service.stop).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /youtube-twin/reset', () => {
    it('should reset the twin successfully', async () => {
      mockYouTubeTwinService.reset.mockResolvedValue(undefined);

      const result = await controller.reset();

      expect(service.reset).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'YouTube twin state reset successfully',
      });
    });
  });
});
