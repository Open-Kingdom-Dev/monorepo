import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    summary: 'Get Google OAuth authorization URL / Initiate OAuth login',
    description:
      'Returns auth URL endpoint or initiates sign-in redirect via Passport against local emulator.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization endpoint ready',
  })
  getLoginUrl(): { authUrl: string } {
    return { authUrl: '/api/google-auth-emulate/login' };
  }

  @Public()
  @Get('login')
  @UseGuards(AuthGuard('google-emulate'))
  @ApiOperation({
    summary: 'Initiate Google OAuth login via Passport',
    description:
      'Redirects user to local Google emulator OAuth authorization page.',
  })
  login(): void {
    // Handled automatically by Passport AuthGuard redirect
  }

  @Public()
  @Get('callback')
  @UseGuards(AuthGuard('google-emulate'))
  @ApiOperation({
    summary: 'Google OAuth callback handler',
    description:
      'Passport receives authorization code from Google emulator, performs token exchange and userinfo fetch, and redirects back to frontend demo app.',
  })
  async callback(@Req() _req: Request, @Res() res: Response): Promise<void> {
    const frontendUrl = process.env['BASE_URL'] || 'http://localhost:4200';
    return res.redirect(`${frontendUrl}/google-auth-demo?auth=success`);
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
