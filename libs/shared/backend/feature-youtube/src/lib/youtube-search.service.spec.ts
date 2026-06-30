/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { YoutubeSearchService } from './youtube-search.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YoutubeSearchService', () => {
  let service: YoutubeSearchService;

  beforeEach(async () => {
    process.env.TEST_MODE = 'true';
    const module: TestingModule = await Test.createTestingModule({
      providers: [YoutubeSearchService],
    }).compile();

    service = module.get<YoutubeSearchService>(YoutubeSearchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should successfully query the search endpoint using axios with fetch adapter', async () => {
      const mockResult = {
        kind: 'youtube#searchListResponse',
        items: [],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockResult,
      });

      const result = await service.search('meditation', 3);
      expect(result).toEqual(mockResult);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/youtube/v3/search?q=meditation&maxResults=3'),
        expect.objectContaining({ adapter: 'fetch' })
      );
    });

    it('should throw BadRequestException if query is empty', async () => {
      await expect(service.search('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if axios call fails', async () => {
      mockedAxios.get.mockRejectedValue({
        message: 'Invalid API Key',
        response: {
          status: 400,
          data: {
            error: { message: 'Invalid API Key' },
          },
        },
      });

      await expect(service.search('yoga')).rejects.toThrow('Invalid API Key');
    });

    it('should throw generic message if error response has no detailed message', async () => {
      mockedAxios.get.mockRejectedValue({
        message: 'Network Error',
      });
      await expect(service.search('yoga')).rejects.toThrow('Network Error');
    });

    it('should query real API and succeed if YOUTUBE_API_KEY is configured in production mode', async () => {
      process.env.TEST_MODE = 'false';
      process.env.YOUTUBE_API_KEY = 'real-prod-key';
      const mockResult = {
        kind: 'youtube#searchListResponse',
        items: [],
      };

      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: mockResult,
      });

      const result = await service.search('meditation', 3);
      expect(result).toEqual(mockResult);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://www.googleapis.com/youtube/v3/search?q=meditation&maxResults=3&key=real-prod-key'
        ),
        expect.objectContaining({ adapter: 'fetch' })
      );
    });

    it('should throw InternalServerErrorException in production mode if YOUTUBE_API_KEY is not configured', async () => {
      process.env.TEST_MODE = 'false';
      delete process.env.YOUTUBE_API_KEY;

      await expect(service.search('yoga')).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.search('yoga')).rejects.toThrow(
        'YOUTUBE_API_KEY environment variable is not configured.'
      );
    });
  });

  describe('errorMode management', () => {
    it('should set error mode and propagate it to twin', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { active: true, mode: 'daily-limit-exceeded' },
      });

      const state = await service.setErrorMode({
        type: 'daily-limit-exceeded',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:9016/test/youtube/error-mode',
        { mode: 'daily-limit-exceeded' }
      );
      expect(state.active).toBe(true);
      expect(state.type).toBe('daily-limit-exceeded');
    });

    it('should handle twin propagation failure gracefully when setting error mode', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Twin unreachable'));
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { active: true, mode: 'daily-limit-exceeded' },
      });

      const state = await service.setErrorMode({
        type: 'daily-limit-exceeded',
      });
      expect(state.active).toBe(true);
    });

    it('should clear error mode and propagate to twin', async () => {
      mockedAxios.delete.mockResolvedValue({
        status: 200,
        data: { success: true },
      });
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { active: false, mode: null },
      });

      const state = await service.clearErrorMode();
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:9016/test/youtube/error-mode'
      );
      expect(state.active).toBe(false);
      expect(state.type).toBeNull();
    });

    it('should handle twin propagation failure gracefully when clearing error mode', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Twin unreachable'));
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { active: false, mode: null },
      });

      const state = await service.clearErrorMode();
      expect(state.active).toBe(false);
    });

    it('should reset error mode', async () => {
      mockedAxios.delete.mockResolvedValue({ status: 200 });
      await service.resetErrorMode();
    });

    it('should handle twin propagation failure when resetting error mode', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Twin unreachable'));
      await service.resetErrorMode();
    });
  });

  describe('describeMode branches', () => {
    const errorModes = [
      {
        type: 'daily-limit-exceeded' as const,
        desc: 'Simulates 403 Daily Limit Exceeded for search requests.',
      },
      {
        type: 'invalid-api-key' as const,
        desc: 'Simulates 400 API key not valid for search requests.',
      },
      {
        type: 'empty-results' as const,
        desc: 'Simulates an empty search response (200 OK with no items).',
      },
      {
        type: 'player-error-2' as const,
        desc: 'Simulates YouTube Player error 2 (invalid parameter).',
      },
      {
        type: 'player-error-5' as const,
        desc: 'Simulates YouTube Player error 5 (HTML5 player error).',
      },
      {
        type: 'player-error-100' as const,
        desc: 'Simulates YouTube Player error 100 (video not found/removed).',
      },
      {
        type: 'player-error-101' as const,
        desc: 'Simulates YouTube Player error 101 (video playback not allowed in embedded players).',
      },
      {
        type: 'player-error-150' as const,
        desc: 'Simulates YouTube Player error 150 (same as 101, playback restriction).',
      },
      { type: 'unknown-error-mode' as any, desc: 'Simulated error mode' },
    ];

    errorModes.forEach(({ type, desc }) => {
      it(`should correctly describe mode: ${type}`, async () => {
        mockedAxios.get.mockResolvedValue({
          status: 200,
          data: { active: true, mode: type },
        });
        const state = await service.getErrorModeState();
        expect(state.description).toBe(desc);
      });
    });
  });
});
