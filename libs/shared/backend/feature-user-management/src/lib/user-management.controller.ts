import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '@open-kingdom/shared-backend-data-access-users';
import { InvitationsService } from './invitations/invitations.service.js';
import { Roles } from './decorators/index.js';
import { RolesGuard } from './guards/index.js';
import {
  InviteUserDto,
  InviteUserResponseDto,
} from './invitations/dto/index.js';

interface RequestWithUser extends Request {
  user: { id: number; email: string; role?: string };
}

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class UserManagementController {
  constructor(
    private readonly usersService: UsersService,
    private readonly invitationsService: InvitationsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200 })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser
  ) {
    if (req.user.id === id) {
      throw new ForbiddenException('Cannot delete yourself');
    }
    await this.usersService.delete(id);
    return { success: true };
  }

  @Post('invite')
  @ApiOperation({ summary: 'Send an invitation to a new user' })
  @ApiBody({ type: InviteUserDto })
  @ApiResponse({ status: 201, type: InviteUserResponseDto })
  async invite(
    @Body() dto: InviteUserDto,
    @Request() req: RequestWithUser
  ): Promise<InviteUserResponseDto> {
    return this.invitationsService.invite(dto, req.user.id);
  }
}
