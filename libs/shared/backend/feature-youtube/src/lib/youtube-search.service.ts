import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

interface AxiosLikeError {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
  message?: string;
}
import {
  NodeInterceptor,
  RoutingTable,
  defaultRoutingEntries,
  isTestMode,
} from '@open-kingdom/shared-backend-integration-test-doubles';
import {
  YoutubeActivateErrorModeDto,
  YoutubeErrorModeStateDto,
  YoutubeErrorModeType,
} from './youtube-error-mode.dto.js';
import { YoutubeSearchResponseDto } from './youtube-search.dto.js';
import axios from 'axios';

@Injectable()
export class YoutubeSearchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(YoutubeSearchService.name);
  private interceptor: NodeInterceptor | null = null;

  private get port(): number {
    return parseInt(process.env.YOUTUBE_TWIN_PORT || '9016', 10);
  }

  private get twinUrl(): string {
    return `http://localhost:${this.port}`;
  }

  onModuleInit() {
    if (isTestMode()) {
      // Filter out Gmail and OAuth entries — only intercept YouTube hosts in tests
      const youtubeEntries = defaultRoutingEntries.filter(
        (entry) =>
          entry.hostname.includes('youtube') ||
          entry.hostname === 'www.googleapis.com'
      );
      const table = new RoutingTable(youtubeEntries);
      this.interceptor = new NodeInterceptor(table);
      this.interceptor.install();
      this.logger.log(
        'NodeInterceptor installed for YouTube search (Test Mode)'
      );
    } else {
      this.logger.log(
        'YouTube search service initialized in production mode (no interceptor)'
      );
    }
  }

  onModuleDestroy() {
    if (this.interceptor) {
      this.interceptor.uninstall();
      this.logger.log('NodeInterceptor uninstalled');
    }
  }

  async search(
    query: string,
    maxResults = 5
  ): Promise<YoutubeSearchResponseDto> {
    if (!query?.trim()) {
      throw new BadRequestException('Search query is required');
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const useTwin = isTestMode() || !apiKey;

    const baseUrl = useTwin
      ? `${this.twinUrl}/youtube/v3/search`
      : 'https://www.googleapis.com/youtube/v3/search';

    const key = useTwin ? 'mock-api-key' : apiKey;

    const url = `${baseUrl}?q=${encodeURIComponent(
      query
    )}&maxResults=${maxResults}&key=${key}`;

    try {
      // Use adapter: 'fetch' to ensure NodeInterceptor catches it in tests
      const response = await axios.get(url, { adapter: 'fetch' });
      return response.data as YoutubeSearchResponseDto;
    } catch (error) {
      const err = error as AxiosLikeError;
      this.logger.error(`YouTube search failed:`, error);
      const message = err.response?.data?.error?.message || err.message;
      throw new BadRequestException(message);
    }
  }

  async setErrorMode(
    dto: YoutubeActivateErrorModeDto
  ): Promise<YoutubeErrorModeStateDto> {
    if (!dto.type) {
      throw new BadRequestException('Error mode type is required');
    }
    this.logger.log(`Error mode activated: ${dto.type}`);

    try {
      await axios.post(`${this.twinUrl}/test/youtube/error-mode`, {
        mode: dto.type,
      });
    } catch (error) {
      const err = error as AxiosLikeError;
      this.logger.warn(
        `Could not propagate error mode to twin: ${err.message}`
      );
    }

    return await this.getErrorModeState();
  }

  async clearErrorMode(): Promise<YoutubeErrorModeStateDto> {
    this.logger.log('Error mode deactivated');

    try {
      await axios.delete(`${this.twinUrl}/test/youtube/error-mode`);
    } catch (error) {
      const err = error as AxiosLikeError;
      this.logger.warn(`Could not clear error mode on twin: ${err.message}`);
    }

    return await this.getErrorModeState();
  }

  async getErrorModeState(): Promise<YoutubeErrorModeStateDto> {
    try {
      const response = await axios.get(
        `${this.twinUrl}/test/youtube/error-mode`
      );
      if (response.status === 200 && response.data) {
        const { active, mode } = response.data;
        return {
          active,
          type: mode as YoutubeErrorModeType,
          description: mode
            ? this.describeMode(mode as YoutubeErrorModeType)
            : null,
        };
      }
    } catch (error) {
      const err = error as AxiosLikeError;
      this.logger.warn(
        `Could not fetch error mode state from twin: ${err.message}`
      );
    }
    return { active: false, type: null, description: null };
  }

  async resetErrorMode(): Promise<void> {
    this.logger.log('Error mode reset');
    try {
      await axios.delete(`${this.twinUrl}/test/youtube/error-mode`);
    } catch (error) {
      const err = error as AxiosLikeError;
      this.logger.warn(`Could not clear error mode on twin: ${err.message}`);
    }
  }

  private describeMode(type: YoutubeErrorModeType): string {
    switch (type) {
      case 'daily-limit-exceeded':
        return 'Simulates 403 Daily Limit Exceeded for search requests.';
      case 'invalid-api-key':
        return 'Simulates 400 API key not valid for search requests.';
      case 'empty-results':
        return 'Simulates an empty search response (200 OK with no items).';
      case 'player-error-2':
        return 'Simulates YouTube Player error 2 (invalid parameter).';
      case 'player-error-5':
        return 'Simulates YouTube Player error 5 (HTML5 player error).';
      case 'player-error-100':
        return 'Simulates YouTube Player error 100 (video not found/removed).';
      case 'player-error-101':
        return 'Simulates YouTube Player error 101 (video playback not allowed in embedded players).';
      case 'player-error-150':
        return 'Simulates YouTube Player error 150 (same as 101, playback restriction).';
      default:
        return 'Simulated error mode';
    }
  }
}
