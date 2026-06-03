import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GMAIL_TWIN_CONFIG } from './constants.js';
import type { GmailTwinConfig } from './gmail-twin-server.config.js';

@Injectable()
export class BearerJwtGuard implements CanActivate {
  private readonly jwtService = new JwtService();

  constructor(
    @Inject(GMAIL_TWIN_CONFIG) private readonly config: GmailTwinConfig
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.disableAuth) {
      return true;
    }
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const auth = req.headers['authorization'];

    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new HttpException(
        {
          error: {
            code: HttpStatus.UNAUTHORIZED,
            message: 'Missing or invalid Bearer token',
          },
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    const token = auth.substring(7);
    const decoded = this.jwtService.decode(token);

    if (!decoded) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new HttpException(
          {
            error: {
              code: HttpStatus.UNAUTHORIZED,
              message: 'Token must be a structurally valid JWT',
            },
          },
          HttpStatus.UNAUTHORIZED
        );
      }
    }

    return true;
  }
}
