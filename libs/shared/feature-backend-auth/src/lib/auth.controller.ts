import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User } from '@ynaa/shared-data-access-backend-users';

import { AuthenticationService } from './authentication.service';

export interface RequestWithUser extends Request {
  user: Omit<User, 'password'>;
  logout: () => void;
}

@Controller()
export class AuthController {
  /* c8 ignore next */
  constructor(private authenticationService: AuthenticationService) {}

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  /* c8 ignore next */
  async login(@Request() req: RequestWithUser) {
    return this.authenticationService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  /* c8 ignore next */
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
