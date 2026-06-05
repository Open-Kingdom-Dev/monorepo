import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  YoutubeErrorModeManager,
  NodeInterceptor,
  RoutingTable,
  defaultRoutingEntries,
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

  constructor(private readonly errorModeManager: YoutubeErrorModeManager) {}

  private get port(): number {
    return parseInt(process.env.YOUTUBE_TWIN_PORT || '9016', 10);
  }

  private get twinUrl(): string {
    return `http://localhost:${this.port}`;
  }

  onModuleInit() {
    const table = new RoutingTable(defaultRoutingEntries);
    this.interceptor = new NodeInterceptor(table);
    this.interceptor.install();
    this.logger.log('NodeInterceptor installed for YouTube search');
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

    // Call googleapis.com/youtube/v3/search. The NodeInterceptor intercepts and rewrites this to the local twin.
    // We pass a mock API key because the twin requires a key parameter to match standard API expectations.
    const url = `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(
      query
    )}&maxResults=${maxResults}&key=mock-api-key`;

    try {
      // Use adapter: 'fetch' to ensure NodeInterceptor catches it
      const response = await axios.get(url, { adapter: 'fetch' });
      return response.data as YoutubeSearchResponseDto;
    } catch (error: any) {
      this.logger.error(`YouTube search failed:`, error);
      const message = error.response?.data?.error?.message || error.message;
      throw new BadRequestException(message);
    }
  }

  async setErrorMode(
    dto: YoutubeActivateErrorModeDto
  ): Promise<YoutubeErrorModeStateDto> {
    if (!dto.type) {
      throw new BadRequestException('Error mode type is required');
    }
    this.errorModeManager.setMode({ type: dto.type });
    this.logger.log(`Error mode activated: ${dto.type}`);

    // Propagate to the Express twin if it's running
    try {
      const response = await axios.post(
        `${this.twinUrl}/test/youtube/error-mode`,
        {
          mode: dto.type,
        }
      );
      if (response.status !== 200) {
        this.logger.warn(
          `Failed to propagate error mode to twin: ${response.statusText}`
        );
      }
    } catch (error: any) {
      this.logger.warn(
        `Could not propagate error mode to twin: ${error.message}`
      );
    }

    return this.getErrorModeState();
  }

  async clearErrorMode(): Promise<YoutubeErrorModeStateDto> {
    this.errorModeManager.clearMode();
    this.logger.log('Error mode deactivated');

    try {
      const response = await axios.delete(
        `${this.twinUrl}/test/youtube/error-mode`
      );
      if (response.status !== 200) {
        this.logger.warn(
          `Failed to clear error mode on twin: ${response.statusText}`
        );
      }
    } catch (error: any) {
      this.logger.warn(`Could not clear error mode on twin: ${error.message}`);
    }

    return this.getErrorModeState();
  }

  getErrorModeState(): YoutubeErrorModeStateDto {
    const mode = this.errorModeManager.getMode();
    if (!mode) {
      return { active: false, type: null, description: null };
    }
    return {
      active: true,
      type: mode.type as YoutubeErrorModeType,
      description: this.describeMode(mode.type as YoutubeErrorModeType),
    };
  }

  async resetErrorMode(): Promise<void> {
    this.errorModeManager.reset();
    this.logger.log('Error mode reset');

    try {
      await axios.delete(`${this.twinUrl}/test/youtube/error-mode`);
    } catch (error: any) {
      this.logger.warn(`Could not clear error mode on twin: ${error.message}`);
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
