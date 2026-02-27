import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from '../services';
import { InviteUserDto, AcceptInvitationDto } from '../dto';
import type { AuthenticatedRequest } from '../types';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('invite')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Invite a new user',
    description: 'Send an invitation to a new user. Requires authentication.',
  })
  @ApiBody({ type: InviteUserDto })
  @ApiResponse({
    status: 201,
    description: 'Invitation created successfully',
  })
  @ApiBadRequestResponse({
    description: 'User already exists or pending invitation exists',
  })
  @ApiResponse({
    status: 502,
    description: 'Email delivery failed — invitation rolled back',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async invite(
    @Body() dto: InviteUserDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.invitationsService.invite(
      dto.email,
      dto.role ?? 'guest',
      req.user.id
    );
  }

  @Get('validate/:token')
  @ApiOperation({
    summary: 'Validate an invitation token',
    description: 'Check if an invitation token is valid and not expired',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        email: { type: 'string', nullable: true },
        role: {
          type: 'string',
          enum: ['guest', 'user', 'admin'],
          nullable: true,
        },
      },
    },
  })
  async validate(@Param('token') token: string) {
    return this.invitationsService.validate(token);
  }

  @Post('accept')
  @ApiOperation({
    summary: 'Accept an invitation',
    description: 'Accept an invitation and create a new user account',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired invitation token',
  })
  async accept(@Body() dto: AcceptInvitationDto) {
    const user = await this.invitationsService.accept(
      dto.token,
      dto.password,
      dto.firstName,
      dto.lastName
    );

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
