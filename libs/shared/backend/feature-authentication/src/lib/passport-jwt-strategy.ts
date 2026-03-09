import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';

import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import {
  ROLE_RESOLVER,
  type RoleResolver,
} from '@open-kingdom/shared-backend-util-rbac';

export const JWT_CONSTANTS = 'JWT_CONSTANTS';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    @Inject(JWT_CONSTANTS) jwtConstants: { secret: string },
    @Optional()
    @Inject(ROLE_RESOLVER)
    private roleResolver?: RoleResolver
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
    const role = (await this.roleResolver?.findPrimaryRole(user.id)) ?? null;
    const permissions =
      (await this.roleResolver?.findPermissions(user.id)) ?? [];

    return { ...userWithoutPassword, role, permissions };
  }
}
