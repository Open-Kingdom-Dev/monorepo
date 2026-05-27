import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  HttpException,
  HttpStatus,
  Query,
  HttpCode,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { GmailTwinServerService } from './gmail-twin-server.service.js';
import { BearerJwtGuard } from './bearer-jwt.guard.js';
import { CapturedEmail } from './email-store.js';
import { GmailTwinErrorMode } from '../email.types.js';

interface SendEmailBody {
  raw?: string;
}

interface ErrorModeBody {
  mode: GmailTwinErrorMode | null;
}

@Controller()
export class GmailTwinServerController {
  constructor(private readonly service: GmailTwinServerService) {}

  @Post('/gmail/v1/users/me/messages/send')
  @UseGuards(BearerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Body() body: SendEmailBody,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ id: string; threadId: string; labelIds: string[] }> {
    const { raw } = body;
    if (!raw) {
      throw new HttpException(
        {
          error: {
            code: HttpStatus.BAD_REQUEST,
            message: 'Missing raw message field',
          },
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const email = await this.service.sendEmail(raw, res);
      return {
        id: email.id,
        threadId: email.threadId,
        labelIds: ['SENT'],
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        {
          error: {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: String(err),
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('/test/gmail/error-mode')
  @HttpCode(HttpStatus.OK)
  setErrorMode(@Body() body: ErrorModeBody): {
    success: boolean;
    mode: GmailTwinErrorMode | null;
  } {
    const { mode } = body;
    const validModes: (GmailTwinErrorMode | null)[] = [
      'insufficient-permissions',
      'rate-limit',
      'invalid-recipient',
      null,
    ];

    if (!validModes.includes(mode)) {
      throw new HttpException(
        {
          error: {
            code: HttpStatus.BAD_REQUEST,
            message: `Invalid error mode. Supported modes: 'insufficient-permissions', 'rate-limit', 'invalid-recipient', null`,
          },
        },
        HttpStatus.BAD_REQUEST
      );
    }

    this.service.setErrorMode(mode);
    return { success: true, mode };
  }

  @Delete('/test/gmail/error-mode')
  @HttpCode(HttpStatus.OK)
  clearErrorMode(): { success: boolean; mode: null } {
    this.service.setErrorMode(null);
    return { success: true, mode: null };
  }

  @Get('/test/gmail/health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Post('/test/gmail/reset')
  @HttpCode(HttpStatus.OK)
  reset(): { success: boolean } {
    this.service.reset();
    return { success: true };
  }

  @Get('/test/gmail/emails')
  getEmails(@Query('to') to?: string): CapturedEmail[] {
    return this.service.getEmails(to);
  }

  @Post(['/token', '/oauth2/v4/token', '/oauth2/v3/token'])
  @HttpCode(HttpStatus.OK)
  mockToken() {
    return {
      access_token: 'mock-twin-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }
}
