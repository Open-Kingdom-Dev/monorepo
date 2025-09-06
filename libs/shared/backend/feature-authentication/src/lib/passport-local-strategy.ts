import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { User } from '@ynaa/shared-backend-data-access-users';

import { AuthenticationService } from './authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticationService: AuthenticationService) {
    super();
  }

  async validate(
    username: string,
    password: string
  ): Promise<Omit<User, 'password'>> {
    const user = await this.authenticationService.validateUser(
      username,
      password
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
