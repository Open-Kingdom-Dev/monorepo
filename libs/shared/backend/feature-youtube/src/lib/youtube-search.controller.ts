import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { YoutubeSearchService } from './youtube-search.service.js';
import { YoutubeSearchResponseDto } from './youtube-search.dto.js';
import {
  YoutubeActivateErrorModeDto,
  YoutubeErrorModeStateDto,
} from './youtube-error-mode.dto.js';

@ApiTags('YouTube Search')
@Controller('youtube')
export class YoutubeSearchController {
  constructor(private readonly youtubeSearchService: YoutubeSearchService) {}

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'Search YouTube videos',
    description: 'Searches for videos using the YouTube Data API mock twin.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query string',
    example: 'yoga',
    required: true,
  })
  @ApiQuery({
    name: 'maxResults',
    description: 'Maximum number of results',
    example: 5,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: YoutubeSearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing query parameters or API error',
  })
  async search(
    @Query('q') q: string,
    @Query('maxResults') maxResults?: string
  ): Promise<YoutubeSearchResponseDto> {
    if (!q || !q.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    const limit = maxResults ? parseInt(maxResults, 10) : undefined;
    return this.youtubeSearchService.search(q, limit);
  }

  @Public()
  @Post('error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a YouTube error mode',
    description: 'Activates a YouTube error simulation mode.',
  })
  @ApiBody({
    type: YoutubeActivateErrorModeDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Error mode activated successfully',
    type: YoutubeErrorModeStateDto,
  })
  async activateErrorMode(
    @Body() dto: YoutubeActivateErrorModeDto
  ): Promise<YoutubeErrorModeStateDto> {
    return await this.youtubeSearchService.setErrorMode(dto);
  }

  @Public()
  @Delete('error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate current YouTube error mode',
    description: 'Deactivates the current YouTube error simulation mode.',
  })
  @ApiResponse({
    status: 200,
    description: 'Error mode deactivated successfully',
    type: YoutubeErrorModeStateDto,
  })
  async deactivateErrorMode(): Promise<YoutubeErrorModeStateDto> {
    return await this.youtubeSearchService.clearErrorMode();
  }
}
