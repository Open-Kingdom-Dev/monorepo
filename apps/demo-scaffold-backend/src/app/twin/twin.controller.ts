import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { TwinService } from './twin.service';

@ApiTags('Twin')
@Controller('twin')
export class TwinController {
  constructor(private readonly twinService: TwinService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get twin status',
    description:
      'Returns the current status of the GCS twin (running, healthy, port, and URL)',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        running: { type: 'boolean', example: true },
        healthy: { type: 'boolean', example: true },
        port: { type: 'number', example: 9013 },
        url: { type: 'string', example: 'http://localhost:9013' },
      },
    },
  })
  async getStatus() {
    return await this.twinService.status();
  }

  @Public()
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start twin',
    description:
      'Starts the GCS twin Docker container and seeds initial data. Requires Docker to be running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin started successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'GCS twin started on port 9013' },
        url: { type: 'string', example: 'http://localhost:9013' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to start twin',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Failed to start GCS twin: Docker is not running',
        },
      },
    },
  })
  async start() {
    return await this.twinService.start();
  }

  @Public()
  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop twin',
    description: 'Stops the GCS twin Docker container.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin stopped successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'GCS twin stopped' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to stop twin',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Failed to stop GCS twin: Container not found',
        },
      },
    },
  })
  async stop() {
    return await this.twinService.stop();
  }
}
