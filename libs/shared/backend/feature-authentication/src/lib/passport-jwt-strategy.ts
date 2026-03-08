import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';

import { UsersService } from '@open-kingdom/shared-backend-data-access-users';

export const JWT_CONSTANTS = 'JWT_CONSTANTS';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    @Inject(JWT_CONSTANTS) jwtConstants: { secret: string }
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: { username: string; id: number }) {
    const user = await this.usersService.findOne(payload.username);
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
