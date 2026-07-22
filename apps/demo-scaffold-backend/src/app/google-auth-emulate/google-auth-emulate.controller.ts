import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { GoogleAuthEmulateService } from './google-auth-emulate.service';
import {
  GoogleEmulatorStatusDto,
  GoogleOAuthResultDto,
  ApiLogEntryDto,
} from './google-auth-emulate.dto';

@ApiTags('Google Auth Emulate')
@Controller('google-auth-emulate')
export class GoogleAuthEmulateController {
  constructor(
    private readonly googleAuthEmulateService: GoogleAuthEmulateService
  ) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get Google OAuth emulator status',
    description:
      'Returns running status, port, health check result, and base URL of the local Google emulator.',
  })
  @ApiResponse({
    status: 200,
    type: GoogleEmulatorStatusDto,
  })
  async getStatus(): Promise<GoogleEmulatorStatusDto> {
    return await this.googleAuthEmulateService.status();
  }

  @Public()
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start Google OAuth emulator',
    description:
      'Launches Vercel Labs emulate Google service on port 9015 using local seed configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google emulator started',
  })
  async start() {
    return await this.googleAuthEmulateService.start();
  }

  @Public()
  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop Google OAuth emulator',
    description: 'Stops the Google emulator server cleanly.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google emulator stopped',
  })
  async stop() {
    return await this.googleAuthEmulateService.stop();
  }

  @Public()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset Google OAuth emulator state',
    description: 'Resets emulator seed data and clears captured API logs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google emulator reset',
  })
  async reset() {
    return await this.googleAuthEmulateService.reset();
  }

  @Public()
  @Get('login-url')
  @ApiOperation({
    summary: 'Get Google OAuth authorization URL',
    description:
      'Generates the OAuth authorize URL to trigger sign-in against the local emulator.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated',
  })
  getLoginUrl(): { authUrl: string } {
    return { authUrl: this.googleAuthEmulateService.getAuthorizationUrl() };
  }

  @Public()
  @Get('callback')
  @ApiOperation({
    summary: 'Google OAuth callback handler',
    description:
      'Receives authorization code from Google emulator, performs token exchange and userinfo fetch, and redirects back to frontend demo app.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'OAuth authorization code',
  })
  async callback(
    @Query('code') code: string,
    @Res() res: Response
  ): Promise<void> {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    try {
      await this.googleAuthEmulateService.handleCallback(code);
      // Redirect back to frontend demo page with success indicator
      const frontendUrl = process.env['BASE_URL'] || 'http://localhost:4200';
      return res.redirect(`${frontendUrl}/google-auth-demo?auth=success`);
    } catch (err) {
      const frontendUrl = process.env['BASE_URL'] || 'http://localhost:4200';
      const errorMessage = encodeURIComponent(
        err instanceof Error ? err.message : String(err)
      );
      return res.redirect(
        `${frontendUrl}/google-auth-demo?auth=error&message=${errorMessage}`
      );
    }
  }

  @Public()
  @Get('last-result')
  @ApiOperation({
    summary: 'Get last Google OAuth authentication result',
    description:
      'Returns tokens, user profile, and HTTP logs from the most recent OAuth sign-in flow.',
  })
  @ApiResponse({
    status: 200,
    type: GoogleOAuthResultDto,
  })
  getLastResult(): GoogleOAuthResultDto | null {
    return this.googleAuthEmulateService.getLastOAuthResult();
  }

  @Public()
  @Get('logs')
  @ApiOperation({
    summary: 'Get captured API logs',
    description:
      'Returns structured HTTP request/response log entries captured during OAuth interactions.',
  })
  @ApiResponse({
    status: 200,
    type: [ApiLogEntryDto],
  })
  getLogs(): ApiLogEntryDto[] {
    return this.googleAuthEmulateService.getLogs();
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign out / Clear Google OAuth session',
    description:
      'Clears the active Google OAuth session result in the backend.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google OAuth session cleared',
  })
  async logout() {
    return await this.googleAuthEmulateService.logout();
  }
}
