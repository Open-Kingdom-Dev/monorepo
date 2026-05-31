import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { TwinService } from './twin.service';
import {
  TwinStatusDto,
  TwinStartResponseDto,
  TwinStopResponseDto,
  GmailTwinCapturedEmailDto,
  GmailTwinResetResponseDto,
  SetGmailErrorModeDto,
  GmailTwinErrorModeResponseDto,
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
      'Returns the current status of the GCS twin (running, healthy, port, URL) along with active error mode state, Gmail REST mock, and global interception hooks.',
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
    summary: 'Start twin environment',
    description:
      'Starts GCS twin Docker container, NestJS Gmail mock server, and installs global interception hooks. Requires Docker to be running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin environment started successfully',
    type: TwinStartResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to start twin environment',
    type: TwinStartResponseDto,
  })
  async start(): Promise<TwinStartResponseDto> {
    return await this.twinService.start();
  }

  @Public()
  @Post('stop')
  @ApiOperation({
    summary: 'Stop twin environment',
    description:
      'Gracefully cleans up GCS container, Gmail mock server, and removes interceptor hook.',
  })
  @ApiResponse({
    status: 200,
    description: 'Twin environment stopped successfully',
    type: TwinStopResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to stop twin environment',
    type: TwinStopResponseDto,
  })
  async stop(): Promise<TwinStopResponseDto> {
    return await this.twinService.stop();
  }

  @Public()
  @Get('gmail/emails')
  @ApiOperation({
    summary: 'Get intercepted emails',
    description:
      'Fetches structured emails intercepted in-memory by Gmail digital twin.',
  })
  @ApiResponse({
    status: 200,
    type: [GmailTwinCapturedEmailDto],
    description: 'Intercepted emails retrieved successfully',
  })
  async getGmailEmails(): Promise<GmailTwinCapturedEmailDto[]> {
    return await this.twinService.getGmailEmails();
  }

  @Public()
  @Post('gmail/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset mailbox',
    description: 'Clears the list of stored emails inside the local twin.',
  })
  @ApiResponse({
    status: 200,
    type: GmailTwinResetResponseDto,
    description: 'Gmail mailbox reset successfully',
  })
  async resetGmail(): Promise<GmailTwinResetResponseDto> {
    await this.twinService.resetGmail();
    return { success: true, message: 'Gmail mailbox reset successfully' };
  }

  @Public()
  @Post('gmail/error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Configure error injection mode',
    description:
      'Changes the active simulated error state for standard REST endpoint handlers.',
  })
  @ApiResponse({
    status: 200,
    type: GmailTwinErrorModeResponseDto,
    description: 'Gmail twin error mode configured successfully',
  })
  async setGmailErrorMode(
    @Body() body: SetGmailErrorModeDto
  ): Promise<GmailTwinErrorModeResponseDto> {
    const { mode } = body;
    let mappedMode:
      | 'insufficient-permissions'
      | 'rate-limit'
      | 'invalid-recipient'
      | null = null;
    if (mode === 'rate-limit') mappedMode = 'rate-limit';
    else if (mode === 'auth-error') mappedMode = 'insufficient-permissions';
    else if (mode === 'bad-request') mappedMode = 'invalid-recipient';

    await this.twinService.setGmailErrorMode(mappedMode);
    return {
      success: true,
      message: `Gmail twin error mode configured to: ${mode}`,
    };
  }
}
