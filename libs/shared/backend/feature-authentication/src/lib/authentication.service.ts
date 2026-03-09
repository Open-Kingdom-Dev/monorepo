import {
  Injectable,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import {
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';
import {
  ROLE_RESOLVER,
  type RoleResolver,
} from '@open-kingdom/shared-backend-util-rbac';

@Injectable()
export class AuthenticationService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Optional()
    @Inject(ROLE_RESOLVER)
    private roleResolver?: RoleResolver
  ) {}

  async validateUser(
    email: string,
    password: string
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: Omit<User, 'password'>): Promise<{ access_token: string }> {
    const role = (await this.roleResolver?.findPrimaryRole(user.id)) ?? null;
    const permissions =
      (await this.roleResolver?.findPermissions(user.id)) ?? [];
    const payload = { username: user.email, id: user.id, role, permissions };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
