/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeSearchController } from './youtube-search.controller.js';
import { YoutubeSearchService } from './youtube-search.service.js';
import { YoutubeActivateErrorModeDto } from './youtube-error-mode.dto.js';
import { YoutubeSearchResponseDto } from './youtube-search.dto.js';

describe('YoutubeSearchController', () => {
  let controller: YoutubeSearchController;
  let mockYoutubeSearchService: jest.Mocked<YoutubeSearchService>;

  beforeEach(async () => {
    mockYoutubeSearchService = {
      search: jest.fn(),
      setErrorMode: jest.fn(),
      clearErrorMode: jest.fn(),
      getErrorModeState: jest.fn(),
      resetErrorMode: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [YoutubeSearchController],
      providers: [
        {
          provide: YoutubeSearchService,
          useValue: mockYoutubeSearchService,
        },
      ],
    }).compile();

    controller = module.get<YoutubeSearchController>(YoutubeSearchController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should search for videos', async () => {
      const mockResponse: YoutubeSearchResponseDto = {
        kind: 'youtube#searchListResponse',
        etag: 'mock-etag',
        regionCode: 'US',
        pageInfo: { totalResults: 1, resultsPerPage: 1 },
        items: [],
      };

      mockYoutubeSearchService.search.mockResolvedValue(mockResponse);

      const result = await controller.search('yoga', '3');
      expect(result).toEqual(mockResponse);
      expect(mockYoutubeSearchService.search).toHaveBeenCalledWith('yoga', 3);
    });

    it('should throw if query is empty', async () => {
      await expect(controller.search('', '3')).rejects.toThrow(
        'Query parameter "q" is required'
      );
    });
  });

  describe('activateErrorMode', () => {
    it('should activate an error mode', async () => {
      const dto: YoutubeActivateErrorModeDto = {
        type: 'daily-limit-exceeded',
      };
      const expectedState = {
        active: true,
        type: 'daily-limit-exceeded' as const,
        description: 'Simulates 403 Daily Limit Exceeded for search requests.',
      };

      mockYoutubeSearchService.setErrorMode.mockResolvedValue(expectedState);

      const result = await controller.activateErrorMode(dto);
      expect(result).toEqual(expectedState);
      expect(mockYoutubeSearchService.setErrorMode).toHaveBeenCalledWith(dto);
    });
  });

  describe('deactivateErrorMode', () => {
    it('should deactivate the current error mode', async () => {
      const expectedState = {
        active: false,
        type: null,
        description: null,
      };

      mockYoutubeSearchService.clearErrorMode.mockResolvedValue(expectedState);

      const result = await controller.deactivateErrorMode();
      expect(result).toEqual(expectedState);
      expect(mockYoutubeSearchService.clearErrorMode).toHaveBeenCalled();
    });
  });
});
