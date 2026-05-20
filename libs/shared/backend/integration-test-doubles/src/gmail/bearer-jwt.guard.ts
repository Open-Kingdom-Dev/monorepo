import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BearerJwtGuard implements CanActivate {
  private readonly jwtService = new JwtService();

  canActivate(context: ExecutionContext): boolean {
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
