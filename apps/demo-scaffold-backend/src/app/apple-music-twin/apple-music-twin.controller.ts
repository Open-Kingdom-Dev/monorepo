import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { AppleMusicTwinService } from './apple-music-twin.service.js';
import {
  AppleMusicTwinStatusDto,
  AppleMusicTwinStartResponseDto,
  AppleMusicTwinStopResponseDto,
  AppleMusicErrorModeStateDto,
} from './apple-music-twin.dto.js';

@ApiTags('Apple Music Twin')
@Controller('apple-music-twin')
export class AppleMusicTwinController {
  constructor(private readonly appleMusicTwinService: AppleMusicTwinService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get Apple Music twin status',
    description: 'Returns the current status of the Apple Music twin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Apple Music twin status retrieved successfully',
    type: AppleMusicTwinStatusDto,
  })
  async getStatus(): Promise<AppleMusicTwinStatusDto> {
    return await this.appleMusicTwinService.status();
  }

  @Public()
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start Apple Music twin',
    description: 'Starts the Apple Music twin Express server.',
  })
  @ApiResponse({
    status: 200,
    description: 'Apple Music twin started successfully',
    type: AppleMusicTwinStartResponseDto,
  })
  async start(): Promise<AppleMusicTwinStartResponseDto> {
    return await this.appleMusicTwinService.start();
  }

  @Public()
  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop Apple Music twin',
    description: 'Stops the Apple Music twin Express server.',
  })
  @ApiResponse({
    status: 200,
    description: 'Apple Music twin stopped successfully',
    type: AppleMusicTwinStopResponseDto,
  })
  async stop(): Promise<AppleMusicTwinStopResponseDto> {
    return await this.appleMusicTwinService.stop();
  }

  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset Apple Music twin',
    description: 'Resets the Apple Music twin catalog fixtures and auth state.',
  })
  @ApiResponse({
    status: 200,
    description: 'Apple Music twin state reset successfully',
  })
  async reset(): Promise<{ success: boolean; message: string }> {
    await this.appleMusicTwinService.reset();
    return {
      success: true,
      message: 'Apple Music twin state reset successfully',
    };
  }

  @Public()
  @Post('error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set Apple Music twin error mode',
    description:
      'Configures a simulated error mode (unauthorized, rate-limited, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'Apple Music twin error mode configured successfully',
  })
  async setErrorMode(
    @Body() dto: AppleMusicErrorModeStateDto
  ): Promise<{ success: boolean }> {
    if (!dto.mode) {
      throw new BadRequestException('Error mode is required');
    }
    await this.appleMusicTwinService.setErrorMode(dto.mode);
    return { success: true };
  }

  @Public()
  @Delete('error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear Apple Music twin error mode',
    description: 'Clears any simulated error mode on the Apple Music twin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Apple Music twin error mode cleared successfully',
  })
  async clearErrorMode(): Promise<{ success: boolean }> {
    await this.appleMusicTwinService.clearErrorMode();
    return { success: true };
  }
}
