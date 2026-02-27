import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AuthenticationService } from './authentication.service';
import { Public } from './public.decorator';
import { LoginDto, LoginResponseDto, ProfileResponseDto } from './auth.dto';
import type { RequestWithUser } from './auth.types';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  /* c8 ignore next */
  constructor(private authenticationService: AuthenticationService) {}

  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password credentials',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      admin: {
        summary: 'Admin login',
        value: {
          email: 'admin@admin.com',
          password: 'admin',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials - email or password is incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  /* c8 ignore next */
  async login(@Request() req: RequestWithUser) {
    return this.authenticationService.login(req.user);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Returns the authenticated user profile. Requires a valid JWT token in the Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  /* c8 ignore next */
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
