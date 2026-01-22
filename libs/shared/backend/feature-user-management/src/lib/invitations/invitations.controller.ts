import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { InvitationsService } from './invitations.service';
import {
  InviteUserDto,
  InviteUserResponseDto,
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  ValidateInvitationResponseDto,
} from './dto';

interface RequestWithUser extends Request {
  user: { id: number; email: string; role: string };
}

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('invite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Send invitation',
    description:
      'Send an invitation email to a new user. Requires authentication.',
  })
  @ApiBody({ type: InviteUserDto })
  @ApiResponse({
    status: 201,
    description: 'Invitation sent successfully',
    type: InviteUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User already exists or invitation already sent',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async invite(
    @Body() dto: InviteUserDto,
    @Request() req: RequestWithUser
  ): Promise<InviteUserResponseDto> {
    return this.invitationsService.invite(dto, req.user.id);
  }

  @Get('validate/:token')
  @ApiOperation({
    summary: 'Validate invitation token',
    description: 'Check if an invitation token is valid and not expired.',
  })
  @ApiParam({
    name: 'token',
    description: 'The invitation token to validate',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Token validation result',
    type: ValidateInvitationResponseDto,
  })
  async validate(
    @Param('token') token: string
  ): Promise<ValidateInvitationResponseDto> {
    return this.invitationsService.validate(token);
  }

  @Post('accept')
  @ApiOperation({
    summary: 'Accept invitation',
    description: 'Accept an invitation and create a new user account.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: AcceptInvitationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired invitation',
  })
  async accept(
    @Body() dto: AcceptInvitationDto
  ): Promise<AcceptInvitationResponseDto> {
    return this.invitationsService.accept(dto);
  }
}
