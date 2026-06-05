import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { YouTubeTwinService } from './youtube-twin.service.js';
import {
  YouTubeTwinStatusDto,
  YouTubeTwinStartResponseDto,
  YouTubeTwinStopResponseDto,
} from './youtube-twin.dto.js';

@ApiTags('YouTube Twin')
@Controller('youtube-twin')
export class YouTubeTwinController {
  constructor(private readonly youtubeTwinService: YouTubeTwinService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get YouTube twin status',
    description:
      'Returns the current status of the YouTube twin (running, healthy, port, URL) and the active error mode state.',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube twin status retrieved successfully',
    type: YouTubeTwinStatusDto,
  })
  async getStatus(): Promise<YouTubeTwinStatusDto> {
    return await this.youtubeTwinService.status();
  }

  @Public()
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start YouTube twin',
    description: 'Starts the YouTube Express twin server.',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube twin started successfully',
    type: YouTubeTwinStartResponseDto,
  })
  async start(): Promise<YouTubeTwinStartResponseDto> {
    return await this.youtubeTwinService.start();
  }

  @Public()
  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop YouTube twin',
    description: 'Stops the YouTube twin Express server.',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube twin stopped successfully',
    type: YouTubeTwinStopResponseDto,
  })
  async stop(): Promise<YouTubeTwinStopResponseDto> {
    return await this.youtubeTwinService.stop();
  }

  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset YouTube twin',
    description:
      'Resets the YouTube twin search fixtures and deactivates any simulated error modes.',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube twin state reset successfully',
  })
  async reset(): Promise<{ success: boolean; message: string }> {
    await this.youtubeTwinService.reset();
    return { success: true, message: 'YouTube twin state reset successfully' };
  }
}
