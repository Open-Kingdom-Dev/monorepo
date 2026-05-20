import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { GmailTwinService } from './gmail-twin.service.js';
import { BearerJwtGuard } from './bearer-jwt.guard.js';
import { CapturedEmail } from './email-store.js';

interface SendEmailBody {
  raw?: string;
}

@Controller()
export class GmailTwinController {
  constructor(private readonly service: GmailTwinService) {}

  @Post('/gmail/v1/users/me/messages/send')
  @UseGuards(BearerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async sendEmail(
    @Body() body: SendEmailBody
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
      const email = await this.service.sendEmail(raw);
      return {
        id: email.id,
        threadId: email.threadId,
        labelIds: ['SENT'],
      };
    } catch (err) {
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
}
