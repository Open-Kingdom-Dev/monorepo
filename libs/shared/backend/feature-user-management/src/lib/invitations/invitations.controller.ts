import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service.js';
import {
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  ValidateTokenResponseDto,
} from './dto/index.js';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('validate/:token')
  @ApiOperation({ summary: 'Validate an invitation token' })
  @ApiResponse({ status: 200, type: ValidateTokenResponseDto })
  async validateToken(
    @Param('token') token: string
  ): Promise<ValidateTokenResponseDto> {
    return this.invitationsService.validateToken(token);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an invitation and create account' })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiResponse({ status: 201, type: AcceptInvitationResponseDto })
  async accept(
    @Body() dto: AcceptInvitationDto
  ): Promise<AcceptInvitationResponseDto> {
    return this.invitationsService.accept(
      dto.token,
      dto.password,
      dto.firstName,
      dto.lastName
    );
  }
}
