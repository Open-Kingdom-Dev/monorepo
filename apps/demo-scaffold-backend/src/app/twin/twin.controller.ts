import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { TwinService } from './twin.service';
import {
  TwinStatusDto,
  TwinStartResponseDto,
  TwinStopResponseDto,
} from './twin.dto';

@ApiTags('Twin')
@Controller('twin')
export class TwinController {
  constructor(private readonly twinService: TwinService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get twin status',
    description:
      'Returns the current status of the GCS twin (running, healthy, port, URL) and the active error mode state.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin status retrieved successfully',
    type: TwinStatusDto,
  })
  async getStatus(): Promise<TwinStatusDto> {
    return await this.twinService.status();
  }

  @Public()
  @Post('start')
  @ApiOperation({
    summary: 'Start twin',
    description:
      'Starts the GCS twin Docker container and seeds initial data. Requires Docker to be running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin started successfully',
    type: TwinStartResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to start twin',
    type: TwinStartResponseDto,
  })
  async start(): Promise<TwinStartResponseDto> {
    return await this.twinService.start();
  }

  @Public()
  @Post('stop')
  @ApiOperation({
    summary: 'Stop twin',
    description: 'Stops the GCS twin Docker container.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin stopped successfully',
    type: TwinStopResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to stop twin',
    type: TwinStopResponseDto,
  })
  async stop(): Promise<TwinStopResponseDto> {
    return await this.twinService.stop();
  }
}
